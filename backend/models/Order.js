import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  variant: { color: String, size: String },
  sku: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'India' },
      landmark: String,
    },
    paymentMethod: { type: String, enum: ['cashfree', 'cod', 'wallet', 'razorpay'], default: 'cashfree' },
    // Enhanced payment result with more fields
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
      gateway: { type: String, default: '' },
      transactionId: String,
      refundStatus: { type: String, enum: ['none', 'processing', 'refunded', 'failed'], default: 'none' },
      refundedAt: Date,
    },
    // Separate payment status from order status
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    discountPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    offerApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
    couponCode: { type: String, default: '' },
    offerName: { type: String, default: '' },
    cashbackAmount: { type: Number, default: 0 },
    shipmentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', default: null },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    deliveryEstimate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'],
      default: 'pending',
      index: true,
    },
    trackingStatus: {
      type: String,
      enum: [
        'payment_pending',
        'payment_verified',
        'order_confirmed',
        'processing',
        'packed',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'payment_pending',
    },
    timeline: [
      {
        status: String,
        description: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // Cancellation fields
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    // Return fields
    returnRequested: { type: Boolean, default: false },
    returnApproved: { type: Boolean, default: false },
    returnRequestedAt: { type: Date },
    returnReason: { type: String },
    returnStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'picked_up', 'returned', 'refunded', 'rejected'],
      default: 'none',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1, status: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
