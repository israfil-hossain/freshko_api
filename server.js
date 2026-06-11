import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import connectDB from './configs/db.js';
import { swaggerSpec } from './configs/swagger.js';
import 'dotenv/config';
import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import connectCloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import { stripeWebhooks } from './controllers/orderController.js';
import subscriptionRouter from './routes/subscriptionRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import deliveryManRouter from './routes/deliveryManRoute.js';
import dashboardRouter from './routes/dashboardRoute.js';
import newsletterRouter from './routes/newsletterRoute.js';
import deliveryChargeRouter from './routes/deliveryChargeRoute.js';
import { seedDefaultCategories } from './services/categorySeedService.js';

const app = express();

const port = process.env.PORT || 5001;
await connectDB();
await connectCloudinary();
await seedDefaultCategories();

const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'exp://localhost:8081',
    'exp://localhost:19000',
    'exp://localhost:19001',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * @swagger
 * /stripe:
 *   post:
 *     tags: [Stripe Webhooks]
 *     summary: Stripe payment webhook endpoint
 *     description: Receives webhook events from Stripe for payment confirmations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhooks);

// Middleware Configuration
app.use(express.json());
app.use(cookieParser());


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: API is healthy
 */
app.get('/', (req, res) => res.send('API is working!'));

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Detailed health check
 *     responses:
 *       200:
 *         description: Health status with database connection info
 */
app.get('/health', async (req, res) => {
    try {
        const mongoose = await import('mongoose');
        const dbState = mongoose.default.connection.readyState;
        const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
        res.json({
            status: 'healthy',
            database: dbStatus,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});
app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/category', categoryRouter);
app.use('/api/delivery-man', deliveryManRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/delivery-charge', deliveryChargeRouter);

// Cron jobs now run via Vercel Cron Jobs at /api/cron/subscription

// For Vercel serverless deployment
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`PORT connected on ${port}`);
    });
}

export default app;
