import express from 'express';
import { cancelOrder, createOrder, deleteOrder, getOrderById, getOrders, updateOrder, updateOrderStatus } from '../controllers/orderController.js';
import verifyJWT from "../middleware/auth.js";
const orderRouter = express.Router();

orderRouter.post('/create', createOrder);
orderRouter.get('/all', getOrders);
//This route expects orderId as a parameter
orderRouter.get('/:orderId',verifyJWT, getOrderById);
orderRouter.put('/update/:orderId',verifyJWT, updateOrder);
orderRouter.put('/status/:orderId',verifyJWT, updateOrderStatus);
orderRouter.post('/cancel/:orderId',verifyJWT, cancelOrder);
orderRouter.delete('/delete/:orderId',verifyJWT, deleteOrder);

export default orderRouter;