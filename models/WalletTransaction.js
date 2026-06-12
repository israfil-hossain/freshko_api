import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
    type: {type: String, enum: ['credit', 'debit', 'refund'], required: true},
    amount: {type: Number, required: true},
    description: {type: String, required: true},
    orderId: {type: mongoose.Schema.Types.ObjectId, default: null, ref: 'order'},
    refundId: {type: mongoose.Schema.Types.ObjectId, default: null, ref: 'refund'},
    balance: {type: Number, required: true}, // balance after transaction
    status: {type: String, enum: ['pending', 'completed', 'failed'], default: 'completed'},
}, {timestamps: true});

walletTransactionSchema.index({userId: 1, createdAt: -1});

const WalletTransaction = mongoose.models.walletTransaction || mongoose.model('walletTransaction', walletTransactionSchema);

export default WalletTransaction;
