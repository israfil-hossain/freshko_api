import express from 'express';
import { subscribe, unsubscribe, listSubscribers, deleteSubscriber, sendNewsletter, getSentNewsletters } from '../controllers/newsletterController.js';
import authSeller from '../middlewares/authSeller.js';

const newsletterRouter = express.Router();

/**
 * @swagger
 * /api/newsletter/subscribe:
 *   post:
 *     tags: [Newsletter]
 *     summary: Subscribe to newsletter (public)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Subscribed
 */
newsletterRouter.post('/subscribe', subscribe);

/**
 * @swagger
 * /api/newsletter/unsubscribe:
 *   post:
 *     tags: [Newsletter]
 *     summary: Unsubscribe from newsletter (public)
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
 *         description: Unsubscribed
 */
newsletterRouter.post('/unsubscribe', unsubscribe);

/**
 * @swagger
 * /api/newsletter/subscribers:
 *   get:
 *     tags: [Newsletter]
 *     summary: List newsletter subscribers (Admin)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ['active', 'inactive'] }
 *     responses:
 *       200:
 *         description: List of subscribers
 */
newsletterRouter.get('/subscribers', authSeller, listSubscribers);

/**
 * @swagger
 * /api/newsletter/subscribers/{id}:
 *   delete:
 *     tags: [Newsletter]
 *     summary: Delete a subscriber (Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
newsletterRouter.delete('/subscribers/:id', authSeller, deleteSubscriber);

/**
 * @swagger
 * /api/newsletter/send:
 *   post:
 *     tags: [Newsletter]
 *     summary: Send newsletter email (Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, body]
 *             properties:
 *               subject: { type: string }
 *               body: { type: string }
 *               recipientIds: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Newsletter sent
 */
newsletterRouter.post('/send', authSeller, sendNewsletter);

/**
 * @swagger
 * /api/newsletter/sent:
 *   get:
 *     tags: [Newsletter]
 *     summary: Get sent newsletters history (Admin)
 *     responses:
 *       200:
 *         description: List of sent newsletters
 */
newsletterRouter.get('/sent', authSeller, getSentNewsletters);

export default newsletterRouter;
