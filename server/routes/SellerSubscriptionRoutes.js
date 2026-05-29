import express from 'express';
import { subscribe, cancel } from '../controllers/SellerSubscriptionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Subscribe to a seller plan (expects Razorpay payload)
router.post('/subscribe', requireAuth(['seller']), subscribe);

// Cancel seller subscription (revert to free)
router.post('/cancel', requireAuth(['seller']), cancel);

export default router;
