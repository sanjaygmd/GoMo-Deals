import express from 'express';
import AiController from '../controllers/AiController.js';

const router = express.Router();

// POST /api/ai/virtual-try-on
router.post('/virtual-try-on', AiController.generateVirtualTryOn);

export default router;
