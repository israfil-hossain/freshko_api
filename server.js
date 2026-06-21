import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import swaggerUi from "swagger-ui-express";
import connectDB from "./configs/db.js";
import { initSocket } from "./configs/socket.js";
import { swaggerSpec } from "./configs/swagger.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";

// Routes
import connectCloudinary from "./configs/cloudinary.js";
import { stripeWebhooks } from "./controllers/orderController.js";
import addressRouter from "./routes/addressRoute.js";
import analyticsRouter from "./routes/analyticsRoute.js";
import bannerRouter from "./routes/bannerRoute.js";
import cartRouter from "./routes/cartRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import dashboardRouter from "./routes/dashboardRoute.js";
import deliveryChargeRouter from "./routes/deliveryChargeRoute.js";
import deliveryManRouter from "./routes/deliveryManRoute.js";
import newsletterRouter from "./routes/newsletterRoute.js";
import notificationRouter from "./routes/notificationRoute.js";
import orderRouter from "./routes/orderRoute.js";
import productRouter from "./routes/productRoute.js";
import promotionRouter from "./routes/promotionRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import subscriptionRouter from "./routes/subscriptionRoute.js";
import supportRouter from "./routes/supportRoute.js";
import trackingRouter from "./routes/trackingRoute.js";
import userRouter from "./routes/userRoute.js";
import walletRouter from "./routes/walletRoute.js";
import { seedDefaultCategories } from "./services/categorySeedService.js";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

const port = process.env.PORT || 5001;
await connectDB();

// Auto-fix referralCode duplicate index issue
try {
  const mongoose = await import("mongoose");
  await mongoose.default.connection.db
    .collection("users")
    .dropIndex("referralCode_1");
  console.log("✅ referralCode index fixed");
} catch (e) {
  // Index already fixed or doesn't exist — safe to ignore
}

await connectCloudinary();
await seedDefaultCategories();

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:19006",
  "exp://localhost:8081",
  "exp://localhost:19000",
  "exp://localhost:19001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting
app.use("/api/", apiLimiter);

// Stripe webhook
app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// Middleware Configuration
app.use(express.json());
app.use(cookieParser());

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get("/", (req, res) => res.send("API is working!"));
app.get("/health", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const dbState = mongoose.default.connection.readyState;
    const dbStatus = dbState === 1 ? "connected" : "disconnected";
    res.json({
      status: "healthy",
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

// API Routes
app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/category", categoryRouter);
app.use("/api/delivery-man", deliveryManRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/delivery-charge", deliveryChargeRouter);
app.use("/api/banner", bannerRouter);

// New Phase 1 Routes
app.use("/api/wallet", walletRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/support", supportRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/tracking", trackingRouter);

// Phase 2 Routes
app.use("/api/analytics", analyticsRouter);

// Cron jobs now run via Vercel Cron Jobs at /api/cron/subscription

// For Vercel serverless deployment
if (process.env.NODE_ENV !== "production") {
  httpServer.listen(port, () => {
    console.log(`PORT connected on ${port}`);
    console.log(`Socket.IO initialized`);
  });
}

export default app;
export { httpServer };
