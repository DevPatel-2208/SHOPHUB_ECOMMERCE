import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import Brand from '../models/Brand.js';
import Review from '../models/Review.js';
import Offer from '../models/Offer.js';
import Subscriber from '../models/Subscriber.js';

// @desc    Get comprehensive dashboard stats
// @route   GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today - 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // ===== Basic counts + previous period comparisons =====
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalCategories,
      totalBrands,
      totalSubscribers,
      totalRevenueArr,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      // Previous period for % change
      prevTotalRevenueArr,
      prevTotalOrders,
      prevTotalUsers,
      prevTotalProducts,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments(),
      Brand.countDocuments(),
      Subscriber.countDocuments({ isActive: true }),
      Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      // Previous month revenue
      Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      // Previous month orders
      Order.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
      // Previous month users
      User.countDocuments({ role: 'user', createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
      // Previous month products
      Product.countDocuments({ isActive: true, createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
    ]);

    const totalRevenue = totalRevenueArr[0]?.total || 0;
    const prevTotalRevenue = prevTotalRevenueArr[0]?.total || 0;

    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // ===== Recent orders =====
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email avatar');

    // ===== Monthly sales (last 12 months) — fill gaps =====
    const monthlyRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo }, isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          sales: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlyMap = {};
    monthlyRaw.forEach((d) => { monthlyMap[d._id] = d; });

    const monthlySalesData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const existing = monthlyMap[key];
      monthlySalesData.push({
        month: label,
        revenue: existing?.sales || 0,
        orders: existing?.orders || 0,
      });
    }

    // ===== Daily sales (last 30 days) — fill gaps =====
    const dailyRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyMap = {};
    dailyRaw.forEach((d) => { dailyMap[d._id] = d; });

    const salesData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = dailyMap[key];
      salesData.push({
        date: key,
        revenue: existing?.sales || 0,
        orders: existing?.orders || 0,
      });
    }

    // ===== Order status breakdown =====
    const orderStatusBreakdown = [
      { name: 'Pending', value: pendingOrders, color: '#F59E0B' },
      { name: 'Processing', value: processingOrders, color: '#3B82F6' },
      { name: 'Shipped', value: shippedOrders, color: '#8B5CF6' },
      { name: 'Delivered', value: deliveredOrders, color: '#10B981' },
      { name: 'Cancelled', value: cancelledOrders, color: '#EF4444' },
    ].filter((s) => s.value > 0);

    // ===== Top selling products =====
    const topSellingAgg = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);
    const topProductIds = topSellingAgg.map((p) => p._id);
    const topProducts = await Product.find({ _id: { $in: topProductIds } }).select('name images price');
    const topSelling = topSellingAgg.map((p) => {
      const product = topProducts.find((pr) => pr._id.toString() === p._id.toString());
      return {
        _id: p._id,
        name: product?.name || 'Unknown',
        image: product?.images?.[0] || '',
        price: product?.price || 0,
        totalSold: p.totalSold,
        revenue: p.revenue,
      };
    });

    // ===== Recent reviews =====
    const recentReviews = await Review.find()
      .populate('user', 'name avatar')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .limit(5);

    // ===== Latest customers =====
    const latestCustomers = await User.find({ role: 'user' })
      .select('name email avatar createdAt isActive')
      .sort({ createdAt: -1 })
      .limit(5);

    // ===== Low stock products (array with details) =====
    const lowStockCount = await Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    });
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .select('name images stock price lowStockThreshold slug')
      .sort({ stock: 1 })
      .limit(10);

    // ===== Active offers (array with details) =====
    // Use start/end of day so offers expiring today still count
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const activeOfferQuery = {
      isActive: true,
      startDate: { $lte: dayEnd },
      endDate: { $gte: dayStart },
    };

    const activeOfferCount = await Offer.countDocuments(activeOfferQuery);
    const activeOffers = await Offer.find(activeOfferQuery)
      .select('title discountType discountValue banner startDate endDate isActive')
      .sort({ priority: -1, createdAt: -1 })
      .limit(10)
      .lean();

    // Attach computed status so frontend can display reliably
    const now = new Date();
    const enrichedOffers = activeOffers.map((o) => ({
      ...o,
      status:
        now > new Date(o.endDate) ? 'expired'
        : now < new Date(o.startDate) ? 'upcoming'
        : 'active',
    }));

    // ===== Revenue by payment method =====
    const revenueByPaymentRaw = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
    ]);
    const paymentColorMap = {
      razorpay: '#4F46E5',
      cod: '#10B981',
      stripe: '#6366F1',
      paypal: '#2563EB',
      credit_card: '#8B5CF6',
      debit_card: '#EC4899',
      upi: '#14B8A6',
      net_banking: '#F59E0B',
      wallet: '#3B82F6',
    };
    const revenueByPayment = revenueByPaymentRaw.map((r) => ({
      method: r._id || 'Unknown',
      revenue: r.revenue,
      count: r.count,
      color: paymentColorMap[r._id?.toLowerCase()] || '#6B7280',
    }));

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalCategories,
        totalBrands,
        totalSubscribers,
        totalRevenue,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        lowStockCount,
        activeOfferCount,
        revenueChange: calcChange(totalRevenue, prevTotalRevenue),
        ordersChange: calcChange(totalOrders, prevTotalOrders),
        usersChange: calcChange(totalUsers, prevTotalUsers),
        productsChange: calcChange(totalProducts, prevTotalProducts),
      },
      recentOrders,
      monthlySalesData,
      salesData,
      orderStatusBreakdown,
      topSelling,
      recentReviews,
      latestCustomers,
      lowStockProducts,
      activeOffers: enrichedOffers,
      revenueByPayment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin products with full pagination, search, filter, sort
// @route   GET /api/admin/products
export const getAdminProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, subcategory, brand, status, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Product.countDocuments(query);
    res.json({ success: true, products, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle product status
// @route   PATCH /api/admin/products/:id/status
export const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.isActive = !product.isActive;
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product (hard delete)
// @route   DELETE /api/admin/products/:id
export const deleteAdminProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin orders with full pagination, search, filter
// @route   GET /api/admin/orders
export const getAdminOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, paymentMethod, isPaid, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (isPaid === 'true') query.isPaid = true;
    if (isPaid === 'false') query.isPaid = false;
    if (search) {
      query.$or = [
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const orders = await Order.find(query)
      .populate('user', 'name email avatar phone')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);
    res.json({ success: true, orders, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin order stats (counts by status + total revenue)
// @route   GET /api/admin/orders/stats
export const getAdminOrderStats = async (req, res) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single admin order detail
// @route   GET /api/admin/orders/:id
export const getAdminOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email avatar phone')
      .populate('orderItems.product', 'name images sku slug')
      .populate('shipmentRef', 'awb status provider trackingUrl')
      .populate('couponApplied', 'code discountValue discountType');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (supports granular tracking statuses)
// @route   PATCH /api/admin/orders/:id/status
export const updateAdminOrderStatus = async (req, res) => {
  try {
    const { status, trackingStatus, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'];
    const validTrackingStatuses = [
      'payment_pending', 'payment_verified', 'order_confirmed', 'processing',
      'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned',
    ];

    const trackingDescriptions = {
      payment_pending: 'Payment is pending confirmation',
      payment_verified: 'Payment has been verified successfully',
      order_confirmed: 'Order has been confirmed',
      processing: 'Order is being processed',
      packed: 'Order has been packed and ready for dispatch',
      shipped: 'Order has been shipped',
      out_for_delivery: 'Order is out for delivery',
      delivered: 'Order has been delivered successfully',
      cancelled: 'Order has been cancelled',
      returned: 'Order has been returned',
    };

    if (trackingStatus && validTrackingStatuses.includes(trackingStatus)) {
      order.trackingStatus = trackingStatus;
      order.timeline.push({
        status: trackingStatus,
        description: note || trackingDescriptions[trackingStatus] || `Status updated to ${trackingStatus}`,
        timestamp: new Date(),
      });
    }

    if (status && validStatuses.includes(status)) {
      order.status = status;
      if (!trackingStatus) {
        order.timeline.push({
          status,
          description: note || trackingDescriptions[status] || `Status updated to ${status}`,
          timestamp: new Date(),
        });
      }
    }

    if (status === 'delivered' || trackingStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }
    if (status === 'cancelled' || trackingStatus === 'cancelled') {
      order.cancelledAt = new Date();
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          product.outOfStock = product.stock <= 0;
          await product.save();
        }
      }
    }
    if (status === 'refunded') {
      order.paymentStatus = 'refunded';
      order.paymentResult.refundStatus = 'refunded';
      order.paymentResult.refundedAt = new Date();
    }

    await order.save();
    const populated = await Order.findById(order._id)
      .populate('user', 'name email avatar phone')
      .populate('orderItems.product', 'name images sku slug')
      .populate('shipmentRef', 'awb status provider trackingUrl')
      .populate('couponApplied', 'code discountValue discountType');
    res.json({ success: true, order: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin customer stats
// @route   GET /api/admin/customers/stats
export const getAdminCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const activeCustomers = await User.countDocuments({ role: 'user', isActive: true });
    const blockedCustomers = await User.countDocuments({ role: 'user', isActive: false });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newCustomersThisMonth = await User.countDocuments({ role: 'user', createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      success: true,
      stats: { totalCustomers, activeCustomers, blockedCustomers, newCustomersThisMonth },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin customers with pagination, search, filter
// @route   GET /api/admin/customers
export const getAdminCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sort = 'createdAt', order = 'desc' } = req.query;
    const query = { role: 'user' };

    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get order count for each user
    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id });
        const totalSpent = await Order.aggregate([
          { $match: { user: user._id, isPaid: true } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]);
        return {
          ...user.toObject(),
          orderCount,
          totalSpent: totalSpent[0]?.total || 0,
        };
      })
    );

    const count = await User.countDocuments(query);
    res.json({ success: true, customers: usersWithOrders, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single customer detail
// @route   GET /api/admin/customers/:id
export const getAdminCustomerDetail = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const recentOrders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(10);
    const totalSpent = await Order.aggregate([
      { $match: { user: customer._id, isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const orderCount = await Order.countDocuments({ user: customer._id });

    const customerData = {
      ...customer.toObject(),
      orderCount,
      totalSpent: totalSpent[0]?.total || 0,
      recentOrders,
    };

    res.json({
      success: true,
      customer: customerData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle customer status
// @route   PATCH /api/admin/customers/:id/status
export const toggleCustomerStatus = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    customer.isActive = !customer.isActive;
    await customer.save();
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete customer
// @route   DELETE /api/admin/customers/:id
export const deleteAdminCustomer = async (req, res) => {
  try {
    const customer = await User.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin reviews with pagination, search, filter
// @route   GET /api/admin/reviews
export const getAdminReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, rating, status, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (search) {
      query.$or = [{ comment: { $regex: search, $options: 'i' } }, { title: { $regex: search, $options: 'i' } }];
    }
    if (rating) query.rating = Number(rating);
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const reviews = await Review.find(query)
      .populate('user', 'name email avatar')
      .populate('product', 'name images')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments(query);
    res.json({ success: true, reviews, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete review (admin)
// @route   DELETE /api/admin/reviews/:id
export const deleteAdminReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    // Update product rating
    const reviews = await Review.find({ product: review.product, isActive: true });
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(review.product, { ratings: Math.round(avgRating * 10) / 10, numReviews: reviews.length });
    } else {
      await Product.findByIdAndUpdate(review.product, { ratings: 0, numReviews: 0 });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle review status
// @route   PATCH /api/admin/reviews/:id/status
export const toggleReviewStatus = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    review.isActive = !review.isActive;
    await review.save();
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to review (admin)
// @route   POST /api/admin/reviews/:id/reply
export const replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ success: false, message: 'Reply is required' });

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.adminReply = reply;
    review.adminReplyAt = new Date();
    await review.save();

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle category status
// @route   PATCH /api/admin/categories/:id/status
export const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    category.isActive = !category.isActive;
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Hard delete category
// @route   DELETE /api/admin/categories/:id
export const deleteAdminCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle subcategory status
// @route   PATCH /api/admin/subcategories/:id/status
export const toggleSubcategoryStatus = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) return res.status(404).json({ success: false, message: 'Subcategory not found' });
    subcategory.isActive = !subcategory.isActive;
    await subcategory.save();
    res.json({ success: true, subcategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Hard delete subcategory
// @route   DELETE /api/admin/subcategories/:id
export const deleteAdminSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
    if (!subcategory) return res.status(404).json({ success: false, message: 'Subcategory not found' });
    res.json({ success: true, message: 'Subcategory deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin categories with pagination, search, product counts
// @route   GET /api/admin/categories
export const getAdminCategoriesPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (search) query.name = { $regex: search, $options: 'i' };
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const categories = await Category.find(query).sort(sortObj).limit(limit * 1).skip((page - 1) * limit).lean();

    // Get product counts for each category
    const categoryIds = categories.map(c => c._id);
    const productCounts = await Product.aggregate([
      { $match: { category: { $in: categoryIds } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    productCounts.forEach(pc => { countMap[pc._id.toString()] = pc.count; });
    const categoriesWithCounts = categories.map(c => ({
      ...c,
      productCount: countMap[c._id.toString()] || 0,
    }));

    const count = await Category.countDocuments(query);
    res.json({
      success: true,
      categories: categoriesWithCounts,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin subcategories with pagination, search
// @route   GET /api/admin/subcategories
export const getAdminSubcategoriesPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const subcategories = await Subcategory.find(query).populate('category', 'name').sort(sortObj).limit(limit * 1).skip((page - 1) * limit);
    const count = await Subcategory.countDocuments(query);
    res.json({ success: true, subcategories, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
