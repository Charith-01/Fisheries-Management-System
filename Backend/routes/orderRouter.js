import express from 'express';
import { cancelOrder, createOrder, deleteOrder, getOrderById, getOrders, updateOrder, updateOrderStatus } from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.post('/create', createOrder);
orderRouter.get('/all', getOrders);
orderRouter.get('/:orderId', getOrderById);
orderRouter.put('/update/:orderId', updateOrder);
orderRouter.put('/status/:orderId', updateOrderStatus);
orderRouter.post('/cancel/:orderId', cancelOrder);
orderRouter.delete('/delete/:orderId', deleteOrder);

export default orderRouter;