import express from 'express';
import { authUser, authSeller } from '../middlewares/auth.js';
import Promotion from '../models/Promotion.js';
import PromotionUsage from '../models/PromotionUsage.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @swagger
 * /api/promotions/apply:
 *   post:
 *     tags: [Promotions]
 *     summary: Apply coupon code to order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, orderAmount]
 *             properties:
 *               code: { type: string }
 *               orderAmount: { type: number }
 *               productIds: { type: array, items: { type: string } }
 *               categoryIds: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 */

// Apply coupon
router.post('/apply', authUser, async (req, res) => {
    try {
        const {code, orderAmount, productIds, categoryIds} = req.body;
        
        const promotion = await Promotion.findOne({
            code: code.toUpperCase(),
            isActive: true,
            startDate: {$lte: new Date()},
            $or: [
                {endDate: null},
                {endDate: {$gte: new Date()}},
            ],
        });
        
        if (!promotion) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired coupon code',
            });
        }
        
        // Check usage limit
        if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
            return res.status(400).json({
                success: false,
                message: 'Coupon usage limit exceeded',
            });
        }
        
        // Check per-user limit
        const userUsageCount = await PromotionUsage.countDocuments({
            promotionId: promotion._id,
            userId: req.user._id,
        });
        
        if (userUsageCount >= promotion.perUserLimit) {
            return res.status(400).json({
                success: false,
                message: 'You have already used this coupon',
            });
        }
        
        // Check minimum order amount
        if (orderAmount < promotion.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount is ৳${promotion.minOrderAmount}`,
            });
        }
        
        // Check product/category applicability
        if (promotion.applicableProducts.length > 0) {
            const hasApplicableProduct = productIds.some(id => 
                promotion.applicableProducts.some(apId => apId.toString() === id)
            );
            if (!hasApplicableProduct) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon not applicable for these products',
                });
            }
        }
        
        if (promotion.applicableCategories.length > 0) {
            const hasApplicableCategory = categoryIds.some(id => 
                promotion.applicableCategories.some(acId => acId.toString() === id)
            );
            if (!hasApplicableCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon not applicable for these categories',
                });
            }
        }
        
        // Calculate discount
        let discount = 0;
        if (promotion.type === 'percentage') {
            discount = (orderAmount * promotion.value) / 100;
            if (promotion.maxDiscount) {
                discount = Math.min(discount, promotion.maxDiscount);
            }
        } else if (promotion.type === 'fixed') {
            discount = Math.min(promotion.value, orderAmount);
        } else if (promotion.type === 'free-delivery') {
            discount = 0; // Special handling for free delivery
        }
        
        res.json({
            success: true,
            promotion: {
                code: promotion.code,
                type: promotion.type,
                value: promotion.value,
                discount,
                description: promotion.description,
            },
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/promotions/validate/{code}:
 *   get:
 *     tags: [Promotions]
 *     summary: Validate coupon code (lightweight)
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Coupon validation result
 */

// Validate coupon (lightweight check)
router.get('/validate/:code', async (req, res) => {
    try {
        const promotion = await Promotion.findOne({
            code: req.params.code.toUpperCase(),
            isActive: true,
        });
        
        if (!promotion) {
            return res.json({success: false, valid: false});
        }
        
        const now = new Date();
        const isValid = promotion.startDate <= now && 
            (!promotion.endDate || promotion.endDate >= now);
        
        res.json({
            success: true,
            valid: isValid,
            promotion: isValid ? {
                code: promotion.code,
                type: promotion.type,
                value: promotion.value,
                description: promotion.description,
                minOrderAmount: promotion.minOrderAmount,
            } : null,
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/promotions/referral:
 *   get:
 *     tags: [Promotions]
 *     summary: Get user's referral code
 *     responses:
 *       200:
 *         description: Referral code returned
 */

// Get referral code
router.get('/referral', authUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user.referralCode) {
            user.referralCode = generateReferralCode();
            await user.save();
        }
        
        res.json({
            success: true,
            referralCode: user.referralCode,
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/promotions/referral/apply:
 *   post:
 *     tags: [Promotions]
 *     summary: Apply referral code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [referralCode]
 *             properties:
 *               referralCode: { type: string }
 *     responses:
 *       200:
 *         description: Referral code applied successfully
 */

// Apply referral code
router.post('/referral/apply', authUser, async (req, res) => {
    try {
        const {referralCode} = req.body;
        
        const referrer = await User.findOne({referralCode});
        if (!referrer) {
            return res.status(400).json({
                success: false,
                message: 'Invalid referral code',
            });
        }
        
        if (referrer._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot use your own referral code',
            });
        }
        
        const user = await User.findById(req.user._id);
        if (user.referredBy) {
            return res.status(400).json({
                success: false,
                message: 'You have already used a referral code',
            });
        }
        
        // Get referral promotion
        const referralPromo = await Promotion.findOne({isReferral: true, isActive: true});
        
        // Credit referrer
        if (referralPromo && referralPromo.referrerReward > 0) {
            const WalletTransaction = (await import('../models/WalletTransaction.js')).default;
            const referrerBalance = referrer.walletBalance || 0;
            
            await new WalletTransaction({
                userId: referrer._id,
                type: 'credit',
                amount: referralPromo.referrerReward,
                description: `Referral reward for ${user.name}`,
                balance: referrerBalance + referralPromo.referrerReward,
            }).save();
            
            referrer.walletBalance = referrerBalance + referralPromo.referrerReward;
            await referrer.save();
        }
        
        // Credit referred user
        if (referralPromo && referralPromo.referredReward > 0) {
            const WalletTransaction = (await import('../models/WalletTransaction.js')).default;
            const userBalance = user.walletBalance || 0;
            
            await new WalletTransaction({
                userId: user._id,
                type: 'credit',
                amount: referralPromo.referredReward,
                description: 'Welcome bonus for using referral code',
                balance: userBalance + referralPromo.referredReward,
            }).save();
            
            user.walletBalance = userBalance + referralPromo.referredReward;
        }
        
        user.referredBy = referrer._id;
        await user.save();
        
        res.json({
            success: true,
            message: 'Referral code applied successfully',
            rewards: {
                referrer: referralPromo?.referrerReward || 0,
                referred: referralPromo?.referredReward || 0,
            },
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// Admin: Create promotion

/**
 * @swagger
 * /api/promotions:
 *   post:
 *     tags: [Promotions]
 *     summary: Create a promotion (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               type: { type: string, enum: [percentage, fixed, free-delivery] }
 *               value: { type: number }
 *               description: { type: string }
 *               minOrderAmount: { type: number }
 *               maxDiscount: { type: number }
 *               startDate: { type: string }
 *               endDate: { type: string }
 *               usageLimit: { type: number }
 *               perUserLimit: { type: number }
 *               isActive: { type: boolean }
 *               isReferral: { type: boolean }
 *               referrerReward: { type: number }
 *               referredReward: { type: number }
 *               applicableProducts: { type: array, items: { type: string } }
 *               applicableCategories: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Promotion created
 */

router.post('/', authSeller, async (req, res) => {
    try {
        const promotion = new Promotion(req.body);
        await promotion.save();
        res.status(201).json({success: true, promotion});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/promotions/admin/all:
 *   get:
 *     tags: [Promotions]
 *     summary: Get all promotions (admin)
 *     responses:
 *       200:
 *         description: All promotions returned
 */

// Admin: Get all promotions
router.get('/admin/all', authSeller, async (req, res) => {
    try {
        const promotions = await Promotion.find().sort({createdAt: -1});
        res.json({success: true, promotions});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/promotions/{id}:
 *   put:
 *     tags: [Promotions]
 *     summary: Update a promotion (admin)
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
 *     responses:
 *       200:
 *         description: Promotion updated
 */

// Admin: Update promotion
router.put('/:id', authSeller, async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true}
        );
        
        if (!promotion) {
            return res.status(404).json({success: false, message: 'Promotion not found'});
        }
        
        res.json({success: true, promotion});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/promotions/{id}:
 *   delete:
 *     tags: [Promotions]
 *     summary: Delete a promotion (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Promotion deleted
 */

// Admin: Delete promotion
router.delete('/:id', authSeller, async (req, res) => {
    try {
        await Promotion.findByIdAndDelete(req.params.id);
        res.json({success: true, message: 'Promotion deleted'});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// Helper function
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default router;
