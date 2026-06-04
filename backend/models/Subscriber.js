import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    source: { type: String, enum: ['website', 'homepage', 'footer', 'manual', 'import', 'popup'], default: 'website' },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

subscriberSchema.index({ isActive: 1 });

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export default Subscriber;