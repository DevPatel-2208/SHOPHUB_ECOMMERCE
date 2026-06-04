import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'order_placed', 'order_cancelled', 'order_delivered', 'order_returned',
      'wishlist_added', 'wishlist_removed',
      'cart_updated', 'cart_cleared',
      'profile_updated', 'avatar_changed', 'password_changed',
      'address_added', 'address_updated', 'address_deleted',
      'review_submitted', 'review_updated',
      'coupon_applied', 'login', 'logout',
    ],
    required: true,
  },
  description: { type: String, default: '' },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  referenceModel: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ user: 1, type: 1 });
userActivitySchema.index({ createdAt: -1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
export default UserActivity;