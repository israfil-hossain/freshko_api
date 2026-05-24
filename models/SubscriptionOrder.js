import mongoose from 'mongoose';

const subscriptionOrderSchema = new mongoose.Schema({
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerSubscription',
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'order',
    default: null,
  },
  month: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'generated', 'failed'],
    default: 'pending',
  },
}, { timestamps: true });

subscriptionOrderSchema.index({ subscriptionId: 1, month: 1 }, { unique: true });

export default mongoose.model('SubscriptionOrder', subscriptionOrderSchema);
