import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import verifyJWT from './middleware/auth.js';

import customerRouter from './routes/customerRouter.js';
import adminRouter from './routes/adminRouter.js';
import fishermanRouter from './routes/fishermanRouter.js';
import tripRouter from './routes/tripRouter.js';
import boatRouter from './routes/boatRouter.js';
import notificationRoutes from './routes/notificationRoutes.js';
import loginController from './controllers/loginController.js';
import incomeRoutes from './routes/incomeRoutes.js';
import paymentRouter from './routes/paymentRouter.js';
import fishStockRouter from './routes/fishStockRouter.js';
import reviewRouter from './routes/reviewRouter.js';
import equipmentRouter from './routes/equipmentRouter.js';
import productRouter from './routes/productRouter.js';
import expenseRoutes from './routes/expenseRoutes.js';
import orderRouter from './routes/orderRouter.js';
import weatherRouter from './routes/weatherRouter.js';

import { handleWebhook } from './controllers/paymentController.js';
import depthRoutes from './routes/depth.js';
import chatRouter from './routes/chatRouter.js';

// ✅ New import for Google Auth router
import googleAuthRouter from './routes/googleAuthRouter.js';

dotenv.config();

const app = express();

// CORS
app.use(cors());

// MongoDB
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("MongoDB connection error:", error);
});

/**
 * IMPORTANT: Stripe webhook needs the raw body and NO auth.
 * We mount this ONE route early with express.raw, before any JSON parsing or auth.
 */
app.post("/api/payment/webhook", express.raw({ type: 'application/json' }), handleWebhook);

/**
 * Body parser for the rest of the app
 */
app.use(bodyParser.json());

/**
 * JWT auth for everything else, but skip the webhook URL explicitly.
 * (This keeps your global pattern and preserves existing per-route checks.)
 */
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") return next();
  return verifyJWT(req, res, next);
});

// Routes
app.post("/api/auth/login", loginController);

// ✅ New Google Auth routes
app.use("/api/auth/google", googleAuthRouter);

app.use("/api/customer", customerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/fisherman", fishermanRouter);
app.use("/api/trip", tripRouter);
app.use("/api/boat", boatRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/review", reviewRouter);
app.use("/api/income", incomeRoutes);
app.use("/api/fishstock", fishStockRouter);
app.use("/api/expenses", expenseRoutes);
app.use("/api/equipment", equipmentRouter);
app.use("/api/product", productRouter);
app.use("/api/order", orderRouter);
app.use("/api/weather", weatherRouter);


//Chatbot route
app.use("/api/chat", chatRouter);

app.use('/api/depth', depthRoutes);

app.use("/api/payment", paymentRouter);

// Server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
