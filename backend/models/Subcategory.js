import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subcategorySchema.pre('save', function (next) {
  if (!this.slug) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  next();
});

const Subcategory = mongoose.model('Subcategory', subcategorySchema);
export default Subcategory;
