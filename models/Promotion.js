import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
    code: {type: String, required: true, unique: true, uppercase: true},
    type: {type: String, enum: ['percentage', 'fixed', 'free-delivery'], required: true},
    value: {type: Number, required: true}, // percentage or fixed amount
    description: {type: String, default: ''},
    minOrderAmount: {type: Number, default: 0},
    maxDiscount: {type: Number, default: null}, // max discount for percentage
    
    // Usage limits
    usageLimit: {type: Number, default: null}, // null = unlimited
    usageCount: {type: Number, default: 0},
    perUserLimit: {type: Number, default: 1},
    
    // Applicability
    applicableProducts: [{type: mongoose.Schema.Types.ObjectId, ref: 'product'}], // null = all
    applicableCategories: [{type: mongoose.Schema.Types.ObjectId, ref: 'category'}], // null = all
    excludedProducts: [{type: mongoose.Schema.Types.ObjectId, ref: 'product'}],
    
    // Schedule
    startDate: {type: Date, default: Date.now},
    endDate: {type: Date, default: null},
    isActive: {type: Boolean, default: true},
    
    // Referral specific
    isReferral: {type: Boolean, default: false},
    referrerReward: {type: Number, default: 0}, // amount credited to referrer
    referredReward: {type: Number, default: 0}, // amount credited to new user
}, {timestamps: true});

promotionSchema.index({code: 1, isActive: 1});
promotionSchema.index({isActive: 1, startDate: 1, endDate: 1});

const Promotion = mongoose.models.promotion || mongoose.model('promotion', promotionSchema);

export default Promotion;
