import express from 'express';
import { 
    createOffer, 
    getCustomerOffers, 
    getSellerOffers, 
    respondToOffer, 
    validateOfferToken 
} from '../controllers/OfferController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const offerRoutes = express.Router();

// Make new offer (Customer only)
offerRoutes.post('/', requireAuth(['customer', 'admin', 'super_admin']), createOffer);

// Get active and past bargains for a customer (Customer only)
offerRoutes.get('/customer', requireAuth(['customer', 'admin', 'super_admin']), getCustomerOffers);

// Get received bargains for a seller (Seller only)
offerRoutes.get('/seller', requireAuth(['seller', 'admin', 'super_admin']), getSellerOffers);

// Seller responds to an offer (Seller only)
offerRoutes.put('/:id/respond', requireAuth(['seller', 'admin', 'super_admin']), respondToOffer);

// Public verification of bargain token (e.g. at checkout)
offerRoutes.get('/validate/:token', validateOfferToken);

export default offerRoutes;
