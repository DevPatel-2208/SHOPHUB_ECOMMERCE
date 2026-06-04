import mongoose from 'mongoose';

const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Attribute name is required'], trim: true, maxlength: [100, 'Attribute name cannot exceed 100 chars'] },
    slug: { type: String, unique: true, sparse: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'], index: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', index: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', index: true },
    type: { type: String, enum: ['text', 'number', 'color', 'size', 'select', 'boolean'], default: 'text' },
    values: [{ type: String, trim: true }],
    unit: { type: String, trim: true, default: '' },
    isFilterable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attributeSchema.index({ category: 1, subcategory: 1, brand: 1 });
attributeSchema.index({ name: 'text' });

attributeSchema.pre('save', function (next) {
  if (!this.slug) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  next();
});

const Attribute = mongoose.model('Attribute', attributeSchema);
export default Attribute;