import Attribute from '../models/Attribute.js';

// @desc    Create attribute
// @route   POST /api/admin/attributes
export const createAttribute = async (req, res) => {
  try {
    const { name, category, subcategory, brand, type, values, unit, isFilterable, isActive, order } = req.body;

    const attribute = await Attribute.create({
      name,
      category,
      subcategory: subcategory || null,
      brand: brand || null,
      type: type || 'text',
      values: values || [],
      unit: unit || '',
      isFilterable: isFilterable ?? true,
      isActive: isActive ?? true,
      order: order || 0,
    });

    res.status(201).json({ success: true, attribute });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Attribute name already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all attributes
// @route   GET /api/admin/attributes
export const getAttributes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, subcategory, brand, isActive, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = brand;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const attributes = await Attribute.find(query)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('brand', 'name')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attribute.countDocuments(query);
    res.json({ success: true, attributes, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single attribute
// @route   GET /api/admin/attributes/:id
export const getAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id).populate('category', 'name').populate('subcategory', 'name').populate('brand', 'name');
    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });
    res.json({ success: true, attribute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update attribute
// @route   PUT /api/admin/attributes/:id
export const updateAttribute = async (req, res) => {
  try {
    const { name, category, subcategory, brand, type, values, unit, isFilterable, isActive, order } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (subcategory) updateData.subcategory = subcategory;
    if (brand) updateData.brand = brand;
    if (type) updateData.type = type;
    if (values) updateData.values = values;
    if (unit) updateData.unit = unit;
    if (isFilterable !== undefined) updateData.isFilterable = isFilterable;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order) updateData.order = order;

    const attribute = await Attribute.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });

    res.json({ success: true, attribute });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Attribute name already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete attribute
// @route   DELETE /api/admin/attributes/:id
export const deleteAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.findByIdAndDelete(req.params.id);
    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });
    res.json({ success: true, message: 'Attribute deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};