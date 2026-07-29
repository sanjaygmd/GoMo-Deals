import express from 'express';
import { 
    createCompetition, 
    getAdminCompetitions, 
    getOpenCompetitions, 
    applyForCompetition, 
    voteForBrand, 
    selectWinner, 
    getActiveShowcase,
    updateCompetition,
    deleteCompetition
} from '../controllers/RankingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const rankingRoutes = express.Router();

// Public / open endpoints (authentication optional in getOpenCompetitions to check voting status)
rankingRoutes.get('/open', (req, res, next) => {
    // Optional auth check without rejecting unauthenticated users
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        requireAuth(['customer', 'seller', 'admin', 'super_admin'])(req, res, (err) => {
            if (err) {
                req.user = null; // Ignore invalid tokens for public view
            }
            next();
        });
    } else {
        next();
    }
}, getOpenCompetitions);

rankingRoutes.get('/showcase', getActiveShowcase);

// Admin endpoints
rankingRoutes.post('/admin', requireAuth(['admin', 'super_admin']), createCompetition);
rankingRoutes.get('/admin', requireAuth(['admin', 'super_admin']), getAdminCompetitions);
rankingRoutes.post('/admin/winner', requireAuth(['admin', 'super_admin']), selectWinner);
rankingRoutes.put('/admin/:id', requireAuth(['admin', 'super_admin']), updateCompetition);
rankingRoutes.delete('/admin/:id', requireAuth(['admin', 'super_admin']), deleteCompetition);

// Seller endpoints
rankingRoutes.post('/apply', requireAuth(['seller']), applyForCompetition);

// Customer endpoints (or anyone logged in can vote)
rankingRoutes.post('/vote', requireAuth(['customer', 'seller', 'admin', 'super_admin']), voteForBrand);

export default rankingRoutes;
