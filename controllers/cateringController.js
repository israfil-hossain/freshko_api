import { v2 as cloudinary } from 'cloudinary';
import CateringContent from '../models/CateringContent.js';

// ─── Public: Get catering content ───
export const getContent = async (req, res) => {
    try {
        let content = await CateringContent.findOne();
        if (!content) {
            content = await CateringContent.create({});
        }
        res.json({ success: true, ...content.toObject() });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// ─── Admin: Update catering content ───
export const updateContent = async (req, res) => {
    try {
        const body = req.body;
        let content = await CateringContent.findOne();
        if (!content) {
            content = await CateringContent.create(body);
        } else {
            Object.assign(content, body);
            await content.save();
        }
        res.json({ success: true, message: 'Content updated', content });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// ─── Admin: Add service ───
export const addService = async (req, res) => {
    try {
        const { title, tag, description, fullDescription } = req.body;
        let image = '';
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            image = result.secure_url;
        }

        let content = await CateringContent.findOne();
        if (!content) content = await CateringContent.create({});

        const service = {
            id: Date.now().toString(),
            title: title || '',
            tag: tag || '',
            description: description || '',
            fullDescription: fullDescription || '',
            image,
        };
        content.services.push(service);
        await content.save();

        res.json({ success: true, message: 'Service added', service });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// ─── Admin: Update service ───
export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, tag, description, fullDescription } = req.body;

        let content = await CateringContent.findOne();
        if (!content) return res.json({ success: false, message: 'Content not found' });

        const service = content.services.find((s) => s.id === id);
        if (!service) return res.json({ success: false, message: 'Service not found' });

        if (title !== undefined) service.title = title;
        if (tag !== undefined) service.tag = tag;
        if (description !== undefined) service.description = description;
        if (fullDescription !== undefined) service.fullDescription = fullDescription;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            service.image = result.secure_url;
        }

        await content.save();
        res.json({ success: true, message: 'Service updated', service });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// ─── Admin: Delete service ───
export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        let content = await CateringContent.findOne();
        if (!content) return res.json({ success: false, message: 'Content not found' });

        content.services = content.services.filter((s) => s.id !== id);
        await content.save();

        res.json({ success: true, message: 'Service deleted' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// ─── Admin: Add menu ───
export const addMenu = async (req, res) => {
    try {
        const { title, description, price, per } = req.body;
        let image = '';
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            image = result.secure_url;
        }

        let content = await CateringContent.findOne();
        if (!content) content = await CateringContent.create({});

        const menu = {
            id: Date.now().toString(),
            title: title || '',
            description: description || '',
            price: price || '',
            per: per || 'head',
            image,
        };
        content.menus.push(menu);
        await content.save();

        res.json({ success: true, message: 'Menu added', menu });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// ─── Admin: Update menu ───
export const updateMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, per } = req.body;

        let content = await CateringContent.findOne();
        if (!content) return res.json({ success: false, message: 'Content not found' });

        const menu = content.menus.find((m) => m.id === id);
        if (!menu) return res.json({ success: false, message: 'Menu not found' });

        if (title !== undefined) menu.title = title;
        if (description !== undefined) menu.description = description;
        if (price !== undefined) menu.price = price;
        if (per !== undefined) menu.per = per;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            menu.image = result.secure_url;
        }

        await content.save();
        res.json({ success: true, message: 'Menu updated', menu });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// ─── Admin: Delete menu ───
export const deleteMenu = async (req, res) => {
    try {
        const { id } = req.params;
        let content = await CateringContent.findOne();
        if (!content) return res.json({ success: false, message: 'Content not found' });

        content.menus = content.menus.filter((m) => m.id !== id);
        await content.save();

        res.json({ success: true, message: 'Menu deleted' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
