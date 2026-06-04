import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Offer title is required'], trim: true, maxlength: [200, 'Title cannot exceed 200 chars'] },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, trim: true, maxlength: [1000, 'Description cannot exceed 1000 chars'] },
    banner: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed', 'flat'], default: 'percentage', required: true },
    discountValue: { type: Number, required: [true, 'Discount value is required'], min: [0, 'Discount value must be positive'] },
    maxDiscount: { type: Number, default: null },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    priority: { type: Number, default: 0 },
    // Apply on
    applyOn: { type: String, enum: ['all', 'category', 'brand', 'product'], default: 'all', required: true },
    applicableItems: [{ type: mongoose.Schema.Types.ObjectId, refPath: 'applyOnModel' }],
    applyOnModel: { type: String, enum: ['Category', 'Brand', 'Product'], default: null },
    // Exclusions
    excludeCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    excludeBrands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
    excludeProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    // Validity
    startDate: { type: Date, required: [true, 'Start date is required'], default: Date.now },
    endDate: { type: Date, required: [true, 'End date is required'] },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    maxUsage: { type: Number, default: null },
    maxUsagePerUser: { type: Number, default: 1 },
  },
  { timestamps: true }
);

offerSchema.index({ startDate: 1, endDate: 1 });
offerSchema.index({ isActive: 1, applyOn: 1 });
offerSchema.index({ title: 'text' });

offerSchema.pre('save', function (next) {
  if (!this.slug) this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    const err = this.invalidate('discountValue', 'Percentage discount cannot exceed 100', this.discountValue);
    return next(err);
  }
  next();
});

offerSchema.virtual('status').get(function () {
  const now = new Date();
  if (!this.isActive) return 'inactive';
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'expired';
  return 'active';
});

offerSchema.set('toJSON', { virtuals: true });
offerSchema.set('toObject', { virtuals: true });

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;