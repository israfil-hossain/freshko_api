import express from 'express';
import { getAdminDashboard } from '../controllers/dashboardController.js';
import authSeller from '../middlewares/authSeller.js';

const dashboardRouter = express.Router();

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get admin dashboard statistics
 *     responses:
 *       200:
 *         description: Dashboard stats including users, orders, revenue, products, categories, subscriptions, delivery statistics
 */
dashboardRouter.get('/stats', authSeller, getAdminDashboard);

export default dashboardRouter;
