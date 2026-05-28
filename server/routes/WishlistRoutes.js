import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, clearWishlist } from '../controllers/WishlistController.js';

import { requireAuth } from '../middleware/authMiddleware.js';

const wishlistRoutes = express.Router();

// Wishlist routes
wishlistRoutes.get('/:customer_id', requireAuth(['customer', 'admin', 'super_admin']), getWishlist);
wishlistRoutes.post('/add', requireAuth(['customer', 'admin', 'super_admin']), addToWishlist);
wishlistRoutes.delete('/remove/:wishlist_item_id', requireAuth(['customer', 'admin', 'super_admin']), removeFromWishlist);
wishlistRoutes.delete('/clear/:customer_id', requireAuth(['customer', 'admin', 'super_admin']), clearWishlist);

export default wishlistRoutes;
