import Offer from '../models/Offer.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';

// @desc    Create offer
// @route   POST /api/admin/offers
export const createOffer = async (req, res) => {
  try {
    const {
      title, description, discountType, discountValue, maxDiscount, minOrderAmount, priority,
      applyOn, applicableItems, excludeCategories, excludeBrands, excludeProducts,
      startDate, endDate, isActive, maxUsage, maxUsagePerUser
    } = req.body;

    // Validate end date > start date
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    // Validate discount value
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100' });
    }

    const offerData = {
      title,
      description: description || '',
      banner: req.file?.path || '',
      discountType,
      discountValue,
      maxDiscount: maxDiscount || null,
      minOrderAmount: minOrderAmount || 0,
      priority: priority || 0,
      applyOn,
      applicableItems: applicableItems || [],
      excludeCategories: excludeCategories || [],
      excludeBrands: excludeBrands || [],
      excludeProducts: excludeProducts || [],
      startDate,
      endDate,
      isActive: isActive ?? true,
      maxUsage: maxUsage || null,
      maxUsagePerUser: maxUsagePerUser || 1,
    };

    // Set applyOnModel based on applyOn
    if (applyOn === 'category') offerData.applyOnModel = 'Category';
    else if (applyOn === 'brand') offerData.applyOnModel = 'Brand';
    else if (applyOn === 'product') offerData.applyOnModel = 'Product';
    else offerData.applyOnModel = null;

    const offer = await Offer.create(offerData);
    res.status(201).json({ success: true, offer });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Offer title already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all offers
// @route   GET /api/admin/offers
export const getOffers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, applyOn, isActive, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (search) query.title = { $regex: search, $options: 'i' };
    if (applyOn) query.applyOn = applyOn;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Filter by status (virtual)
    const now = new Date();
    if (status === 'active') {
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (status === 'upcoming') {
      query.startDate = { $gt: now };
    } else if (status === 'expired') {
      query.endDate = { $lt: now };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const offers = await Offer.find(query)
      .populate('applicableItems')
      .populate('excludeCategories', 'name')
      .populate('excludeBrands', 'name')
      .populate('excludeProducts', 'name')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Offer.countDocuments(query);

    // Get statistics
    const stats = {
      active: await Offer.countDocuments({ isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }),
      upcoming: await Offer.countDocuments({ startDate: { $gt: now } }),
      expired: await Offer.countDocuments({ endDate: { $lt: now } }),
      total: await Offer.countDocuments(),
    };

    res.json({ success: true, offers, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single offer
// @route   GET /api/admin/offers/:id
export const getOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('applicableItems')
      .populate('excludeCategories', 'name')
      .populate('excludeBrands', 'name')
      .populate('excludeProducts', 'name');
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update offer
// @route   PUT /api/admin/offers/:id
export const updateOffer = async (req, res) => {
  try {
    const {
      title, description, discountType, discountValue, maxDiscount, minOrderAmount, priority,
      applyOn, applicableItems, excludeCategories, excludeBrands, excludeProducts,
      startDate, endDate, isActive, maxUsage, maxUsagePerUser
    } = req.body;

    if (discountType === 'percentage' && discountValue !== undefined && discountValue > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100' });
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (req.file?.path) updateData.banner = req.file.path;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount;
    if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount;
    if (priority !== undefined) updateData.priority = priority;
    if (applyOn !== undefined) {
      updateData.applyOn = applyOn;
      if (applyOn === 'category') updateData.applyOnModel = 'Category';
      else if (applyOn === 'brand') updateData.applyOnModel = 'Brand';
      else if (applyOn === 'product') updateData.applyOnModel = 'Product';
      else updateData.applyOnModel = null;
    }
    if (applicableItems !== undefined) updateData.applicableItems = applicableItems;
    if (excludeCategories !== undefined) updateData.excludeCategories = excludeCategories;
    if (excludeBrands !== undefined) updateData.excludeBrands = excludeBrands;
    if (excludeProducts !== undefined) updateData.excludeProducts = excludeProducts;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (maxUsage !== undefined) updateData.maxUsage = maxUsage;
    if (maxUsagePerUser !== undefined) updateData.maxUsagePerUser = maxUsagePerUser;

    const offer = await Offer.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    res.json({ success: true, offer });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Offer title already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete offer
// @route   DELETE /api/admin/offers/:id
export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle offer status
// @route   PATCH /api/admin/offers/:id/status
export const toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    offer.isActive = !offer.isActive;
    await offer.save();
    res.json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};