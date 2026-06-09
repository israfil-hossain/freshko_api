import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';

// Add Product : /api/product/add
export const addProduct = async (req, res) => {
    try {
        let productData = JSON.parse(req.body.productData);
        const images = req.files;
        let imagesUrl = await Promise.all(images.map(async (item) =>{
            let result = await cloudinary.uploader.upload(item.path, {resource_type: 'image'});
            return result.secure_url;
        }));
        await Product.create({...productData, images: imagesUrl});
        res.json({success: true, message: "Product Added"});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Get Product : /api/product/list
export const productList = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page, 10);
        const limit = Number.parseInt(req.query.limit, 10);

        if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
            const skip = (page - 1) * limit;
            const [products, total] = await Promise.all([
                Product.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
                Product.countDocuments({}),
            ]);
            const totalPages = Math.max(Math.ceil(total / limit), 1);

            return res.json({
                success: true,
                products,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            });
        }

        const products = await Product.find({});
        res.json({success: true, products});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Get Single Product : /api/product/:id
export const productById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.json({success: false, message: 'Product not found'});
        }
        res.json({success: true, product});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Change Product inStock : /api/product/stock
export const changeStock = async (req, res) => {
    try {
        const { id, quantity } = req.body;
        if (quantity < 0) {
            return res.json({ success: false, message: "Quantity cannot be negative" });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { quantity, inStock: quantity > 0 },
            { new: true }
        );

        res.json({ success: true, message: "Stock Updated", product: updatedProduct });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Update Product : /api/product/:id
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.images === undefined && req.files && req.files.length > 0) {
            const imagesUrl = await Promise.all(req.files.map(async (item) => {
                const result = await cloudinary.uploader.upload(item.path, {resource_type: 'image'});
                return result.secure_url;
            }));
            updates.images = imagesUrl;
        }

        const product = await Product.findByIdAndUpdate(id, updates, { new: true });
        if (!product) {
            return res.json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product updated', product });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Delete Product : /api/product/:id
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
