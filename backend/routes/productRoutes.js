import express from 'express';
import { getProducts, getProduct, getProductDetails, getProductReviewSummary, createProduct, updateProduct, deleteProduct, getFeatured, searchProducts, getFilterMetadata, getFilterCounts } from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeatured);
router.get('/filters/metadata', getFilterMetadata);
router.post('/filter-counts', getFilterCounts);
router.get('/:id/details', getProductDetails);
router.get('/:id/review-summary', getProductReviewSummary);
router.get('/:id', getProduct);
router.post('/', protect, adminOnly, uploadMultiple, createProduct);
router.put('/:id', protect, adminOnly, uploadMultiple, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
