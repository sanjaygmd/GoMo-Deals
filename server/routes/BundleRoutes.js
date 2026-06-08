import express from 'express';
import { createBundle, getSellerBundles, getProductBundles, deleteBundle, toggleBundleStatus } from '../controllers/BundleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const bundleRoutes = express.Router();

// Seller routes
bundleRoutes.post('/', requireAuth(['seller', 'admin', 'super_admin']), createBundle);
bundleRoutes.get('/seller', requireAuth(['seller', 'admin', 'super_admin']), getSellerBundles);
bundleRoutes.delete('/:bundle_id', requireAuth(['seller', 'admin', 'super_admin']), deleteBundle);
bundleRoutes.put('/:bundle_id/toggle', requireAuth(['seller', 'admin', 'super_admin']), toggleBundleStatus);

// Public routes
bundleRoutes.get('/product/:product_id', getProductBundles);

export default bundleRoutes;
