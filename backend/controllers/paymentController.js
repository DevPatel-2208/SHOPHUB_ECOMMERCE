import { createCashfreeOrder, fetchCashfreeOrder, verifyCashfreePayment, CASHFREE_CHECKOUT_BASE_URL, sanitizePaymentSessionId } from '../config/cashfree.js';
import Order from '../models/Order.js';
import { updatePaymentStatus } from './orderController.js';
import crypto from 'crypto';

// @desc    Create payment order
// @route   POST /api/payments/create
export const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user', 'email phone name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.isPaid) return res.status(400).json({ success: false, message: 'Order already paid' });

    // Cashfree requires customer_name — this is CRITICAL for valid payment session creation.
    const customerName = order.shippingAddress?.fullName || order.user.name || 'Customer';

    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
   const returnUrl =
  `${serverUrl}/api/payments/callback?order_id={order_id}`;

    let cashfreeOrder;

    // Try to create a new order; if the order_id already exists in Cashfree (e.g. retry scenario),
    // fetch the existing order instead so the user can re-use the same payment session.
    try {
      cashfreeOrder = await createCashfreeOrder({
        orderId: order._id.toString(),
        orderAmount: order.totalPrice,
        customerId: order.user._id.toString(),
        customerName,
        customerEmail: order.user.email,
        customerPhone: order.shippingAddress.phone || '9999999999',
        returnUrl,
      });
    } catch (createErr) {
      const errData = createErr?.response?.data || {};
      if (errData.type === 'invalid_request_error' && errData.message?.includes('already exists')) {
        console.log('Order already exists in Cashfree, fetching existing order for retry...');
        cashfreeOrder = await fetchCashfreeOrder(order._id.toString());
      } else {
        throw createErr;
      }
    }

    const paymentSessionId = sanitizePaymentSessionId(cashfreeOrder.payment_session_id);

    if (!paymentSessionId) {
      console.error('Payment creation failed: invalid payment_session_id received from Cashfree', {
        raw: cashfreeOrder.payment_session_id,
        cf_order_id: cashfreeOrder.cf_order_id,
        order_id: cashfreeOrder.order_id,
      });
      return res.status(500).json({
        success: false,
        message: 'Invalid payment session received from payment gateway. Please try again.',
      });
    }

    const checkoutUrl = `${CASHFREE_CHECKOUT_BASE_URL}${paymentSessionId}`;

    res.json({
      success: true,
      paymentData: {
        orderId: order._id,
        payment_session_id: paymentSessionId,
        checkout_url: checkoutUrl,
        order_amount: order.totalPrice,
        order_currency: 'INR',
      },
    });
  } catch (error) {
    console.error('Payment creation error:', error?.response?.data || error.message || error);
    res.status(500).json({ success: false, message: error.message || 'Failed to initiate payment' });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
export const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const paymentData = await verifyCashfreePayment(orderId);

    if (paymentData.order_status === 'PAID') {
      // Use the centralized updatePaymentStatus function
      const order = await updatePaymentStatus(orderId, 'paid', {
        transactionId: paymentData.cf_order_id,
        gateway: 'Cashfree',
        id: paymentData.cf_order_id,
      });

      if (!order) {
        return res.status(500).json({ success: false, message: 'Failed to update order' });
      }

      res.json({ success: true, order, message: 'Payment verified successfully' });
    } else if (paymentData.order_status === 'PENDING') {
      res.json({ success: true, message: 'Payment is pending', status: 'PENDING', paymentData });
    } else {
      // Mark payment as failed
      await updatePaymentStatus(orderId, 'failed');
      res.status(400).json({ success: false, message: 'Payment failed', status: paymentData.order_status });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to verify payment' });
  }
};

// @desc    Cashfree webhook
// @route   POST /api/payments/webhook
export const paymentWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;

    if (!rawBody || (typeof rawBody === 'object' && Object.keys(rawBody).length === 0)) {
      return res.status(400).send('Missing raw body');
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('base64');

    if (signature !== expectedSignature) {
      console.error('Webhook signature mismatch');
      return res.status(400).send('Invalid signature');
    }

    const data = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const { order, payment } = data;

    if (payment && payment.payment_status === 'SUCCESS') {
      // Use centralized function for consistency
      await updatePaymentStatus(order.order_id, 'paid', {
        transactionId: payment.cf_payment_id || payment.payment_id,
        gateway: 'Cashfree',
        id: payment.cf_payment_id || payment.payment_id,
      });
    } else if (payment && payment.payment_status === 'FAILED') {
      await updatePaymentStatus(order.order_id, 'failed');
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
};

// @desc    Cashfree payment callback handler
// @route   POST /api/payments/callback
export const paymentCallback = async (req, res) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?error=missing_order_id`);
    }

    // Verify payment status with Cashfree
    const paymentData = await verifyCashfreePayment(order_id);

    if (paymentData.order_status === 'PAID') {
      // Use centralized function
      await updatePaymentStatus(order_id, 'paid', {
        transactionId: paymentData.cf_order_id,
        gateway: 'Cashfree',
        id: paymentData.cf_order_id,
      });
      return res.redirect(`${process.env.CLIENT_URL}/payment/success?order_id=${order_id}`);
    } else if (paymentData.order_status === 'PENDING') {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?order_id=${order_id}&status=PENDING`);
    } else {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure?order_id=${order_id}&status=${paymentData.order_status}`);
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    return res.redirect(`${process.env.CLIENT_URL}/payment/failure?error=${error.message}`);
  }
};
