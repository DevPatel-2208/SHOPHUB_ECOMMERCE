import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0, default: 0 },
    thumbnail: { type: String, default: '' },
    images: [{ type: String, required: true }],
    video: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', index: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', index: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    outOfStock: { type: Boolean, default: false },
    sku: { type: String, unique: true, sparse: true },
    weight: { type: Number, default: 0 },
    dimensions: { length: Number, width: Number, height: Number },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    ratings: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    specifications: [{ key: String, value: String }],
    tags: [{ type: String, index: true }],
    seoTitle: { type: String },
    seoDescription: { type: String },
    slug: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1, ratings: -1, createdAt: -1 });

productSchema.pre('save', function (next) {
  this.outOfStock = this.stock <= 0;
  if (!this.slug) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
