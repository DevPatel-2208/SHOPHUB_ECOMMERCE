import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['new_order', 'payment_success', 'order_cancelled', 'low_stock', 'refund', 'new_customer', 'system'],
      default: 'system',
      index: true,
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customerName: { type: String },
    customerEmail: { type: String },
    amount: { type: Number },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient queries
adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);
export default AdminNotification;