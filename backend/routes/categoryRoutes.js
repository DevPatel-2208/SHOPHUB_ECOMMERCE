import express from 'express';
import { getCategories, getAdminCategories, createCategory, updateCategory, deleteCategory, getSubcategories, getAdminSubcategories, createSubcategory, updateSubcategory, deleteSubcategory } from '../controllers/categoryController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// Public
router.get('/', getCategories);
router.get('/subcategories', getSubcategories);

// Admin
router.get('/admin', protect, adminOnly, getAdminCategories);
router.get('/subcategories/admin', protect, adminOnly, getAdminSubcategories);
router.post('/', protect, adminOnly, uploadSingle, createCategory);
router.put('/:id', protect, adminOnly, uploadSingle, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

router.post('/subcategories', protect, adminOnly, uploadSingle, createSubcategory);
router.put('/subcategories/:id', protect, adminOnly, uploadSingle, updateSubcategory);
router.delete('/subcategories/:id', protect, adminOnly, deleteSubcategory);

export default router;
