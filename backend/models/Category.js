import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.pre('save', function (next) {
  if (!this.slug) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
