import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  variant: { color: String, size: String },
  offer: {
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
    title: { type: String },
    description: { type: String },
    discountType: { type: String, enum: ['percentage', 'fixed', 'flat'] },
    discountValue: { type: Number },
    maxDiscount: { type: Number, default: null },
    minOrderAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountedPrice: { type: Number },
    endDate: { type: Date },
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [cartItemSchema],
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    discountAmount: { type: Number, default: 0 },
    offerDiscount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const offerDisc = this.items.reduce((sum, item) => sum + ((item.offer?.discountAmount) || 0), 0);
  this.offerDiscount = Math.round(offerDisc * 100) / 100;
  this.finalAmount = Math.max(0, Math.round((this.totalAmount - this.offerDiscount - (this.discountAmount || 0)) * 100) / 100);
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
