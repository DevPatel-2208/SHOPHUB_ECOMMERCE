import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Address from '../models/Address.js';
import UserActivity from '../models/UserActivity.js';
import SecurityLog from '../models/SecurityLog.js';
import LoginActivity from '../models/LoginActivity.js';
import UserSession from '../models/UserSession.js';
import { sendEmail } from '../config/email.js';
import { logUserActivity, logSecurityEvent } from '../utils/activityLogger.js';

// @desc    Get profile with stats
// @route   GET /api/users/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire')
      .populate('addresses')
      .lean({ virtuals: true });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get dynamic stats
    const [totalOrders, completedOrders, cartItems, wishlistItems, savedAddresses, totalSpending] =
      await Promise.all([
        Order.countDocuments({ user: req.user.id }),
        Order.countDocuments({ user: req.user.id, status: 'delivered' }),
        Cart.findOne({ user: req.user.id }).then(cart => cart?.items?.length || 0),
        Wishlist.findOne({ user: req.user.id }).then(w => w?.products?.length || 0),
        Address.countDocuments({ user: req.user.id, isActive: true }),
        Order.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(req.user.id), paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]).then(result => (result[0]?.total || 0).toFixed(2)),
      ]);

    // Recent orders
    const recentOrders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderItems totalPrice status createdAt paymentStatus')
      .lean();

    res.json({
      success: true,
      user,
      stats: { totalOrders, completedOrders, cartItems, wishlistItems, savedAddresses, totalSpending },
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile (extended fields)
// @route   PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'phone', 'username', 'gender', 'dob',
      'address', 'city', 'state', 'country', 'pincode', 'avatar',
    ];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Check username uniqueness if changed
    if (updates.username) {
      const existing = await User.findOne({ username: updates.username, _id: { $ne: req.user.id } });
      if (existing) return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
      select: '-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire',
    });

    logUserActivity({ userId: user._id, type: 'profile_updated', description: 'Profile details updated', req });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    user.lastPasswordChanged = new Date();
    await user.save();

    logSecurityEvent({ userId: user._id, event: 'password_changed', description: 'Password changed successfully', severity: 'info', req });
    logUserActivity({ userId: user._id, type: 'password_changed', description: 'Password was changed', req });

    await sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully',
      html: `<div style="font-family:Arial;padding:20px;"><h2 style="color:#10B981;">Password Changed</h2><p>Your password was changed successfully. If you didn't do this, contact support immediately.</p></div>`,
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload avatar
// @route   POST /api/users/upload-avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    // req.file.path is already normalized by uploadSingle middleware to "/uploads/ecommerce/..."
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: req.file.path },
      { new: true, select: '-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire' }
    );

    res.json({ success: true, user, imageUrl: req.file.path });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove avatar
// @route   DELETE /api/users/avatar
export const removeAvatar = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: '' },
      { new: true, select: '-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire' }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user activity feed
// @route   GET /api/users/activities
export const getUserActivities = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const activities = await UserActivity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    const count = await UserActivity.countDocuments({ user: req.user.id });
    res.json({ success: true, activities, total: count, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user security logs
// @route   GET /api/users/security-logs
export const getUserSecurityLogs = async (req, res) => {
  try {
    const logs = await SecurityLog.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const count = await SecurityLog.countDocuments({ user: req.user.id });
    res.json({ success: true, logs, total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get login history
// @route   GET /api/users/login-history
export const getLoginHistory = async (req, res) => {
  try {
    const history = await LoginActivity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active sessions
// @route   GET /api/users/sessions
export const getUserSessions = async (req, res) => {
  try {
    const sessions = await UserSession.find({ user: req.user.id, isActive: true, expiredAt: { $gt: new Date() } })
      .sort({ lastActivity: -1 })
      .lean();
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Terminate a session
// @route   DELETE /api/users/sessions/:sessionId
export const terminateSession = async (req, res) => {
  try {
    await UserSession.findOneAndUpdate(
      { user: req.user.id, sessionId: req.params.sessionId },
      { isActive: false }
    );
    res.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get full user dashboard (profile + stats + recent data)
// @route   GET /api/users/dashboard
export const getUserDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire')
      .populate('addresses')
      .lean({ virtuals: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const safe = (promise, fallback) => promise.catch(() => fallback);

    const [totalOrders, completedOrders, cartCount, wishlistCount, addressCount, totalSpending,
      recentOrders, recentActivities, recentLogins,
    ] = await Promise.all([
      safe(Order.countDocuments({ user: req.user.id }), 0),
      safe(Order.countDocuments({ user: req.user.id, status: 'delivered' }), 0),
      safe(Cart.findOne({ user: req.user.id }).then(c => c?.items?.length || 0), 0),
      safe(Wishlist.findOne({ user: req.user.id }).then(w => w?.products?.length || 0), 0),
      safe(Address.countDocuments({ user: req.user.id, isActive: true }), 0),
      safe(
        Order.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(req.user.id), paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]).then(r => (r[0]?.total || 0).toFixed(2)),
        '0.00'
      ),
      safe(
        Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(5)
          .select('orderItems totalPrice status createdAt paymentMethod').lean(),
        []
      ),
      safe(UserActivity.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10).lean(), []),
      safe(LoginActivity.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(5).lean(), []),
    ]);

    const sessions = await safe(UserSession.find({ user: req.user.id, isActive: true, expiredAt: { $gt: new Date() } }).lean(), []);
    const securityLogs = await safe(SecurityLog.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(5).lean(), []);

    res.json({
      success: true,
      user,
      stats: { totalOrders, completedOrders, cartItems: cartCount, wishlistItems: wishlistCount, savedAddresses: addressCount, totalSpending },
      recentOrders,
      activities: recentActivities,
      logins: recentLogins,
      sessions,
      securityLogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/users
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({ success: true, users, totalPages: Math.ceil(count / limit), currentPage: page, total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status (Admin)
// @route   PATCH /api/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
