import express from 'express';
import { getSettings, updateSettings } from '../controllers/deliveryChargeController.js';
import authSeller from '../middlewares/authSeller.js';

const deliveryChargeRouter = express.Router();

/**
 * @swagger
 * /api/delivery-charge/settings:
 *   get:
 *     tags: [Delivery Charge]
 *     summary: Get delivery charge settings (Admin)
 *     responses:
 *       200:
 *         description: Delivery charge settings
 */
deliveryChargeRouter.get('/settings', authSeller, getSettings);

/**
 * @swagger
 * /api/delivery-charge/settings:
 *   put:
 *     tags: [Delivery Charge]
 *     summary: Update delivery charge settings (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               baseCharge: { type: number }
 *               perKgCharge: { type: number }
 *               freeDeliveryMinAmount: { type: number }
 *     responses:
 *       200:
 *         description: Settings updated
 */
deliveryChargeRouter.put('/settings', authSeller, updateSettings);

export default deliveryChargeRouter;
