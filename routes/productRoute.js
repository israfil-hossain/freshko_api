import express from 'express';
import { addProduct, productList, productById, changeStock, updateProduct, deleteProduct } from '../controllers/productController.js';
import { upload } from '../configs/multer.js';
import authSeller from '../middlewares/authSeller.js';

const productRouter = express.Router();

/**
 * @swagger
 * /api/product/add:
 *   post:
 *     tags: [Products]
 *     summary: Add a new product (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [productData, images]
 *             properties:
 *               productData:
 *                 type: string
 *                 description: JSON string with name, description, category, price, offerPrice
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Product added
 */
productRouter.post('/add', upload.array(["images"]), authSeller, addProduct);

/**
 * @swagger
 * /api/product/list:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
 *     responses:
 *       200:
 *         description: List of products
 */
productRouter.get('/list', productList);

/**
 * @swagger
 * /api/product/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product details
 */
productRouter.get('/:id', productById);

/**
 * @swagger
 * /api/product/stock:
 *   post:
 *     tags: [Products]
 *     summary: Update product stock (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, quantity]
 *             properties:
 *               id: { type: string }
 *               quantity: { type: number }
 *     responses:
 *       200:
 *         description: Stock updated
 */
productRouter.post('/stock', authSeller, changeStock);

/**
 * @swagger
 * /api/product/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update product (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               price: { type: number }
 *               offerPrice: { type: number }
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Product updated
 */
productRouter.put('/:id', authSeller, upload.array(["images"]), updateProduct);

/**
 * @swagger
 * /api/product/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted
 */
productRouter.delete('/:id', authSeller, deleteProduct);

export default productRouter;
