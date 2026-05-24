import express from 'express';
import authUser from '../middlewares/authUser.js';
import authSeller from '../middlewares/authSeller.js';
import {
    getPlans, getPlanById, createPlan, updatePlan, deletePlan, getAllPlansAdmin,
    subscribe, getMySubscriptions, getMySubscriptionById, updateSubscriptionStatus,
    updateSubscriptionItems, getAllSubscriptions, getSubscriptionOrders,
    generateMonthlyOrders, generateSingleOrder
} from '../controllers/subscriptionController.js';

const subscriptionRouter = express.Router();

/**
 * @swagger
 * /api/subscription/plans:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get active subscription plans
 *     responses:
 *       200:
 *         description: List of plans
 */
subscriptionRouter.get('/plans', getPlans);

/**
 * @swagger
 * /api/subscription/plan/{id}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get plan by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Plan details
 */
subscriptionRouter.get('/plan/:id', getPlanById);

/**
 * @swagger
 * /api/subscription/create:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create a subscription plan (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, type, schedule]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               type: { type: string, enum: ['free', 'premium'] }
 *               schedule: { type: string, enum: ['monthly', 'weekly'] }
 *     responses:
 *       200:
 *         description: Plan created
 */
subscriptionRouter.post('/create', authSeller, createPlan);

/**
 * @swagger
 * /api/subscription/plan/{id}:
 *   put:
 *     tags: [Subscriptions]
 *     summary: Update subscription plan (Admin)
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
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               type: { type: string }
 *               schedule: { type: string }
 *     responses:
 *       200:
 *         description: Plan updated
 */
subscriptionRouter.put('/plan/:id', authSeller, updatePlan);

/**
 * @swagger
 * /api/subscription/plan/{id}:
 *   delete:
 *     tags: [Subscriptions]
 *     summary: Delete subscription plan (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Plan deleted
 */
subscriptionRouter.delete('/plan/:id', authSeller, deletePlan);

/**
 * @swagger
 * /api/subscription/admin/plans:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get all subscription plans (Admin)
 *     responses:
 *       200:
 *         description: List of all plans
 */
subscriptionRouter.get('/admin/plans', authSeller, getAllPlansAdmin);

/**
 * @swagger
 * /api/subscription/subscribe:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Subscribe to a plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId, phone]
 *             properties:
 *               planId: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Subscribed successfully
 */
subscriptionRouter.post('/subscribe', authUser, subscribe);

/**
 * @swagger
 * /api/subscription/my:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get logged-in user's subscriptions
 *     responses:
 *       200:
 *         description: List of user subscriptions
 */
subscriptionRouter.get('/my', authUser, getMySubscriptions);

/**
 * @swagger
 * /api/subscription/my/{id}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get user's subscription by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subscription details
 */
subscriptionRouter.get('/my/:id', authUser, getMySubscriptionById);

/**
 * @swagger
 * /api/subscription/{id}:
 *   put:
 *     tags: [Subscriptions]
 *     summary: Update subscription status (User or Admin)
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: ['active', 'paused', 'cancelled', 'expired'] }
 *     responses:
 *       200:
 *         description: Subscription updated
 */
subscriptionRouter.put('/:id', authUser, updateSubscriptionStatus);

/**
 * @swagger
 * /api/subscription/{id}/items:
 *   put:
 *     tags: [Subscriptions]
 *     summary: Update items in a subscription
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Items updated
 */
subscriptionRouter.put('/:id/items', authUser, updateSubscriptionItems);

/**
 * @swagger
 * /api/subscription/list:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get all subscriptions (Admin)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: planType
 *         schema: { type: string, enum: ['free', 'premium'] }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of subscriptions
 */
subscriptionRouter.get('/list', authSeller, getAllSubscriptions);

/**
 * @swagger
 * /api/subscription/orders:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get subscription orders (Admin)
 *     responses:
 *       200:
 *         description: List of subscription orders
 */
subscriptionRouter.get('/orders', authSeller, getSubscriptionOrders);

/**
 * @swagger
 * /api/subscription/generate:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Generate monthly orders for all subscriptions (Admin)
 *     responses:
 *       200:
 *         description: Orders generated
 */
subscriptionRouter.post('/generate', authSeller, generateMonthlyOrders);

/**
 * @swagger
 * /api/subscription/generate/{id}:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Generate order for a specific subscription (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order generated
 */
subscriptionRouter.post('/generate/:id', authSeller, generateSingleOrder);

export default subscriptionRouter;
