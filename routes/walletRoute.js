import express from 'express';
import { authUser } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import WalletTransaction from '../models/WalletTransaction.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { createNotification, notifyWalletCredit } from '../services/notificationService.js';

const router = express.Router();

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     tags: [Wallet]
 *     summary: Get wallet balance
 *     responses:
 *       200:
 *         description: Wallet balance returned
 */

// Get wallet balance
router.get('/balance', authUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('walletBalance');
        res.json({success: true, balance: user.walletBalance || 0});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     tags: [Wallet]
 *     summary: Get wallet transactions with pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Wallet transactions returned
 */

// Get wallet transactions
router.get('/transactions', authUser, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const transactions = await WalletTransaction.find({userId: req.user._id})
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit);
        
        const total = await WalletTransaction.countDocuments({userId: req.user._id});
        
        res.json({
            success: true,
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/wallet/credit:
 *   post:
 *     tags: [Wallet]
 *     summary: Credit wallet (admin or self)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               userId: { type: string }
 *               amount: { type: number }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Wallet credited successfully
 */

// Credit wallet (admin only)
router.post('/credit', authUser, async (req, res) => {
    try {
        const {userId, amount, description} = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({success: false, message: 'Invalid amount'});
        }
        
        const user = await User.findById(userId || req.user._id);
        if (!user) {
            return res.status(404).json({success: false, message: 'User not found'});
        }
        
        const currentBalance = user.walletBalance || 0;
        const newBalance = currentBalance + amount;
        
        // Create transaction
        const transaction = new WalletTransaction({
            userId: user._id,
            type: 'credit',
            amount,
            description,
            balance: newBalance,
        });
        await transaction.save();
        
        // Update user balance
        user.walletBalance = newBalance;
        await user.save();
        
        // Send notification
        await notifyWalletCredit(user._id, amount, description);
        
        res.json({
            success: true,
            message: 'Wallet credited successfully',
            transaction,
            newBalance,
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/wallet/debit:
 *   post:
 *     tags: [Wallet]
 *     summary: Debit wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number }
 *               description: { type: string }
 *               orderId: { type: string }
 *     responses:
 *       200:
 *         description: Wallet debited successfully
 */

// Debit wallet
router.post('/debit', authUser, async (req, res) => {
    try {
        const {amount, description, orderId} = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({success: false, message: 'Invalid amount'});
        }
        
        const user = await User.findById(req.user._id);
        const currentBalance = user.walletBalance || 0;
        
        if (currentBalance < amount) {
            return res.status(400).json({success: false, message: 'Insufficient balance'});
        }
        
        const newBalance = currentBalance - amount;
        
        // Create transaction
        const transaction = new WalletTransaction({
            userId: req.user._id,
            type: 'debit',
            amount,
            description,
            orderId,
            balance: newBalance,
        });
        await transaction.save();
        
        // Update user balance
        user.walletBalance = newBalance;
        await user.save();
        
        res.json({
            success: true,
            message: 'Wallet debited successfully',
            transaction,
            newBalance,
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/wallet/refund:
 *   post:
 *     tags: [Wallet]
 *     summary: Process refund to wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, amount]
 *             properties:
 *               orderId: { type: string }
 *               amount: { type: number }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */

// Process refund
router.post('/refund', authUser, async (req, res) => {
    try {
        const {orderId, amount, reason} = req.body;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({success: false, message: 'Order not found'});
        }
        
        const user = await User.findById(order.userId);
        const currentBalance = user.walletBalance || 0;
        const newBalance = currentBalance + amount;
        
        // Create refund transaction
        const transaction = new WalletTransaction({
            userId: order.userId,
            type: 'refund',
            amount,
            description: `Refund for order #${orderId}: ${reason}`,
            orderId,
            balance: newBalance,
        });
        await transaction.save();
        
        // Update user balance
        user.walletBalance = newBalance;
        await user.save();
        
        // Update order
        order.refundAmount = amount;
        order.refundStatus = 'processed';
        order.refundId = transaction._id;
        await order.save();
        
        // Send notification
        await notifyWalletCredit(order.userId, amount, `Refund for order #${orderId}`);
        
        res.json({
            success: true,
            message: 'Refund processed successfully',
            transaction,
            newBalance,
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

export default router;
