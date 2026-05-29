import express from 'express';
import { subscribe, downgrade, cancel } from '../controllers/MembershipController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Subscribe to a tier (expects Razorpay payload)
router.post('/subscribe', requireAuth(['customer']), subscribe);

// Downgrade to a lower tier (e.g., silver -> free)
router.post('/downgrade', requireAuth(['customer']), downgrade);

// Cancel membership (revert to free)
router.post('/cancel', requireAuth(['customer']), cancel);

export default router;
