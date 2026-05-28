import express from 'express';
import { subscribe, downgrade, cancel } from '../controllers/MembershipController.js';

const router = express.Router();

// Subscribe to a tier (expects Razorpay payload)
router.post('/subscribe', subscribe);

// Downgrade to a lower tier (e.g., silver -> free)
router.post('/downgrade', downgrade);

// Cancel membership (revert to free)
router.post('/cancel', cancel);

export default router;
