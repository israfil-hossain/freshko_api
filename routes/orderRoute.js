import express from 'express';
import authUser from '../middlewares/authUser.js';
import { getAllOrders, getUserOrders, placeOrderCOD, placeOrderStripe, placeOrderBkash, adminCreateOrder, assignDeliveryMan, getOrderDelivery, cancelOrder, bkashPayment, bkashCallback, requestRefund } from '../controllers/orderController.js';
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
 * /api/order/auto-assign:
 *   post:
 *     tags: [Orders]
 *     summary: Auto-assign a delivery man to an order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: { type: string }
 *     responses:
 *       200:
 *         description: Auto-assigned successfully
 */
orderRouter.post('/auto-assign', authSeller, async (req, res) => {
  try {
    const { autoAssignOrder } = await import('../services/autoAssignmentService.js');
    const result = await autoAssignOrder(req.body.orderId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/order/batch-assign:
 *   post:
 *     tags: [Orders]
 *     summary: Batch assign multiple orders to a rider
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderIds]
 *             properties:
 *               orderIds: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Batch assigned successfully
 */
orderRouter.post('/batch-assign', authSeller, async (req, res) => {
  try {
    const { batchAssignOrders } = await import('../services/autoAssignmentService.js');
    const result = await batchAssignOrders(req.body.orderIds);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

/**
 * @swagger
 * /api/order/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order cancelled
 */
orderRouter.post('/:id/cancel', authUser, cancelOrder);

/**
 * @swagger
 * /api/order/bkash-payment:
 *   post:
 *     tags: [Orders]
 *     summary: Place order with bKash payment
 *     responses:
 *       200:
 *         description: bKash payment URL
 */
orderRouter.post('/bkash-payment', authUser, bkashPayment);

/**
 * @swagger
 * /api/order/bkash-callback:
 *   get:
 *     tags: [Orders]
 *     summary: bKash payment callback
 *     responses:
 *       302:
 *         description: Redirect to client
 */
orderRouter.get('/bkash-callback', bkashCallback);

/**
 * @swagger
 * /api/order/{id}/refund:
 *   post:
 *     tags: [Orders]
 *     summary: Request refund
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Refund request submitted
 */
orderRouter.post('/:id/refund', authUser, requestRefund);

export default orderRouter;
