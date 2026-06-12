import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
    orderId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'order'},
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
    amount: {type: Number, required: true},
    reason: {type: String, required: true},
    type: {type: String, enum: ['full', 'partial'], default: 'full'},
    status: {type: String, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending'},
    processedAt: {type: Date, default: null},
    processedBy: {type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user'},
    walletTransactionId: {type: mongoose.Schema.Types.ObjectId, default: null, ref: 'walletTransaction'},
    notes: {type: String, default: null},
}, {timestamps: true});

refundSchema.index({userId: 1, status: 1, createdAt: -1});

const Refund = mongoose.models.refund || mongoose.model('refund', refundSchema);

export default Refund;
