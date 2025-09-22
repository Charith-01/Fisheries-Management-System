import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import customerRouter from './routes/customerRouter.js';
import adminRouter from './routes/adminRouter.js';
import fishermanRouter from './routes/fishermanRouter.js';
import dotenv from 'dotenv';
import cors from 'cors';
import verifyJWT from './middleware/auth.js';
import tripRouter from './routes/tripRouter.js';
import boatRouter from './routes/boatRouter.js';
import notificationRoutes from './routes/notificationRoutes.js'
import loginController from './controllers/loginController.js';

 import fishStockRouter from './routes/fishStockRouter.js';
 import reviewRouter from './routes/reviewRouter.js';

import paymentRouter from './routes/paymentRouter.js';
import equipmentRouter from './routes/equipmentRouter.js';
import productRouter from './routes/productRouter.js';

import expenseRoutes from './routes/expenseRoutes.js'

import orderRouter from './routes/orderRouter.js';




// Load environment variables
dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

//Connect to MongoDB
mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.error("MongoDB connection error:", error);
});

//Body Parser Middleware
app.use(bodyParser.json());

//JWT Authentication Middleware
app.use(verifyJWT);

//Routes
app.post("/api/auth/login", loginController);

app.use("/api/customer", customerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/fisherman", fishermanRouter);
app.use("/api/trip", tripRouter);
app.use("/api/boat", boatRouter)
app.use("/api/notifications", notificationRoutes);
app.use("/api/review", reviewRouter);
app.use("/api/fishstock", fishStockRouter);


app.use("/api/payment", paymentRouter);
app.use("/api/expenses", expenseRoutes);

app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use("/api/equipment", equipmentRouter)
app.use("/api/product", productRouter)
app.use("/api/order", orderRouter);


//Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
 
});
