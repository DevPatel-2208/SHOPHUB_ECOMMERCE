import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Brand name is required'], unique: true, trim: true, maxlength: [100, 'Brand name cannot exceed 100 chars'] },
    slug: { type: String, unique: true, sparse: true },
    logo: { type: String, default: '' },
    description: { type: String, trim: true, maxlength: [500, 'Description cannot exceed 500 chars'] },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', required: [true, 'Subcategory is required'], index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

brandSchema.index({ name: 'text' });
brandSchema.index({ subcategory: 1, isActive: 1 });

brandSchema.pre('save', function (next) {
  if (!this.slug) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  next();
});

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;