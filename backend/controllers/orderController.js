import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Shipment from '../models/Shipment.js';
import Notification from '../models/Notification.js';
import AdminNotification from '../models/AdminNotification.js';
import User from '../models/User.js';
import { sendEmail } from '../config/email.js';
import { generateInvoicePDF } from '../utils/generateInvoice.js';
import { emitAdminNotification, emitNewOrderToAdmins, emitUserNotification, emitAdminPaymentSuccess, getIO } from '../sockets/socketHandler.js';
import { computeOrderPricing } from '../utils/pricing.js';

// @desc    Create order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = 'cashfree', couponCode, cashbackAmount } = req.body;

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });

    // Validate that all products still exist and have sufficient stock
    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({ success: false, message: 'A product in your cart is no longer available. Please refresh your cart.' });
      }
      const product = await Product.findById(item.product._id).select('name stock outOfStock price');
      if (!product) {
        return res.status(400).json({ success: false, message: `${item.product.name} is no longer available` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `${product.name} is out of stock. Only ${product.stock} left.` });
      }
      if (product.price !== item.price) {
        return res.status(400).json({
          success: false,
          message: `Price for ${product.name} has changed from ₹${item.price} to ₹${product.price}. Please review your cart.`,
        });
      }
    }

    // Deduct stock
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      const newStock = product.stock - item.quantity;
      await Product.findByIdAndUpdate(product._id, {
        $set: { stock: newStock, outOfStock: newStock <= 0 }
      });
    }

    // Re-compute all pricing from backend (security: never trust frontend prices)
    const pricing = await computeOrderPricing(cart);

    // Build timeline
    const timeline = [];
    const deliveryEstimate = new Date();
    deliveryEstimate.setDate(deliveryEstimate.getDate() + 7);

    if (paymentMethod === 'cod') {
      timeline.push({ status: 'order_confirmed', description: 'Order confirmed successfully', timestamp: new Date() });
      timeline.push({ status: 'payment_pending', description: 'Payment will be collected on delivery (COD)', timestamp: new Date() });
    } else {
      timeline.push({ status: 'payment_pending', description: 'Waiting for payment confirmation...', timestamp: new Date() });
    }

    const totalDiscount = pricing.offerDiscount + pricing.couponDiscount;

    const order = await Order.create({
      user: req.user.id,
      orderItems: pricing.orderItems,
      shippingAddress: {
        ...shippingAddress,
        landmark: shippingAddress.landmark || '',
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      trackingStatus: paymentMethod === 'cod' ? 'order_confirmed' : 'payment_pending',
      itemsPrice: pricing.itemsPrice,
      shippingPrice: pricing.shippingPrice,
      taxPrice: pricing.taxPrice,
      discountPrice: totalDiscount,
      totalPrice: pricing.totalPrice,
      couponApplied: cart.coupon || null,
      couponCode: couponCode || '',
      offerName: pricing.appliedOfferName,
      offerApplied: pricing.appliedOfferId,
      cashbackAmount: cashbackAmount || 0,
      timeline,
      deliveryEstimate,
      status: paymentMethod === 'cod' ? 'processing' : 'pending',
    });

    // Create shipment placeholder
    const shipment = await Shipment.create({ order: order._id, status: 'pending' });
    order.shipmentRef = shipment._id;
    await order.save();

    // Clear cart
    await Cart.findOneAndDelete({ user: req.user.id });

    // User notification
    const orderNumber = order._id.toString().slice(-6).toUpperCase();
    const userNotif = await Notification.create({
      user: req.user.id,
      title: paymentMethod === 'cod' ? 'Order Confirmed' : 'Order Placed',
      message: paymentMethod === 'cod'
        ? `Your order #${orderNumber} has been confirmed successfully`
        : `Your order #${orderNumber} is awaiting payment confirmation`,
      type: 'order',
      link: `/orders/${order._id}`,
    });

    // Emit real-time notification to user
    try {
      emitUserNotification(req.app.get('io'), req.user.id, userNotif);
    } catch (emitErr) {
      console.warn('User notification socket emit failed:', emitErr.message);
    }

    // Admin notification
    try {
      const io = req.app.get('io');
      const user = req.user;

      const customerName = user?.name || 'Guest';
      const totalAmount = order.totalPrice || 0;

      const adminNotification = await AdminNotification.create({
        title: 'New Order Received',
        message: `Order #${orderNumber} from ${customerName}`,
        type: 'new_order',
        orderId: order._id,
        customerName,
        customerEmail: user?.email || '',
        amount: totalAmount,
        link: `/orders/${order._id}`,
        metadata: {
          itemsCount: order.orderItems.length,
          paymentMethod: order.paymentMethod,
          shippingAddress: shippingAddress?.fullName || '',
        },
      });

      emitAdminNotification(io, adminNotification);
      emitNewOrderToAdmins(io, order, user);
    } catch (socketErr) {
      console.warn('Admin notification failed:', socketErr.message);
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Order creation error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid data format', errors: [error.message] });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user.id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('shipmentRef', 'awb status')
      .populate('couponApplied', 'code discountValue discountType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);
    res.json({ success: true, orders, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order (with full details)
// @route   GET /api/orders/:id
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
      .populate('orderItems.product', 'name images slug price brand category')
      .populate('shipmentRef')
      .populate('couponApplied', 'code discountValue discountType description')
      .populate('user', 'name email phone');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Track order
// @route   GET /api/orders/:id/track
export const trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
      .populate('shipmentRef');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, tracking: order.shipmentRef, timeline: order.timeline, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download invoice
// @route   GET /api/orders/:id/invoice
export const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
      .populate('user', 'name email phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const pdfBuffer = await generateInvoicePDF(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order (Admin)
// @route   GET /api/orders/admin/:id
export const getAdminOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name images slug price sku')
      .populate('shipmentRef')
      .populate('couponApplied', 'code discountValue discountType');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      { _id: { $regex: search, $options: 'i' } },
    ];

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('shipmentRef', 'awb status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);
    res.json({ success: true, orders, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingStatus, description } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (status) order.status = status;
    if (trackingStatus) {
      order.trackingStatus = trackingStatus;
      const descMap = {
        payment_verified: 'Payment verified successfully',
        order_confirmed: 'Your order has been confirmed',
        processing: 'Order is being processed',
        packed: 'Order has been packed',
        shipped: 'Order has been shipped',
        out_for_delivery: 'Order is out for delivery',
        delivered: 'Order has been delivered',
      };
      order.timeline.push({
        status: trackingStatus,
        description: description || descMap[trackingStatus] || `Status updated to ${trackingStatus}`,
        timestamp: new Date()
      });
    }
    if (status === 'delivered' || trackingStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    // If status is processing and not yet confirmed, add confirmed entry
    if (trackingStatus === 'processing' && !order.timeline.find(t => t.status === 'order_confirmed')) {
      order.timeline.unshift({
        status: 'order_confirmed',
        description: 'Your order has been confirmed',
        timestamp: new Date(),
      });
    }

    await order.save();

    // Notify user
    const statusNotif = await Notification.create({
      user: order.user,
      title: 'Order Update',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${trackingStatus || status}`,
      type: 'order',
      link: `/orders/${order._id}`,
    });

    // Emit real-time notification to user
    try {
      emitUserNotification(req.app.get('io'), order.user, statusNotif);
    } catch (emitErr) {
      console.warn('Status update socket emit failed:', emitErr.message);
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel order (User)
// @route   POST /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Can only cancel pending/processing orders
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    // Restore stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
        $set: { outOfStock: false }
      });
    }

    order.status = 'cancelled';
    order.trackingStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason || 'Cancelled by customer';
    order.timeline.push({
      status: 'cancelled',
      description: 'Order cancelled',
      timestamp: new Date(),
    });

    // If payment was already done, mark for refund
    if (order.isPaid) {
      order.paymentStatus = 'refunded';
      order.paymentResult.refundStatus = 'processing';
    }

    await order.save();

    // Notify user
    const cancelNotif = await Notification.create({
      user: order.user,
      title: 'Order Cancelled',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled`,
      type: 'order',
      link: `/orders/${order._id}`,
    });

    try {
      const io = req.app.get('io');
      emitUserNotification(io, order.user, cancelNotif);
    } catch (emitErr) {
      console.warn('Cancel notification socket emit failed:', emitErr.message);
    }

    // Notify admin
    try {
      const io = req.app.get('io');
      const adminCancelledNotif = await AdminNotification.create({
        title: 'Order Cancelled',
        message: `Order #${order._id.toString().slice(-6).toUpperCase()} was cancelled by customer`,
        type: 'order_cancelled',
        orderId: order._id,
        customerName: req.user?.name || 'Customer',
        customerEmail: req.user?.email || '',
        amount: order.totalPrice,
        link: `/orders/${order._id}`,
        metadata: { reason: reason || 'No reason provided' },
      });
      emitAdminNotification(io, adminCancelledNotif);
    } catch (socketErr) {
      console.warn('Admin cancel notification failed:', socketErr.message);
    }

    res.json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request return (User)
// @route   POST /api/orders/:id/return
export const requestReturn = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
    }

    order.returnRequested = true;
    order.returnStatus = 'requested';
    order.returnRequestedAt = new Date();
    order.returnReason = reason || 'Return requested by customer';
    order.timeline.push({
      status: 'return_requested',
      description: 'Return requested by customer',
      timestamp: new Date(),
    });

    await order.save();

    const returnNotif = await Notification.create({
      user: order.user,
      title: 'Return Requested',
      message: `Return request for order #${order._id.toString().slice(-6).toUpperCase()} has been submitted`,
      type: 'order',
      link: `/orders/${order._id}`,
    });

    try {
      const io = req.app.get('io');
      emitUserNotification(io, order.user, returnNotif);
    } catch (emitErr) {
      console.warn('Return notification socket emit failed:', emitErr.message);
    }

    // Notify admin
    try {
      const io = req.app.get('io');
      const adminReturnNotif = await AdminNotification.create({
        title: 'Return Requested',
        message: `Return requested for order #${order._id.toString().slice(-6).toUpperCase()}`,
        type: 'system',
        orderId: order._id,
        customerName: req.user?.name || 'Customer',
        customerEmail: req.user?.email || '',
        amount: order.totalPrice,
        link: `/orders/${order._id}`,
        metadata: { reason: reason || 'No reason provided' },
      });
      emitAdminNotification(io, adminReturnNotif);
    } catch (socketErr) {
      console.warn('Admin return notification failed:', socketErr.message);
    }

    res.json({ success: true, message: 'Return request submitted successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payment status (Internal use by payment controller)
// @route   PATCH /api/orders/:id/payment-status
export const updatePaymentStatus = async (orderId, status, paymentData = {}) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return null;

    order.isPaid = status === 'paid';
    order.paymentStatus = status;

    if (status === 'paid') {
      order.paidAt = new Date();
      order.status = 'processing';
      order.trackingStatus = 'order_confirmed';

      // Add timeline events
      order.timeline.push({
        status: 'payment_verified',
        description: 'Payment verified successfully',
        timestamp: new Date(),
      });
      order.timeline.push({
        status: 'order_confirmed',
        description: 'Your order has been confirmed',
        timestamp: new Date(),
      });

      if (paymentData.transactionId) {
        order.paymentResult.transactionId = paymentData.transactionId;
      }
      if (paymentData.gateway) {
        order.paymentResult.gateway = paymentData.gateway;
      }
      if (paymentData.id) {
        order.paymentResult.id = paymentData.id;
      }
      order.paymentResult.status = 'PAID';
      order.paymentResult.update_time = new Date().toISOString();
    } else if (status === 'failed') {
      order.timeline.push({
        status: 'payment_failed',
        description: 'Payment failed. Please try again.',
        timestamp: new Date(),
      });
    }

    await order.save();

    // Notify user
    if (status === 'paid') {
      const payNotif = await Notification.create({
        user: order.user,
        title: 'Payment Successful',
        message: `Payment for order #${order._id.toString().slice(-6).toUpperCase()} has been verified successfully`,
        type: 'order',
        link: `/orders/${order._id}`,
      });

      try {
        const io = getIO();
        emitUserNotification(io, order.user, payNotif);
      } catch (emitErr) {
        console.warn('Payment notification socket emit failed:', emitErr.message);
      }

      // Admin payment success notification
      try {
        const io = getIO();
        const adminPayNotif = await AdminNotification.create({
          title: 'Payment Received',
          message: `Payment of ₹${order.totalPrice} received for order #${order._id.toString().slice(-6).toUpperCase()}`,
          type: 'payment_success',
          orderId: order._id,
          amount: order.totalPrice,
          link: `/orders/${order._id}`,
        });
        emitAdminNotification(io, adminPayNotif);
        emitAdminPaymentSuccess(io, order, { name: '', email: '' });
      } catch (emitErr) {
        console.warn('Admin payment notification failed:', emitErr.message);
      }
    }

    return order;
  } catch (error) {
    console.error('Update payment status error:', error);
    return null;
  }
};
