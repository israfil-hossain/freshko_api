import express from 'express';
import { sellerLogin, isSellerAuth, sellerLogout, listUsers } from '../controllers/sellerController.js';
import authSeller from '../middlewares/authSeller.js';

const sellerRouter = express.Router();

/**
 * @swagger
 * /api/seller/login:
 *   post:
 *     tags: [Admin]
 *     summary: Admin login
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
sellerRouter.post('/login', sellerLogin);
sellerRouter.get('/is-auth', authSeller, isSellerAuth);
sellerRouter.get('/logout', sellerLogout);

/**
 * @swagger
 * /api/seller/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (Admin)
 *     responses:
 *       200:
 *         description: List of users
 */
sellerRouter.get('/users', authSeller, listUsers);

export default sellerRouter;
