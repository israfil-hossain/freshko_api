import express from 'express';
import { authSeller, requireAnyPermission } from '../middlewares/auth.js';
import {
    getSalesAnalytics,
    getCustomerAnalytics,
    getProductAnalytics,
    getRiderAnalytics,
    getDashboardOverview
} from '../controllers/analyticsController.js';

const router = express.Router();

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     tags: [Analytics]
 *     summary: Get dashboard overview stats
 *     responses:
 *       200:
 *         description: Dashboard overview returned
 */

// Dashboard overview
router.get('/overview', authSeller, getDashboardOverview);

/**
 * @swagger
 * /api/analytics/sales:
 *   get:
 *     tags: [Analytics]
 *     summary: Get sales analytics
 *     responses:
 *       200:
 *         description: Sales analytics returned
 */

// Sales analytics
router.get('/sales', authSeller, requireAnyPermission('analytics.view'), getSalesAnalytics);

/**
 * @swagger
 * /api/analytics/customers:
 *   get:
 *     tags: [Analytics]
 *     summary: Get customer analytics
 *     responses:
 *       200:
 *         description: Customer analytics returned
 */

// Customer analytics
router.get('/customers', authSeller, requireAnyPermission('analytics.view'), getCustomerAnalytics);

/**
 * @swagger
 * /api/analytics/products:
 *   get:
 *     tags: [Analytics]
 *     summary: Get product analytics
 *     responses:
 *       200:
 *         description: Product analytics returned
 */

// Product analytics
router.get('/products', authSeller, requireAnyPermission('analytics.view'), getProductAnalytics);

/**
 * @swagger
 * /api/analytics/riders:
 *   get:
 *     tags: [Analytics]
 *     summary: Get rider analytics
 *     responses:
 *       200:
 *         description: Rider analytics returned
 */

// Rider analytics
router.get('/riders', authSeller, requireAnyPermission('analytics.view'), getRiderAnalytics);

export default router;
