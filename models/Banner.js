import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    title: {type: String, required: true},
    subtitle: {type: String, default: ''},
    description: {type: String, default: ''},
    buttonText: {type: String, default: 'Shop Now'},
    buttonLink: {type: String, default: '/products'},
    image: {type: String, default: ''},
    isActive: {type: Boolean, default: true},
    order: {type: Number, default: 0},
}, {timestamps: true});

const Banner = mongoose.models.banner || mongoose.model('banner', bannerSchema);

export default Banner;
