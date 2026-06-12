import express from 'express';
import { authUser } from '../middlewares/auth.js';
import { getOrderTracking } from '../controllers/trackingController.js';

const trackingRouter = express.Router();

/**
 * @swagger
 * /api/tracking/{orderId}:
 *   get:
 *     tags: [Tracking]
 *     summary: Get order tracking information
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tracking information
 */
trackingRouter.get('/:orderId', authUser, getOrderTracking);

export default trackingRouter;
