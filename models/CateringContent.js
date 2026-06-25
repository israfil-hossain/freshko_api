import mongoose from 'mongoose';

const cateringContentSchema = new mongoose.Schema({
    contact: {
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        address: { type: String, default: '' },
        whatsapp: { type: String, default: '' },
    },
    hero: {
        tagline: { type: String, default: '' },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        ctaText: { type: String, default: '' },
        ctaLink: { type: String, default: '' },
        stats: [{
            value: String,
            label: String,
        }],
    },
    services: [{
        id: String,
        title: String,
        tag: { type: String, default: '' },
        description: String,
        fullDescription: { type: String, default: '' },
        image: String,
    }],
    menus: [{
        id: String,
        title: String,
        description: String,
        price: String,
        image: String,
    }],
    testimonials: [{
        id: String,
        name: String,
        role: String,
        initials: String,
        quote: String,
    }],
}, { timestamps: true });

export default mongoose.model('CateringContent', cateringContentSchema);
