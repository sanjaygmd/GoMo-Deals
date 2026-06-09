import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/CartController.js';

import { requireAuth } from '../middleware/authMiddleware.js';

const cartRoutes = express.Router();

cartRoutes.get('/:customer_id', requireAuth(['customer', 'admin', 'super_admin']), getCart);
cartRoutes.post('/add', requireAuth(['customer', 'admin', 'super_admin']), addToCart);

cartRoutes.patch('/update', requireAuth(['customer', 'admin', 'super_admin']), updateCartItem);
cartRoutes.delete('/remove/:cart_item_id', requireAuth(['customer', 'admin', 'super_admin']), removeFromCart);
cartRoutes.delete('/clear/:customer_id', requireAuth(['customer', 'admin', 'super_admin']), clearCart);

export default cartRoutes;
