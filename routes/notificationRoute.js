import express from 'express';
import { authUser } from '../middlewares/auth.js';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService.js';

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get user notifications
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Notifications returned
 */

// Get notifications
router.get('/', authUser, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        const result = await getNotifications(req.user._id, limit, offset);
        res.json({success: true, ...result});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */

// Mark as read
router.put('/:id/read', authUser, async (req, res) => {
    try {
        const notification = await markAsRead(req.params.id, req.user._id);
        if (!notification) {
            return res.status(404).json({success: false, message: 'Notification not found'});
        }
        res.json({success: true, notification});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */

// Mark all as read
router.put('/read-all', authUser, async (req, res) => {
    try {
        const result = await markAllAsRead(req.user._id);
        res.json({success: true, ...result});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/notifications/fcm-token:
 *   post:
 *     tags: [Notifications]
 *     summary: Register FCM token for push notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: FCM token registered
 */

// Register FCM token
router.post('/fcm-token', authUser, async (req, res) => {
    try {
        const {token} = req.body;
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(req.user._id, {fcmToken: token});
        res.json({success: true, message: 'FCM token registered'});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

export default router;
