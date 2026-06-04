import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: null },
    minOrderValue: { type: Number, default: 0 },
    maxUses: { type: Number, default: null },
    usesCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    excludedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

couponSchema.index({ isActive: 1, expiryDate: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
