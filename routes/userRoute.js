import express from 'express';
import { register, login, isAuth, logout, updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';

const userRouter = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string }
 *         email: { type: string }
 *         phone: { type: string }
 *         avatar: { type: string }
 *         cartItems: { type: object }
 *         createdAt: { type: string }
 *         updatedAt: { type: string }
 *     Product:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string }
 *         description: { type: array, items: { type: string } }
 *         price: { type: number }
 *         offerPrice: { type: number }
 *         images: { type: array, items: { type: string } }
 *         category: { type: string }
 *         quantity: { type: number }
 *         inStock: { type: boolean }
 *     Order:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         userId: { type: string }
 *         items: { type: array, items: { $ref: '#/components/schemas/OrderItem' } }
 *         amount: { type: number }
 *         address: { $ref: '#/components/schemas/Address' }
 *         status: { type: string }
 *         paymentType: { type: string, enum: ['COD', 'Online'] }
 *         isPaid: { type: boolean }
 *         deliveryStatus: { type: string }
 *     OrderItem:
 *       type: object
 *       properties:
 *         product: { $ref: '#/components/schemas/Product' }
 *         quantity: { type: number }
 *     Address:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         firstName: { type: string }
 *         lastName: { type: string }
 *         email: { type: string }
 *         phone: { type: string }
 *         houseNumber: { type: string }
 *         floorNumber: { type: string }
 *         roadNumber: { type: string }
 *         city: { type: string }
 *         state: { type: string }
 *         zipcode: { type: string }
 *         country: { type: string }
 *     Category:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string }
 *         image: { type: string }
 *     DeliveryMan:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string }
 *         email: { type: string }
 *         phone: { type: string }
 *         isActive: { type: boolean }
 *         totalEarnings: { type: number }
 *         totalDeliveries: { type: number }
 *     DeliveryAssignment:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         orderId: { type: string }
 *         deliveryManId: { type: string }
 *         status: { type: string, enum: ['assigned', 'picked-up', 'in-transit', 'delivered', 'cancelled'] }
 *         assignedAt: { type: string }
 *         pickedUpAt: { type: string }
 *         deliveredAt: { type: string }
 *     SubscriptionPlan:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string }
 *         description: { type: string }
 *         price: { type: number }
 *         type: { type: string, enum: ['free', 'premium'] }
 *         schedule: { type: string, enum: ['monthly', 'weekly'] }
 *         isActive: { type: boolean }
 *     CustomerSubscription:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         userId: { $ref: '#/components/schemas/User' }
 *         planId: { type: string }
 *         type: { type: string }
 *         schedule: { type: string }
 *         price: { type: number }
 *         status: { type: string, enum: ['active', 'paused', 'cancelled', 'expired'] }
 *         nextDeliveryDate: { type: string }
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     tags: [User]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: User registered successfully
 */
userRouter.post('/register', register);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags: [User]
 *     summary: Login user
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
userRouter.post('/login', login);

/**
 * @swagger
 * /api/user/is-auth:
 *   get:
 *     tags: [User]
 *     summary: Check if user is authenticated
 *     responses:
 *       200:
 *         description: Auth status returned
 */
userRouter.get('/is-auth', authUser, isAuth);

/**
 * @swagger
 * /api/user/logout:
 *   get:
 *     tags: [User]
 *     summary: Logout user
 *     responses:
 *       200:
 *         description: Logged out
 */
userRouter.get('/logout', logout);

/**
 * @swagger
 * /api/user/update-profile:
 *   put:
 *     tags: [User]
 *     summary: Update user profile
 *     responses:
 *       200:
 *         description: Profile updated
 */
userRouter.put('/update-profile', authUser, updateProfile);
/**
 * @swagger
 * /api/user/change-password:
 *   put:
 *     tags: [User]
 *     summary: Change user password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password changed
 */
userRouter.put('/change-password', authUser, changePassword);

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     tags: [User]
 *     summary: Request password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Reset email sent
 */
userRouter.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     tags: [User]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password reset
 */
userRouter.post('/reset-password', resetPassword);

export default userRouter;
