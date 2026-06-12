import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {type: String, required: true},
    description: {type: Array, required: true},
    price: {type: Number, required: true},
    offerPrice: {type: Number, required: true},
    images: {type: Array, required: true},
    category: {type: String, required: true},
    subcategory: {type: String, default: ''},
    tags: [{type: String}],
    quantity: {type: Number, default: 0},
    inStock: {type: Boolean, default: true},
    weight: {type: Number, default: 0.5},
}, {timestamps: true});

const Product = mongoose.models.product || mongoose.model('product', productSchema);

export default Product;