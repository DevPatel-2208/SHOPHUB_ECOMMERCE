import mongoose from 'mongoose';

const productSpecSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    specKey: { type: mongoose.Schema.Types.ObjectId, ref: 'SpecKey', required: true },
    value: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSpecSchema.index({ product: 1, specKey: 1 }, { unique: true });

const ProductSpec = mongoose.model('ProductSpec', productSpecSchema);
export default ProductSpec;
