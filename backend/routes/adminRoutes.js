import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple, uploadBrandLogo, uploadOfferBanner } from '../middleware/upload.js';

// Admin controllers
import {
  getDashboardStats,
  getAdminProducts,
  toggleProductStatus,
  deleteAdminProduct,
  getAdminOrders,
  getAdminOrderStats,
  getAdminOrderDetail,
  updateAdminOrderStatus,
  getAdminCustomerStats,
  getAdminCustomers,
  getAdminCustomerDetail,
  toggleCustomerStatus,
  deleteAdminCustomer,
  getAdminReviews,
  deleteAdminReview,
  toggleReviewStatus,
  replyToReview,
  toggleCategoryStatus,
  deleteAdminCategory,
  toggleSubcategoryStatus,
  deleteAdminSubcategory,
  getAdminCategoriesPaginated,
  getAdminSubcategoriesPaginated,
} from '../controllers/adminController.js';

// Category controllers
import { createCategory, updateCategory, getAdminCategories, createSubcategory, updateSubcategory } from '../controllers/categoryController.js';

// Brand controllers
import { createBrand, getBrands, getBrand, updateBrand, deleteBrand, toggleBrandStatus } from '../controllers/brandController.js';

// Attribute controllers
import { createAttribute, getAttributes, getAttribute, updateAttribute, deleteAttribute } from '../controllers/attributeController.js';

// Product Attribute controllers
import { createProductAttribute, getProductAttributes, updateProductAttribute, deleteProductAttribute } from '../controllers/productAttributeController.js';

// Offer controllers
import { createOffer, getOffers, getOffer, updateOffer, deleteOffer, toggleOfferStatus } from '../controllers/offerController.js';

// Subscriber controllers
import { getSubscribers, addSubscriber, toggleSubscriberStatus, deleteSubscriber, exportSubscribers } from '../controllers/subscriberController.js';

// Newsletter controllers
import { sendNewsletter, getNewsletterStats } from '../controllers/newsletterController.js';

const router = express.Router();

// ==================== DASHBOARD ====================
router.get('/dashboard', protect, adminOnly, getDashboardStats);

// ==================== PRODUCTS ====================
router.get('/products', protect, adminOnly, getAdminProducts);
router.patch('/products/:id/status', protect, adminOnly, toggleProductStatus);
router.delete('/products/:id', protect, adminOnly, deleteAdminProduct);

// ==================== CATEGORIES ====================
router.get('/categories', protect, adminOnly, getAdminCategoriesPaginated);
router.get('/categories/all', protect, adminOnly, getAdminCategories);
router.post('/categories', protect, adminOnly, uploadSingle, createCategory);
router.put('/categories/:id', protect, adminOnly, uploadSingle, updateCategory);
router.patch('/categories/:id/status', protect, adminOnly, toggleCategoryStatus);
router.delete('/categories/:id', protect, adminOnly, deleteAdminCategory);

// ==================== SUBCATEGORIES ====================
router.get('/subcategories', protect, adminOnly, getAdminSubcategoriesPaginated);
router.post('/subcategories', protect, adminOnly, uploadSingle, createSubcategory);
router.put('/subcategories/:id', protect, adminOnly, uploadSingle, updateSubcategory);
router.patch('/subcategories/:id/status', protect, adminOnly, toggleSubcategoryStatus);
router.delete('/subcategories/:id', protect, adminOnly, deleteAdminSubcategory);

// ==================== BRANDS ====================
router.post('/brands', protect, adminOnly, uploadBrandLogo, createBrand);
router.get('/brands', protect, adminOnly, getBrands);
router.get('/brands/:id', protect, adminOnly, getBrand);
router.put('/brands/:id', protect, adminOnly, uploadBrandLogo, updateBrand);
router.delete('/brands/:id', protect, adminOnly, deleteBrand);
router.patch('/brands/:id/status', protect, adminOnly, toggleBrandStatus);

// ==================== ATTRIBUTES ====================
router.post('/attributes', protect, adminOnly, createAttribute);
router.get('/attributes', protect, adminOnly, getAttributes);
router.get('/attributes/:id', protect, adminOnly, getAttribute);
router.put('/attributes/:id', protect, adminOnly, updateAttribute);
router.delete('/attributes/:id', protect, adminOnly, deleteAttribute);

// ==================== PRODUCT ATTRIBUTES ====================
router.post('/product-attributes', protect, adminOnly, createProductAttribute);
router.get('/product-attributes', protect, adminOnly, getProductAttributes);
router.put('/product-attributes/:id', protect, adminOnly, updateProductAttribute);
router.delete('/product-attributes/:id', protect, adminOnly, deleteProductAttribute);

// ==================== OFFERS ====================
router.post('/offers', protect, adminOnly, uploadOfferBanner, createOffer);
router.get('/offers', protect, adminOnly, getOffers);
router.get('/offers/:id', protect, adminOnly, getOffer);
router.put('/offers/:id', protect, adminOnly, uploadOfferBanner, updateOffer);
router.delete('/offers/:id', protect, adminOnly, deleteOffer);
router.patch('/offers/:id/status', protect, adminOnly, toggleOfferStatus);

// ==================== ORDERS ====================
router.get('/orders/stats', protect, adminOnly, getAdminOrderStats);
router.get('/orders', protect, adminOnly, getAdminOrders);
router.get('/orders/:id', protect, adminOnly, getAdminOrderDetail);
router.patch('/orders/:id/status', protect, adminOnly, updateAdminOrderStatus);

// ==================== CUSTOMERS ====================
router.get('/customers/stats', protect, adminOnly, getAdminCustomerStats);
router.get('/customers', protect, adminOnly, getAdminCustomers);
router.get('/customers/:id', protect, adminOnly, getAdminCustomerDetail);
router.patch('/customers/:id/status', protect, adminOnly, toggleCustomerStatus);
router.delete('/customers/:id', protect, adminOnly, deleteAdminCustomer);

// ==================== REVIEWS ====================
router.get('/reviews', protect, adminOnly, getAdminReviews);
router.delete('/reviews/:id', protect, adminOnly, deleteAdminReview);
router.patch('/reviews/:id/status', protect, adminOnly, toggleReviewStatus);
router.post('/reviews/:id/reply', protect, adminOnly, replyToReview);

// ==================== SUBSCRIBERS ====================
router.get('/subscribers', protect, adminOnly, getSubscribers);
router.post('/subscribers', protect, adminOnly, addSubscriber);
router.patch('/subscribers/:id/status', protect, adminOnly, toggleSubscriberStatus);
router.delete('/subscribers/:id', protect, adminOnly, deleteSubscriber);
router.get('/subscribers/export', protect, adminOnly, exportSubscribers);

// ==================== NEWSLETTER ====================
router.post('/newsletter/send', protect, adminOnly, sendNewsletter);
router.get('/newsletter/stats', protect, adminOnly, getNewsletterStats);

// ==================== UPLOAD ====================
router.post('/upload', protect, adminOnly, uploadSingle, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path, filename: req.file.filename });
});
router.post('/upload/images', protect, adminOnly, uploadMultiple, (req, res) => {
  if (!req.files?.length) return res.status(400).json({ success: false, message: 'No files uploaded' });
  res.json({ success: true, urls: req.files.map(f => f.path), files: req.files.map(f => ({ url: f.path, filename: f.filename })) });
});

export default router;
