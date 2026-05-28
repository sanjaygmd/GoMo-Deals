import express from 'express';
import { handleRazorpayWebhook } from '../controllers/WebhookController.js';

const webhookRoutes = express.Router();

// The body must remain a raw Buffer for HMAC validation, so we don't apply express.json() here.
// The raw middleware is applied in server.js.
webhookRoutes.post('/', handleRazorpayWebhook);

export default webhookRoutes;
