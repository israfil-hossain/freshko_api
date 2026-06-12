import express from 'express';
import { addBanner, listBanners, activeBanners, updateBanner, deleteBanner } from '../controllers/bannerController.js';
import { upload } from '../configs/multer.js';
import authSeller from '../middlewares/authSeller.js';

const bannerRouter = express.Router();

/**
 * @swagger
 * /api/banner/add:
 *   post:
 *     tags: [Banner]
 *     summary: Add a new banner
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               link:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Banner added
 */

bannerRouter.post('/add', authSeller, upload.single('image'), addBanner);

/**
 * @swagger
 * /api/banner/list:
 *   get:
 *     tags: [Banner]
 *     summary: List all banners
 *     responses:
 *       200:
 *         description: Banners list returned
 */

bannerRouter.get('/list', authSeller, listBanners);

/**
 * @swagger
 * /api/banner/active:
 *   get:
 *     tags: [Banner]
 *     summary: Get active banners
 *     responses:
 *       200:
 *         description: Active banners returned
 */

bannerRouter.get('/active', activeBanners);

/**
 * @swagger
 * /api/banner/{id}:
 *   put:
 *     tags: [Banner]
 *     summary: Update a banner
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               link:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Banner updated
 */

bannerRouter.put('/:id', authSeller, upload.single('image'), updateBanner);

/**
 * @swagger
 * /api/banner/{id}:
 *   delete:
 *     tags: [Banner]
 *     summary: Delete a banner
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Banner deleted
 */

bannerRouter.delete('/:id', authSeller, deleteBanner);

export default bannerRouter;
