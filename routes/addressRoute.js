import express from 'express';
import { addAddress, getAddress, deleteAddress } from '../controllers/addressController.js';
import authUser from '../middlewares/authUser.js';

const addressRouter = express.Router();

/**
 * @swagger
 * /api/address/add:
 *   post:
 *     tags: [Addresses]
 *     summary: Add a new address
 *     responses:
 *       200:
 *         description: Address added
 */
addressRouter.post('/add', authUser, addAddress);

/**
 * @swagger
 * /api/address/get:
 *   get:
 *     tags: [Addresses]
 *     summary: Get user's addresses
 *     responses:
 *       200:
 *         description: List of addresses
 */
addressRouter.get('/get', authUser, getAddress);

/**
 * @swagger
 * /api/address/delete/{id}:
 *   delete:
 *     tags: [Addresses]
 *     summary: Delete an address
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Address deleted
 */
addressRouter.delete('/delete/:id', authUser, deleteAddress);

export default addressRouter;
