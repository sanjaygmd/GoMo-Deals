import express from 'express';
import rateLimit from 'express-rate-limit';
import { handleRazorpayWebhook } from '../controllers/WebhookController.js';

const webhookRoutes = express.Router();

const webhookLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: { success: false, message: "Too many webhook requests" }
});

// The body must remain a raw Buffer for HMAC validation, so we don't apply express.json() here.
// The raw middleware is applied in server.js.
webhookRoutes.post('/', webhookLimiter, handleRazorpayWebhook);

export default webhookRoutes;
