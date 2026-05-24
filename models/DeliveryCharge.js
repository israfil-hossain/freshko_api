import mongoose from 'mongoose';

const deliveryChargeSchema = new mongoose.Schema({
    baseCharge: { type: Number, default: 30 },
    perKgCharge: { type: Number, default: 10 },
    freeDeliveryMinAmount: { type: Number, default: 500 },
}, { timestamps: true });

const DeliveryCharge = mongoose.models.DeliveryCharge || mongoose.model('DeliveryCharge', deliveryChargeSchema);

export default DeliveryCharge;
