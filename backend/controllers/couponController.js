import Coupon from '../models/Coupon.js';

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons/admin
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create coupon (Admin)
// @route   POST /api/coupons
export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/:id
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
export const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Coupon deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate coupon (Public)
// @route   POST /api/coupons/validate
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon' });
    if (coupon.expiryDate < new Date()) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) return res.status(400).json({ success: false, message: 'Usage limit reached' });
    if (orderValue < coupon.minOrderValue) return res.status(400).json({ success: false, message: `Min order ₹${coupon.minOrderValue}` });

    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
