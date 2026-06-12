import express from 'express';
import { authUser } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { createReviewSchema } from '../middlewares/validation.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = express.Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a product review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, orderId, rating, comment]
 *             properties:
 *               productId: { type: string }
 *               orderId: { type: string }
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               title: { type: string }
 *               comment: { type: string }
 *               images: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Review created
 */

// Create review
router.post('/', authUser, validate(createReviewSchema), async (req, res) => {
    try {
        const {productId, orderId, rating, title, comment, images} = req.validatedData;
        
        // Verify order exists and belongs to user
        const order = await Order.findOne({
            _id: orderId,
            userId: req.user._id,
            deliveryStatus: 'delivered',
        });
        
        if (!order) {
            return res.status(400).json({
                success: false,
                message: 'Order not found or not delivered',
            });
        }
        
        // Check if product exists in order
        const hasProduct = order.items.some(item => item.product.toString() === productId);
        if (!hasProduct) {
            return res.status(400).json({
                success: false,
                message: 'Product not found in this order',
            });
        }
        
        // Check if review already exists
        const existingReview = await Review.findOne({
            userId: req.user._id,
            productId,
            orderId,
        });
        
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'Review already exists for this product and order',
            });
        }
        
        const review = new Review({
            userId: req.user._id,
            productId,
            orderId,
            rating,
            title,
            comment,
            images: images || [],
        });
        await review.save();
        
        // Update product rating
        const reviews = await Review.find({productId, isApproved: true});
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        await Product.findByIdAndUpdate(productId, {
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: reviews.length,
        });
        
        res.status(201).json({success: true, review});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get product reviews
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Product reviews returned
 */

// Get product reviews
router.get('/product/:productId', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const reviews = await Review.find({
            productId: req.params.productId,
            isApproved: true,
        })
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name avatar')
            .select('-__v');
        
        const total = await Review.countDocuments({
            productId: req.params.productId,
            isApproved: true,
        });
        
        // Get rating distribution
        const ratingDistribution = await Review.aggregate([
            {$match: {productId: new mongoose.Types.ObjectId(req.params.productId), isApproved: true}},
            {$group: {_id: '$rating', count: {$sum: 1}}},
            {$sort: {_id: -1}},
        ]);
        
        res.json({
            success: true,
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            ratingDistribution,
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/reviews/my:
 *   get:
 *     tags: [Reviews]
 *     summary: Get user's reviews
 *     responses:
 *       200:
 *         description: User reviews returned
 */

// Get user reviews
router.get('/my', authUser, async (req, res) => {
    try {
        const reviews = await Review.find({userId: req.user._id})
            .sort({createdAt: -1})
            .populate('productId', 'name images');
        res.json({success: true, reviews});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/reviews/{id}/helpful:
 *   post:
 *     tags: [Reviews]
 *     summary: Mark review as helpful
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Review marked as helpful
 */

// Mark review as helpful
router.post('/:id/helpful', authUser, async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            {$inc: {helpful: 1}},
            {new: true}
        );
        
        if (!review) {
            return res.status(404).json({success: false, message: 'Review not found'});
        }
        
        res.json({success: true, review});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/reviews/admin/all:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews (admin)
 *     parameters:
 *       - in: query
 *         name: isApproved
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: All reviews returned
 */

// Admin: Get all reviews
router.get('/admin/all', authUser, async (req, res) => {
    try {
        const {isApproved, page = 1, limit = 20} = req.query;
        const filter = {};
        
        if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
        
        const reviews = await Review.find(filter)
            .sort({createdAt: -1})
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('userId', 'name email')
            .populate('productId', 'name');
        
        const total = await Review.countDocuments(filter);
        
        res.json({
            success: true,
            reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/reviews/admin/{id}/approve:
 *   put:
 *     tags: [Reviews]
 *     summary: Approve or reject a review
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isApproved]
 *             properties:
 *               isApproved: { type: boolean }
 *     responses:
 *       200:
 *         description: Review approval status updated
 */

// Admin: Approve/reject review
router.put('/admin/:id/approve', authUser, async (req, res) => {
    try {
        const {isApproved} = req.body;
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            {isApproved},
            {new: true}
        );
        
        if (!review) {
            return res.status(404).json({success: false, message: 'Review not found'});
        }
        
        // Update product rating if approved
        if (isApproved) {
            const reviews = await Review.find({productId: review.productId, isApproved: true});
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            
            await Product.findByIdAndUpdate(review.productId, {
                rating: Math.round(avgRating * 10) / 10,
                reviewCount: reviews.length,
            });
        }
        
        res.json({success: true, review});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

export default router;
