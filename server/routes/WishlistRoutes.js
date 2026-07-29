import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, clearWishlist, createWishlistShare, getSharedWishlist } from '../controllers/WishlistController.js';

import { requireAuth } from '../middleware/authMiddleware.js';

const wishlistRoutes = express.Router();

// Wishlist routes — more specific routes MUST come before dynamic /:param routes
wishlistRoutes.post('/add', requireAuth(['customer', 'admin', 'super_admin']), addToWishlist);
wishlistRoutes.post('/share', requireAuth(['customer', 'admin', 'super_admin']), createWishlistShare);
wishlistRoutes.get('/share/:token', getSharedWishlist);
wishlistRoutes.delete('/remove/:wishlist_item_id', requireAuth(['customer', 'admin', 'super_admin']), removeFromWishlist);
wishlistRoutes.delete('/clear/:customer_id', requireAuth(['customer', 'admin', 'super_admin']), clearWishlist);
wishlistRoutes.get('/:customer_id', requireAuth(['customer', 'admin', 'super_admin']), getWishlist);

export default wishlistRoutes;
