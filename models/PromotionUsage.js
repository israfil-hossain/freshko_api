import mongoose from 'mongoose';

const promotionUsageSchema = new mongoose.Schema({
    promotionId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'promotion'},
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
    orderId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'order'},
    discountAmount: {type: Number, required: true},
}, {timestamps: true});

promotionUsageSchema.index({promotionId: 1, userId: 1});

const PromotionUsage = mongoose.models.promotionUsage || mongoose.model('promotionUsage', promotionUsageSchema);

export default PromotionUsage;
