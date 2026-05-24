import express from 'express';
import { updateCart } from '../controllers/cartController.js';
import authUser from '../middlewares/authUser.js';

const cartRouter = express.Router();

/**
 * @swagger
 * /api/cart/update:
 *   post:
 *     tags: [Cart]
 *     summary: Update user's cart items
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cartItems]
 *             properties:
 *               cartItems:
 *                 type: object
 *                 description: Cart items object
 *     responses:
 *       200:
 *         description: Cart updated
 */
cartRouter.post('/update', authUser, updateCart);

export default cartRouter;
