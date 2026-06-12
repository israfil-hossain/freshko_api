import { v2 as cloudinary } from 'cloudinary';
import Banner from '../models/Banner.js';

// Add Banner : /api/banner/add
export const addBanner = async (req, res) => {
    try {
        const { title, subtitle, description, buttonText, buttonLink, isActive, order } = req.body;
        let image = '';
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            image = result.secure_url;
        }
        const banner = await Banner.create({
            title, subtitle, description, buttonText, buttonLink, image,
            isActive: isActive !== 'false',
            order: Number(order) || 0,
        });
        res.json({ success: true, message: 'Banner added', banner });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get all Banners : /api/banner/list
export const listBanners = async (req, res) => {
    try {
        const banners = await Banner.find({}).sort({ order: 1, createdAt: -1 });
        res.json({ success: true, banners });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get active Banners (public) : /api/banner/active
export const activeBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, banners });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Update Banner : /api/banner/:id
export const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            updates.image = result.secure_url;
        }

        if (updates.isActive !== undefined) {
            updates.isActive = updates.isActive === 'true' || updates.isActive === true;
        }
        if (updates.order !== undefined) {
            updates.order = Number(updates.order);
        }

        const banner = await Banner.findByIdAndUpdate(id, updates, { new: true });
        if (!banner) {
            return res.json({ success: false, message: 'Banner not found' });
        }
        res.json({ success: true, message: 'Banner updated', banner });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Delete Banner : /api/banner/:id
export const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        await Banner.findByIdAndDelete(id);
        res.json({ success: true, message: 'Banner deleted' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
