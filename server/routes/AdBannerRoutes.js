import express from 'express';
const router = express.Router();

import { 
    createBanner, 
    updateBanner, 
    deleteBanner, 
    getAdminBanners, 
    getActiveBanners 
} from '../controllers/AdBannerController.js';

import { requireAuth } from '../middleware/authMiddleware.js';

// Public route
router.get('/active', getActiveBanners);

// Admin routes
const adminAuth = requireAuth(['admin', 'super_admin']);
const bodyLimit5mb = express.json({ limit: '5mb' });

router.get('/admin', adminAuth, getAdminBanners);
router.post('/', adminAuth, bodyLimit5mb, createBanner);
router.put('/:id', adminAuth, bodyLimit5mb, updateBanner);
router.delete('/:id', adminAuth, deleteBanner);

export default router;
