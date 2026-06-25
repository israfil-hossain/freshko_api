import express from 'express';
import {
    addDeliveryMan, deliveryManLogin, isDeliveryManAuth, deliveryManLogout,
    listDeliveryMen, updateDeliveryMan, deleteDeliveryMan,
    getDeliveryManDashboard, getDeliveryManOrders, updateDeliveryStatus,
} from '../controllers/deliveryManController.js';
import { updateRiderLocation, getRiderLocation, getRiderLocationHistory } from '../controllers/trackingController.js';
import authDeliveryMan from '../middlewares/authDeliveryMan.js';
import authSeller from '../middlewares/authSeller.js';

const deliveryManRouter = express.Router();

/**
 * @swagger
 * /api/delivery-man/add:
 *   post:
 *     tags: [Delivery Men]
 *     summary: Add a delivery man (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Delivery man added
 */
deliveryManRouter.post('/add', authSeller, addDeliveryMan);

/**
 * @swagger
 * /api/delivery-man/list:
 *   get:
 *     tags: [Delivery Men]
 *     summary: List all delivery men (Admin)
 *     responses:
 *       200:
 *         description: List of delivery men
 */
deliveryManRouter.get('/list', authSeller, listDeliveryMen);

/**
 * @swagger
 * /api/delivery-man/login:
 *   post:
 *     tags: [Delivery Men]
 *     summary: Delivery man login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
deliveryManRouter.post('/login', deliveryManLogin);
deliveryManRouter.get('/is-auth', authDeliveryMan, isDeliveryManAuth);
deliveryManRouter.get('/logout', authDeliveryMan, deliveryManLogout);

/**
 * @swagger
 * /api/delivery-man/dashboard:
 *   get:
 *     tags: [Delivery Men]
 *     summary: Get delivery man dashboard
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
deliveryManRouter.get('/dashboard', authDeliveryMan, getDeliveryManDashboard);

/**
 * @swagger
 * /api/delivery-man/orders:
 *   get:
 *     tags: [Delivery Men]
 *     summary: Get assigned orders for delivery man
 *     responses:
 *       200:
 *         description: List of assigned orders
 */
deliveryManRouter.get('/orders', authDeliveryMan, getDeliveryManOrders);

/**
 * @swagger
 * /api/delivery-man/update-status:
 *   put:
 *     tags: [Delivery Men]
 *     summary: Update delivery order status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignmentId, status]
 *             properties:
 *               assignmentId: { type: string }
 *               status: { type: string, enum: ['picked-up', 'in-transit', 'delivered', 'cancelled'] }
 *     responses:
 *       200:
 *         description: Status updated
 */
deliveryManRouter.put('/update-status', authDeliveryMan, updateDeliveryStatus);

/**
 * @swagger
 * /api/delivery-man/location:
 *   post:
 *     tags: [Delivery Men]
 *     summary: Update rider location
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               accuracy: { type: number }
 *               speed: { type: number }
 *               heading: { type: number }
 *     responses:
 *       200:
 *         description: Location updated
 */
deliveryManRouter.post('/location', authDeliveryMan, updateRiderLocation);

/**
 * @swagger
 * /api/delivery-man/location/{riderId}:
 *   get:
 *     tags: [Delivery Men]
 *     summary: Get rider location
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rider location
 */
deliveryManRouter.get('/location/:riderId', authDeliveryMan, getRiderLocation);

/**
 * @swagger
 * /api/delivery-man/location/{riderId}/history:
 *   get:
 *     tags: [Delivery Men]
 *     summary: Get rider location history
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Location history
 */
deliveryManRouter.get('/location/:riderId/history', authDeliveryMan, getRiderLocationHistory);

/**
 * @swagger
 * /api/delivery-man/{id}:
 *   put:
 *     tags: [Delivery Men]
 *     summary: Update delivery man (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Delivery man updated
 */
deliveryManRouter.put('/:id', authSeller, updateDeliveryMan);

/**
 * @swagger
 * /api/delivery-man/{id}:
 *   delete:
 *     tags: [Delivery Men]
 *     summary: Delete delivery man (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Delivery man deleted
 */
deliveryManRouter.delete('/:id', authSeller, deleteDeliveryMan);

export default deliveryManRouter;
