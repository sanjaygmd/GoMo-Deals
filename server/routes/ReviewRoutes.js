import express from 'express';
import { 
    addReview, 
    getProductReviews, 
    checkCanReview, 
    updateReview 
} from '../controllers/ReviewController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const reviewRoutes = express.Router();

// Public Routes
reviewRoutes.get('/product/:productId', getProductReviews);

// Protected Customer Routes
reviewRoutes.get('/check/:productId', requireAuth(['customer']), checkCanReview);
reviewRoutes.post('/add', requireAuth(['customer']), addReview);
reviewRoutes.put('/:id', requireAuth(['customer']), updateReview);

export default reviewRoutes;
