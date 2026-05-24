import mongoose from 'mongoose';

const weeklyItemsSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    quantity: { type: Number, required: true },
  }],
}, { _id: false });

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '' },
  type: { type: String, enum: ['free', 'premium'], required: true },
  schedule: { type: String, enum: ['monthly', 'weekly'], default: 'monthly' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    quantity: { type: Number, required: true },
  }],
  weeklyItems: [weeklyItemsSchema],
  maxItems: { type: Number, default: 5 },
  allowedCategories: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
