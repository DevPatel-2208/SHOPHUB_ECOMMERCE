import mongoose from 'mongoose';

const productAttributeSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: [true, 'Product is required'], index: true },
    attribute: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute', required: [true, 'Attribute is required'], index: true },
    value: { type: String, required: [true, 'Attribute value is required'], trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productAttributeSchema.index({ product: 1, attribute: 1 }, { unique: true });

const ProductAttribute = mongoose.model('ProductAttribute', productAttributeSchema);
export default ProductAttribute;