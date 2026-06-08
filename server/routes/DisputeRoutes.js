import express from 'express';
import { 
    openDispute, 
    getCustomerDisputes, 
    getSellerDisputes, 
    getAllDisputes, 
    updateDispute 
} from '../controllers/DisputeController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const disputeRoutes = express.Router();

// Customer routes
disputeRoutes.post('/', requireAuth(['customer']), openDispute);
disputeRoutes.get('/customer', requireAuth(['customer']), getCustomerDisputes);

// Seller routes
disputeRoutes.get('/seller', requireAuth(['seller']), getSellerDisputes);
disputeRoutes.put('/:dispute_id/seller', requireAuth(['seller']), updateDispute);

// Admin routes
disputeRoutes.get('/', requireAuth(['admin', 'super_admin']), getAllDisputes);
disputeRoutes.put('/:dispute_id/admin', requireAuth(['admin', 'super_admin']), updateDispute);

export default disputeRoutes;
