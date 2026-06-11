import express from 'express';
import { addCategory, listCategories, updateCategory, deleteCategory, addSubcategory, updateSubcategory, deleteSubcategory } from '../controllers/categoryController.js';
import authSeller from '../middlewares/authSeller.js';
import { upload } from '../configs/multer.js';

const categoryRouter = express.Router();

/**
 * @swagger
 * /api/category/add:
 *   post:
 *     tags: [Categories]
 *     summary: Add a new category (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Category added
 */
categoryRouter.post('/add', upload.single('image'), authSeller, addCategory);

/**
 * @swagger
 * /api/category/list:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     responses:
 *       200:
 *         description: List of categories
 */
categoryRouter.get('/list', listCategories);

/**
 * @swagger
 * /api/category/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update category (Admin)
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
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Category updated
 */
categoryRouter.put('/:id', upload.single('image'), authSeller, updateCategory);

/**
 * @swagger
 * /api/category/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete category (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted
 */
categoryRouter.delete('/:id', authSeller, deleteCategory);

categoryRouter.post('/:id/subcategory', upload.single('image'), authSeller, addSubcategory);
categoryRouter.put('/:id/subcategory/:subId', upload.single('image'), authSeller, updateSubcategory);
categoryRouter.delete('/:id/subcategory/:subId', authSeller, deleteSubcategory);

export default categoryRouter;
