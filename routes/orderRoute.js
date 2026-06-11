import express from 'express';
import authUser from '../middlewares/authUser.js';
import { getAllOrders, getUserOrders, placeOrderCOD, placeOrderStripe, placeOrderBkash, adminCreateOrder, assignDeliveryMan, getOrderDelivery } from '../controllers/orderController.js';
import authSeller from '../middlewares/authSeller.js';

const orderRouter = express.Router();

/**
 * @swagger
 * /api/order/cod:
 *   post:
 *     tags: [Orders]
 *     summary: Place a COD order
 *     responses:
 *       200:
 *         description: Order placed
 */
orderRouter.post('/cod', authUser, placeOrderCOD);

/**
 * @swagger
 * /api/order/user:
 *   get:
 *     tags: [Orders]
 *     summary: Get logged-in user's orders
 *     responses:
 *       200:
 *         description: List of user orders
 */
orderRouter.get('/user', authUser, getUserOrders);

/**
 * @swagger
 * /api/order/seller:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders (Admin)
 *     responses:
 *       200:
 *         description: List of all orders
 */
orderRouter.get('/seller', authSeller, getAllOrders);

/**
 * @swagger
 * /api/order/stripe:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order with Stripe payment
 *     responses:
 *       200:
 *         description: Stripe checkout URL returned
 */
orderRouter.post('/stripe', authUser, placeOrderStripe);
orderRouter.post('/bkash', authUser, placeOrderBkash);

/**
 * @swagger
 * /api/order/admin-create:
 *   post:
 *     tags: [Orders]
 *     summary: Admin manually creates an order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, items, address]
 *             properties:
 *               userId: { type: string }
 *               items: { type: array, items: { type: object, properties: { product: { type: string }, quantity: { type: number } } } }
 *               address: { type: string }
 *               paymentType: { type: string }
 *     responses:
 *       200:
 *         description: Order created
 */
orderRouter.post('/admin-create', authSeller, adminCreateOrder);

/**
 * @swagger
 * /api/order/assign-delivery:
 *   post:
 *     tags: [Orders]
 *     summary: Assign a delivery man to an order (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, deliveryManId]
 *             properties:
 *               orderId: { type: string }
 *               deliveryManId: { type: string }
 *     responses:
 *       200:
 *         description: Delivery man assigned
 */
orderRouter.post('/assign-delivery', authSeller, assignDeliveryMan);

/**
 * @swagger
 * /api/order/{id}/delivery:
 *   get:
 *     tags: [Orders]
 *     summary: Get delivery assignment for an order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Delivery assignment details
 */
orderRouter.get('/:id/delivery', getOrderDelivery);

export default orderRouter;
