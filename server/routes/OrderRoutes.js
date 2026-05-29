import express from 'express';
import { createOrder, getMyOrders, getOrderById, updateOrderStatus, createReturnRequest, sendOrderEmail, createRazorpayOrder } from '../controllers/OrderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const orderRoutes = express.Router();

orderRoutes.post('/create', requireAuth(['customer']), createOrder);
orderRoutes.post('/razorpay/create-order', requireAuth(['customer', 'seller']), createRazorpayOrder);
orderRoutes.get('/customer/:customer_id', requireAuth(['customer', 'admin', 'super_admin']), getMyOrders);
orderRoutes.get('/order/:order_id', requireAuth(['customer', 'seller', 'admin', 'super_admin']), getOrderById);
orderRoutes.patch('/status/:order_id', requireAuth(['customer', 'seller', 'admin', 'super_admin']), updateOrderStatus);
orderRoutes.post('/return', requireAuth(['customer']), createReturnRequest);
orderRoutes.post('/send-confirmation', requireAuth(['customer']), sendOrderEmail);

export default orderRoutes;
