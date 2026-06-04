import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';

// @desc    Get all categories (public - active only)
// @route   GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all categories (admin - includes inactive)
// @route   GET /api/categories/admin
export const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create category (Admin)
// @route   POST /api/categories
export const createCategory = async (req, res) => {
  try {
    if (req.file) {
      req.body.image = req.file.path;
    }
    if (req.body.isActive) req.body.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.order) req.body.order = Number(req.body.order);
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    if (req.file) {
      req.body.image = req.file.path;
    }
    if (req.body.isActive) req.body.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.order) req.body.order = Number(req.body.order);
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Category deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Subcategories
export const getSubcategories = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.category) query.category = req.query.category;
    const subcategories = await Subcategory.find(query).populate('category', 'name');
    res.json({ success: true, subcategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all subcategories (admin - includes inactive)
// @route   GET /api/categories/subcategories/admin
export const getAdminSubcategories = async (req, res) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    const subcategories = await Subcategory.find(query).populate('category', 'name');
    res.json({ success: true, subcategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubcategory = async (req, res) => {
  try {
    if (req.file) {
      req.body.image = req.file.path;
    }
    if (req.body.isActive) req.body.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    const subcategory = await Subcategory.create(req.body);
    res.status(201).json({ success: true, subcategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    if (req.file) {
      req.body.image = req.file.path;
    }
    if (req.body.isActive) req.body.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    const subcategory = await Subcategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, subcategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    await Subcategory.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Subcategory deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
