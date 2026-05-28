import express from 'express';
import { handleChatMessage } from '../controllers/ChatbotController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { chatbotLimiter } from '../middleware/rateLimiter.js';

const chatbotRoutes = express.Router();

// Public route that contextually personalizes responses if session cookie is present
chatbotRoutes.post('/message', chatbotLimiter, optionalAuth, handleChatMessage);

export default chatbotRoutes;
