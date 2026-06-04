import Brand from '../models/Brand.js';
import Subcategory from '../models/Subcategory.js';
import Category from '../models/Category.js';

// @desc    Create brand
// @route   POST /api/admin/brands
export const createBrand = async (req, res) => {
  try {
    const { name, subcategory, description, isActive, order } = req.body;

    // Get category from subcategory
    const subcat = await Subcategory.findById(subcategory);
    if (!subcat) return res.status(400).json({ success: false, message: 'Subcategory not found' });

    const brand = await Brand.create({
      name,
      subcategory,
      category: subcat.category,
      logo: req.file?.path || '',
      description: description || '',
      isActive: isActive ?? true,
      order: order || 0,
    });

    res.status(201).json({ success: true, brand });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Brand name already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all brands
// @route   GET /api/admin/brands
export const getBrands = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, subcategory, category, isActive, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (search) query.name = { $regex: search, $options: 'i' };
    if (subcategory) query.subcategory = subcategory;
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const brands = await Brand.find(query)
      .populate('subcategory', 'name')
      .populate('category', 'name')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Brand.countDocuments(query);
    res.json({ success: true, brands, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single brand
// @route   GET /api/admin/brands/:id
export const getBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).populate('subcategory', 'name').populate('category', 'name');
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update brand
// @route   PUT /api/admin/brands/:id
export const updateBrand = async (req, res) => {
  try {
    const { name, subcategory, description, isActive, order } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order) updateData.order = order;
    if (req.file?.path) updateData.logo = req.file.path;

    if (subcategory) {
      const subcat = await Subcategory.findById(subcategory);
      if (!subcat) return res.status(400).json({ success: false, message: 'Subcategory not found' });
      updateData.subcategory = subcategory;
      updateData.category = subcat.category;
    }

    const brand = await Brand.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    res.json({ success: true, brand });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Brand name already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete brand
// @route   DELETE /api/admin/brands/:id
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle brand status
// @route   PATCH /api/admin/brands/:id/status
export const toggleBrandStatus = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    brand.isActive = !brand.isActive;
    await brand.save();
    res.json({ success: true, brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};