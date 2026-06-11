import { v2 as cloudinary } from 'cloudinary';
import Category from '../models/Category.js';

const getCategoryImage = async (req, fallbackImage = '') => {
    if (!req.file) {
        return fallbackImage;
    }

    const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
    return result.secure_url;
};

export const addCategory = async (req, res) => {
    try {
        const { name, image } = req.body;
        const existing = await Category.findOne({ name });
        if (existing) {
            return res.json({ success: false, message: 'Category already exists' });
        }
        const categoryImage = await getCategoryImage(req, image);
        const category = await Category.create({ name, image: categoryImage });
        res.json({ success: true, message: 'Category added', category });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const listCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.json({ success: true, categories });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image } = req.body;
        const updates = {};

        if (name !== undefined) {
            updates.name = name;
        }

        if (image !== undefined || req.file) {
            updates.image = await getCategoryImage(req, image);
        }

        const category = await Category.findByIdAndUpdate(id, updates, { new: true });
        if (!category) {
            return res.json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, message: 'Category updated', category });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const addSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        let subImage = '';

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            subImage = result.secure_url;
        }

        const category = await Category.findByIdAndUpdate(
            id,
            { $push: { subcategories: { name, image: subImage } } },
            { new: true }
        );

        if (!category) {
            return res.json({ success: false, message: 'Category not found' });
        }

        const added = category.subcategories[category.subcategories.length - 1];
        res.json({ success: true, message: 'Subcategory added', subcategory: added });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const updateSubcategory = async (req, res) => {
    try {
        const { id, subId } = req.params;
        const { name } = req.body;

        const category = await Category.findOne({ _id: id, 'subcategories._id': subId });

        if (!category) {
            return res.json({ success: false, message: 'Category or subcategory not found' });
        }

        const sub = category.subcategories.id(subId);
        if (name !== undefined) sub.name = name;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            sub.image = result.secure_url;
        }

        await category.save();

        res.json({ success: true, message: 'Subcategory updated', subcategory: sub });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const deleteSubcategory = async (req, res) => {
    try {
        const { id, subId } = req.params;

        const category = await Category.findByIdAndUpdate(
            id,
            { $pull: { subcategories: { _id: subId } } },
            { new: true }
        );

        if (!category) {
            return res.json({ success: false, message: 'Category not found' });
        }

        res.json({ success: true, message: 'Subcategory deleted' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
