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

const app = express();

const port = process.env.PORT || 5001;
await connectDB();
await connectCloudinary();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhooks);

// Middleware Configuration
app.use(express.json());
app.use(cookieParser());


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/', (req, res) => res.send('API is working!'));
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