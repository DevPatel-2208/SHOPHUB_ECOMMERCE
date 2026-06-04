import ProductAttribute from '../models/ProductAttribute.js';
import Product from '../models/Product.js';
import Attribute from '../models/Attribute.js';

// @desc    Create product attribute
// @route   POST /api/admin/product-attributes
export const createProductAttribute = async (req, res) => {
  try {
    const { product, attribute, value, category, subcategory } = req.body;

    // Check if product exists
    const productDoc = await Product.findById(product);
    if (!productDoc) return res.status(400).json({ success: false, message: 'Product not found' });

    // Check if attribute exists
    const attributeDoc = await Attribute.findById(attribute);
    if (!attributeDoc) return res.status(400).json({ success: false, message: 'Attribute not found' });

    // Check duplicate
    const existing = await ProductAttribute.findOne({ product, attribute });
    if (existing) return res.status(400).json({ success: false, message: 'This attribute is already assigned to this product' });

    const productAttribute = await ProductAttribute.create({
      product,
      attribute,
      value,
      category: category || productDoc.category,
      subcategory: subcategory || productDoc.subcategory,
    });

    res.status(201).json({ success: true, productAttribute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all product attributes
// @route   GET /api/admin/product-attributes
export const getProductAttributes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, product, attribute, category, subcategory, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (product) query.product = product;
    if (attribute) query.attribute = attribute;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const productAttributes = await ProductAttribute.find(query)
      .populate('product', 'name')
      .populate('attribute', 'name type')
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ProductAttribute.countDocuments(query);
    res.json({ success: true, productAttributes, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product attribute
// @route   PUT /api/admin/product-attributes/:id
export const updateProductAttribute = async (req, res) => {
  try {
    const { value, attribute } = req.body;

    const updateData = {};
    if (value) updateData.value = value;
    if (attribute) updateData.attribute = attribute;

    const productAttribute = await ProductAttribute.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!productAttribute) return res.status(404).json({ success: false, message: 'Product attribute not found' });

    res.json({ success: true, productAttribute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product attribute
// @route   DELETE /api/admin/product-attributes/:id
export const deleteProductAttribute = async (req, res) => {
  try {
    const productAttribute = await ProductAttribute.findByIdAndDelete(req.params.id);
    if (!productAttribute) return res.status(404).json({ success: false, message: 'Product attribute not found' });
    res.json({ success: true, message: 'Product attribute deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};