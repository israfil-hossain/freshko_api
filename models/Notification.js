import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
    type: {type: String, enum: ['order', 'delivery', 'promotion', 'support', 'wallet', 'system'], required: true},
    title: {type: String, required: true},
    message: {type: String, required: true},
    data: {type: Object, default: {}}, // additional data (orderId, etc.)
    isRead: {type: Boolean, default: false},
    isPushSent: {type: Boolean, default: false},
    isSmsSent: {type: Boolean, default: false},
}, {timestamps: true});

notificationSchema.index({userId: 1, isRead: 1, createdAt: -1});

const Notification = mongoose.models.notification || mongoose.model('notification', notificationSchema);

export default Notification;
