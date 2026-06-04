import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    image: { type: String, required: true },
    mobileImage: { type: String },
    link: { type: String, default: '/products' },
    ctaText: { type: String, default: 'Shop Now' },
    gradient: { type: String, default: 'from-purple-600 to-blue-600' },
    badge: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, order: 1 });

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;