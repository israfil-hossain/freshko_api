import mongoose from 'mongoose';

const weeklyItemsSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    quantity: { type: Number, required: true },
  }],
}, { _id: false });

const customerSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
  type: {
    type: String,
    enum: ['plan', 'free-custom', 'premium-custom'],
    required: true,
  },
  schedule: { type: String, enum: ['monthly', 'weekly'], default: 'monthly' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    quantity: { type: Number, required: true },
  }],
  weeklyItems: [weeklyItemsSchema],
  price: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active',
  },
  startDate: { type: Date, required: true },
  nextDeliveryDate: { type: Date, required: true },
  deliveryDay: { type: Number, min: 1, max: 28, default: 1 },
  deliveryDays: [{ type: Number, min: 1, max: 28 }],
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'address', required: true },
  paymentType: { type: String, enum: ['COD', 'Online'], default: 'COD' },
  isFree: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('CustomerSubscription', customerSubscriptionSchema);
