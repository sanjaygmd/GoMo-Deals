import express from 'express';
import { addProduct, getProducts, getProductsById, getCategories, getProductBySlug, addVariants, updateProduct, deleteProduct, searchProducts, updateVariant, getProductStats, getAllAdminProducts, bulkUploadProducts, getVendorComparison, performVisualSearch } from '../controllers/ProductController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const productRoutes = express.Router();

// Admin/Seller Routes (Allow 5MB for product images)
const bodyLimit5mb = express.json({ limit: '5mb' });

productRoutes.post('/add', requireAuth(['seller', 'admin', 'super_admin']), bodyLimit5mb, addProduct);
productRoutes.post('/bulk-upload', requireAuth(['seller', 'admin', 'super_admin']), upload.single('file'), bulkUploadProducts);
productRoutes.post('/add-variants', requireAuth(['seller', 'admin', 'super_admin']), bodyLimit5mb, addVariants);
productRoutes.get('/admin/stats', requireAuth(['admin', 'super_admin']), getProductStats);
productRoutes.get('/admin/all', requireAuth(['admin', 'super_admin']), getAllAdminProducts);
productRoutes.post('/visual-search', bodyLimit5mb, performVisualSearch);

productRoutes.get('/allproducts', getProducts);
productRoutes.get('/categories', getCategories);
productRoutes.get('/search', searchProducts);
productRoutes.get('/slug/:slug', getProductBySlug);
productRoutes.put('/variant/:variant_id', requireAuth(['seller', 'admin', 'super_admin']), updateVariant);
productRoutes.put('/:product_id', requireAuth(['seller', 'admin', 'super_admin']), bodyLimit5mb, updateProduct);
productRoutes.delete('/:product_id', requireAuth(['seller', 'admin', 'super_admin']), deleteProduct);
productRoutes.get('/:product_id/compare-vendors', getVendorComparison);
productRoutes.get('/:product_id', getProductsById);

export default productRoutes