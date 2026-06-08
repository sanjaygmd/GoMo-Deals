import express from 'express';
import { 
    addReview, 
    getProductReviews, 
    checkCanReview, 
    updateReview,
    moderateReview,
    replyToReview,
    getAllReviews,
    getSellerReviews
} from '../controllers/ReviewController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const reviewRoutes = express.Router();

// Public Routes
reviewRoutes.get('/product/:productId', getProductReviews);

// Protected Customer Routes
reviewRoutes.get('/check/:productId', requireAuth(['customer']), checkCanReview);
reviewRoutes.post('/add', requireAuth(['customer']), addReview);
reviewRoutes.put('/:id', requireAuth(['customer']), updateReview);

// Seller Moderation Route
reviewRoutes.get('/seller', requireAuth(['seller']), getSellerReviews);
reviewRoutes.put('/:id/reply', requireAuth(['seller']), replyToReview);

// Admin Moderation Route
reviewRoutes.get('/', requireAuth(['admin', 'super_admin']), getAllReviews);
reviewRoutes.put('/:id/moderate', requireAuth(['admin', 'super_admin']), moderateReview);

export default reviewRoutes;
