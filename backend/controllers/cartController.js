import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { findBestOffer, getActiveOffers, enrichCartWithPricing } from '../utils/pricing.js';

const POPULATE_OPTS = 'name images price stock category brand comparePrice';

// @desc    Get cart with offer calculations
// @route   GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', POPULATE_OPTS)
      .populate('coupon', 'code discountType discountValue maxDiscount');

    if (!cart) return res.json({
      success: true,
      cart: { items: [], totalAmount: 0, discountAmount: 0, offerDiscount: 0, finalAmount: 0 },
    });

    const enriched = await enrichCartWithPricing(cart);
    res.json({ success: true, cart: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add to cart with offer computation
// @route   POST /api/cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });
    if (product.outOfStock) return res.status(400).json({ success: false, message: 'Product is out of stock' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    // Fetch active offers to compute offer for this item
    const activeOffers = await getActiveOffers();
    const offer = findBestOffer(product, activeOffers);

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + quantity;
      if (product.stock < newQty) return res.status(400).json({ success: false, message: 'Insufficient stock' });
      cart.items[itemIndex].quantity = newQty;
      cart.items[itemIndex].price = product.price;
      cart.items[itemIndex].totalPrice = newQty * product.price;
      cart.items[itemIndex].offer = offer || undefined;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        totalPrice: quantity * product.price,
        variant,
        offer: offer || undefined,
      });
    }

    await cart.save();
    await cart.populate('items.product', POPULATE_OPTS);
    const enriched = await enrichCartWithPricing(cart);
    res.json({ success: true, cart: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const product = await Product.findById(item.product);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    item.quantity = quantity;
    item.price = product.price;
    item.totalPrice = quantity * product.price;

    // Re-compute offer since price may have changed
    const activeOffers = await getActiveOffers();
    const offer = findBestOffer(product, activeOffers);
    item.offer = offer || undefined;

    if (quantity <= 0) cart.items.pull(req.params.itemId);

    await cart.save();
    await cart.populate('items.product', POPULATE_OPTS);
    const enriched = await enrichCartWithPricing(cart);
    res.json({ success: true, cart: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove from cart
// @route   DELETE /api/cart/:itemId
export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items.pull(req.params.itemId);
    await cart.save();
    await cart.populate('items.product', POPULATE_OPTS);
    const enriched = await enrichCartWithPricing(cart);
    res.json({ success: true, cart: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], coupon: null, discountAmount: 0, offerDiscount: 0 }
    );
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply coupon
// @route   POST /api/cart/apply-coupon
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (coupon.expiryDate < new Date()) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    if (cart.totalAmount < coupon.minOrderValue) return res.status(400).json({ success: false, message: `Minimum order value ₹${coupon.minOrderValue} required` });

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cart.totalAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }

    cart.coupon = coupon._id;
    cart.discountAmount = Math.round(discount);
    await cart.save();
    await cart.populate('items.product', POPULATE_OPTS);
    await cart.populate('coupon', 'code discountType discountValue');

    const enriched = await enrichCartWithPricing(cart);
    res.json({ success: true, cart: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove coupon
// @route   DELETE /api/cart/coupon
export const removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { coupon: null, discountAmount: 0 },
      { new: true }
    ).populate('items.product', POPULATE_OPTS);
    const enriched = await enrichCartWithPricing(cart);
    res.json({ success: true, cart: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
