import express from 'express';
import { authUser, authSeller, requireAnyPermission } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { createTicketSchema, replyTicketSchema } from '../middlewares/validation.js';
import SupportTicket from '../models/SupportTicket.js';
import { notifySupportReply } from '../services/notificationService.js';

const router = express.Router();

/**
 * @swagger
 * /api/support:
 *   post:
 *     tags: [Support]
 *     summary: Create a support ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, category, priority, message]
 *             properties:
 *               orderId: { type: string }
 *               subject: { type: string }
 *               category: { type: string }
 *               priority: { type: string, enum: [low, medium, high, urgent] }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Support ticket created
 */

// Create ticket
router.post('/', authUser, validate(createTicketSchema), async (req, res) => {
    try {
        const {orderId, subject, category, priority, message} = req.validatedData;
        
        const ticket = new SupportTicket({
            userId: req.user._id,
            orderId: orderId || null,
            subject,
            category,
            priority,
            messages: [{
                sender: 'customer',
                message,
                createdAt: new Date(),
            }],
        });
        await ticket.save();
        
        res.status(201).json({success: true, ticket});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/support/my:
 *   get:
 *     tags: [Support]
 *     summary: Get user's support tickets
 *     responses:
 *       200:
 *         description: User tickets returned
 */

// Get user tickets
router.get('/my', authUser, async (req, res) => {
    try {
        const tickets = await SupportTicket.find({userId: req.user._id})
            .sort({createdAt: -1})
            .populate('orderId', 'status amount');
        res.json({success: true, tickets});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/support/{id}:
 *   get:
 *     tags: [Support]
 *     summary: Get ticket by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket returned
 */

// Get ticket by ID
router.get('/:id', authUser, async (req, res) => {
    try {
        const ticket = await SupportTicket.findOne({
            _id: req.params.id,
            userId: req.user._id,
        }).populate('orderId', 'status amount items');
        
        if (!ticket) {
            return res.status(404).json({success: false, message: 'Ticket not found'});
        }
        
        res.json({success: true, ticket});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/support/{id}/reply:
 *   post:
 *     tags: [Support]
 *     summary: Reply to a support ticket
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: Reply added
 */

// Reply to ticket
router.post('/:id/reply', authUser, validate(replyTicketSchema), async (req, res) => {
    try {
        const ticket = await SupportTicket.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });
        
        if (!ticket) {
            return res.status(404).json({success: false, message: 'Ticket not found'});
        }
        
        if (ticket.status === 'closed') {
            return res.status(400).json({success: false, message: 'Ticket is closed'});
        }
        
        ticket.messages.push({
            sender: 'customer',
            message: req.validatedData.message,
            createdAt: new Date(),
        });
        
        ticket.status = 'open';
        await ticket.save();
        
        res.json({success: true, ticket});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

// Admin routes

/**
 * @swagger
 * /api/support/admin/all:
 *   get:
 *     tags: [Support]
 *     summary: Get all support tickets (admin)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: priority
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: All tickets returned
 */

// Get all tickets
router.get('/admin/all', authSeller, requireAnyPermission('support.view'), async (req, res) => {
    try {
        const {status, priority, page = 1, limit = 20} = req.query;
        const filter = {};
        
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        
        const tickets = await SupportTicket.find(filter)
            .sort({priority: -1, createdAt: -1})
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('userId', 'name email phone')
            .populate('orderId', 'status amount');
        
        const total = await SupportTicket.countDocuments(filter);
        
        res.json({
            success: true,
            tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
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
 * /api/support/admin/{id}/assign:
 *   put:
 *     tags: [Support]
 *     summary: Assign ticket to admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [adminId]
 *             properties:
 *               adminId: { type: string }
 *     responses:
 *       200:
 *         description: Ticket assigned
 */

// Assign ticket
router.put('/admin/:id/assign', authSeller, requireAnyPermission('support.reply'), async (req, res) => {
    try {
        const {adminId} = req.body;
        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            {assignedTo: adminId, status: 'in-progress'},
            {new: true}
        );
        
        if (!ticket) {
            return res.status(404).json({success: false, message: 'Ticket not found'});
        }
        
        res.json({success: true, ticket});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/support/admin/{id}/reply:
 *   post:
 *     tags: [Support]
 *     summary: Admin reply to ticket
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: Admin reply added
 */

// Admin reply
router.post('/admin/:id/reply', authSeller, requireAnyPermission('support.reply'), async (req, res) => {
    try {
        const {message} = req.body;
        const ticket = await SupportTicket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({success: false, message: 'Ticket not found'});
        }
        
        ticket.messages.push({
            sender: 'admin',
            message,
            createdAt: new Date(),
        });
        
        await ticket.save();
        
        // Notify user
        await notifySupportReply(ticket.userId, ticket._id);
        
        res.json({success: true, ticket});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/support/admin/{id}/resolve:
 *   put:
 *     tags: [Support]
 *     summary: Resolve a ticket
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket resolved
 */

// Resolve ticket
router.put('/admin/:id/resolve', authSeller, requireAnyPermission('support.resolve'), async (req, res) => {
    try {
        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            {status: 'resolved', resolvedAt: new Date()},
            {new: true}
        );
        
        if (!ticket) {
            return res.status(404).json({success: false, message: 'Ticket not found'});
        }
        
        res.json({success: true, ticket});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /api/support/admin/{id}/close:
 *   put:
 *     tags: [Support]
 *     summary: Close a ticket
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket closed
 */

// Close ticket
router.put('/admin/:id/close', authSeller, requireAnyPermission('support.resolve'), async (req, res) => {
    try {
        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            {status: 'closed'},
            {new: true}
        );
        
        if (!ticket) {
            return res.status(404).json({success: false, message: 'Ticket not found'});
        }
        
        res.json({success: true, ticket});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

export default router;
