import Category from '../models/Category.js';

export const addCategory = async (req, res) => {
    try {
        const { name, image } = req.body;
        const existing = await Category.findOne({ name });
        if (existing) {
            return res.json({ success: false, message: 'Category already exists' });
        }
        await Category.create({ name, image });
        res.json({ success: true, message: 'Category added' });
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
        const category = await Category.findByIdAndUpdate(id, { name, image }, { new: true });
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
