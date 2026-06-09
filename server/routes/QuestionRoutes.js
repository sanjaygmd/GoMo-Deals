import express from 'express';
import { getProductQuestions, askQuestion, getSellerQuestions, answerQuestion } from '../controllers/QuestionController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const questionRoutes = express.Router();

// Public route to fetch answered questions for a product
questionRoutes.get('/product/:product_id', optionalAuth, getProductQuestions);

// Customer route to ask a question
questionRoutes.post('/ask', requireAuth(['customer', 'admin', 'super_admin']), askQuestion);

// Seller route to view questions for their products
questionRoutes.get('/seller', requireAuth(['seller', 'admin', 'super_admin']), getSellerQuestions);

// Seller route to answer a question
questionRoutes.post('/answer', requireAuth(['seller', 'admin', 'super_admin']), answerQuestion);

export default questionRoutes;
