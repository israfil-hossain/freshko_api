import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Firebase Admin SDK (if configured)
let firebaseAdmin = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        firebaseAdmin = (await import('firebase-admin')).default;
        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.log('Firebase not initialized:', error.message);
    }
}

// Create in-app notification
export const createNotification = async (userId, type, title, message, data = {}) => {
    try {
        const notification = new Notification({
            userId,
            type,
            title,
            message,
            data,
            isRead: false,
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Create Notification Error:', error);
        return null;
    }
};

// Send push notification via FCM
export const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        if (!firebaseAdmin) {
            console.log('Firebase not configured, skipping push notification');
            return {success: false, error: 'Firebase not configured'};
        }
        
        const user = await User.findById(userId);
        if (!user || !user.fcmToken) {
            return {success: false, error: 'FCM token not found'};
        }
        
        const message = {
            notification: {
                title,
                body,
            },
            data,
            token: user.fcmToken,
        };
        
        const response = await firebaseAdmin.messaging().send(message);
        
        // Update notification as push sent
        await Notification.findOneAndUpdate(
            {userId, title, message: body},
            {isPushSent: true}
        );
        
        return {success: true, messageId: response};
    } catch (error) {
        console.error('Push Notification Error:', error);
        return {success: false, error: error.message};
    }
};

// Send notification to all platforms
export const sendNotification = async (userId, type, title, message, data = {}) => {
    // Create in-app notification
    const notification = await createNotification(userId, type, title, message, data);
    
    // Send push notification
    const pushResult = await sendPushNotification(userId, title, message, data);
    
    return {
        notification,
        push: pushResult,
    };
};

// Get user notifications
export const getNotifications = async (userId, limit = 50, offset = 0) => {
    try {
        const notifications = await Notification.find({userId})
            .sort({createdAt: -1})
            .skip(offset)
            .limit(limit);
        
        const unreadCount = await Notification.countDocuments({userId, isRead: false});
        
        return {notifications, unreadCount};
    } catch (error) {
        console.error('Get Notifications Error:', error);
        return {notifications: [], unreadCount: 0};
    }
};

// Mark notification as read
export const markAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {_id: notificationId, userId},
            {isRead: true},
            {new: true}
        );
        return notification;
    } catch (error) {
        console.error('Mark As Read Error:', error);
        return null;
    }
};

// Mark all notifications as read
export const markAllAsRead = async (userId) => {
    try {
        await Notification.updateMany(
            {userId, isRead: false},
            {isRead: true}
        );
        return {success: true};
    } catch (error) {
        console.error('Mark All As Read Error:', error);
        return {success: false, error: error.message};
    }
};

// Order notification helpers
export const notifyOrderCreated = async (userId, orderId, amount) => {
    return await sendNotification(
        userId,
        'order',
        'Order Placed Successfully',
        `Your order #${orderId} has been placed. Total: ৳${amount}`,
        {orderId, amount, type: 'order_created'}
    );
};

export const notifyOrderStatus = async (userId, orderId, status) => {
    const statusMessages = {
        'Order Placed': 'Your order has been placed',
        'assigned': 'A rider has been assigned to your order',
        'picked-up': 'Your order has been picked up',
        'in-transit': 'Your order is on the way',
        'delivered': 'Your order has been delivered',
        'cancelled': 'Your order has been cancelled',
    };
    
    return await sendNotification(
        userId,
        'order',
        'Order Status Update',
        statusMessages[status] || `Order status updated to ${status}`,
        {orderId, status, type: 'order_status'}
    );
};

export const notifyDeliveryAssigned = async (userId, orderId, riderName) => {
    return await sendNotification(
        userId,
        'delivery',
        'Rider Assigned',
        `${riderName} has been assigned to deliver your order #${orderId}`,
        {orderId, riderName, type: 'delivery_assigned'}
    );
};

export const notifyDeliveryUpdate = async (userId, orderId, status, location = null) => {
    return await sendNotification(
        userId,
        'delivery',
        'Delivery Update',
        `Your order #${orderId} is ${status}`,
        {orderId, status, location, type: 'delivery_update'}
    );
};

export const notifyRefund = async (userId, amount) => {
    return await sendNotification(
        userId,
        'wallet',
        'Refund Processed',
        `৳${amount} has been refunded to your wallet`,
        {amount, type: 'refund'}
    );
};

export const notifyWalletCredit = async (userId, amount, reason) => {
    return await sendNotification(
        userId,
        'wallet',
        'Wallet Credited',
        `৳${amount} has been added to your wallet: ${reason}`,
        {amount, reason, type: 'wallet_credit'}
    );
};

export const notifyPromotion = async (userId, code, discount) => {
    return await sendNotification(
        userId,
        'promotion',
        'Special Offer',
        `Use code ${code} to get ${discount} off!`,
        {code, discount, type: 'promotion'}
    );
};

export const notifySupportReply = async (userId, ticketId) => {
    return await sendNotification(
        userId,
        'support',
        'Support Reply',
        `You have a new reply on your support ticket`,
        {ticketId, type: 'support_reply'}
    );
};

export default {
    createNotification,
    sendPushNotification,
    sendNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    notifyOrderCreated,
    notifyOrderStatus,
    notifyDeliveryAssigned,
    notifyDeliveryUpdate,
    notifyRefund,
    notifyWalletCredit,
    notifyPromotion,
    notifySupportReply,
};
