import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import Offer from '../models/Offer.js';

// Helper: compute best offer for a product
const computeProductOffer = (product, activeOffers) => {
  const offer = activeOffers.find((o) => {
    if (o.excludeProducts?.some((id) => id.toString() === product._id.toString())) return false;
    if (o.excludeCategories?.some((id) => id.toString() === (product.category?._id || product.category)?.toString())) return false;
    if (o.excludeBrands?.some((id) => id.toString() === (product.brand?._id || product.brand)?.toString())) return false;
    if (o.applyOn === 'all') return true;
    if (o.applyOn === 'product') return o.applicableItems?.some((id) => id.toString() === product._id.toString());
    if (o.applyOn === 'category') return o.applicableItems?.some((id) => id.toString() === (product.category?._id || product.category)?.toString());
    if (o.applyOn === 'brand') return o.applicableItems?.some((id) => id.toString() === (product.brand?._id || product.brand)?.toString());
    return false;
  });
  if (!offer) return null;
  let discountAmount = 0;
  if (offer.discountType === 'percentage') {
    discountAmount = (product.price * offer.discountValue) / 100;
    if (offer.maxDiscount) discountAmount = Math.min(discountAmount, offer.maxDiscount);
  } else if (offer.discountType === 'flat' || offer.discountType === 'fixed') {
    discountAmount = offer.discountValue;
  }
  return {
    _id: offer._id,
    title: offer.title,
    discountType: offer.discountType,
    discountValue: offer.discountValue,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountedPrice: Math.round(Math.max(0, product.price - discountAmount) * 100) / 100,
  };
};

// @desc    Get wishlist with offers
// @route   GET /api/wishlist
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products', 'name price images stock outOfStock ratings slug category brand comparePrice');
    if (!wishlist) wishlist = { products: [] };

    // Attach offers to each product
    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ priority: -1, discountValue: -1 }).lean();

    const productsWithOffers = wishlist.products.map((prod) => {
      const p = prod.toObject ? prod.toObject() : { ...prod };
      const offer = computeProductOffer(p, activeOffers);
      if (offer) p.offer = offer;
      return p;
    });

    res.json({ success: true, wishlist: { ...wishlist.toObject(), products: productsWithOffers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add to wishlist
// @route   POST /api/wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) wishlist = new Wishlist({ user: req.user.id, products: [] });

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    await wishlist.populate('products', 'name price images stock ratings category brand comparePrice');
    // Attach offers
    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ priority: -1, discountValue: -1 }).lean();
    const productsWithOffers = wishlist.products.map((prod) => {
      const p = prod.toObject ? prod.toObject() : { ...prod };
      const offer = computeProductOffer(p, activeOffers);
      if (offer) p.offer = offer;
      return p;
    });
    res.json({ success: true, wishlist: { ...wishlist.toObject(), products: productsWithOffers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { products: req.params.productId } },
      { new: true }
    ).populate('products', 'name price images stock ratings category brand comparePrice');
    // Attach offers
    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ priority: -1, discountValue: -1 }).lean();
    const productsWithOffers = wishlist.products.map((prod) => {
      const p = prod.toObject ? prod.toObject() : { ...prod };
      const offer = computeProductOffer(p, activeOffers);
      if (offer) p.offer = offer;
      return p;
    });
    res.json({ success: true, wishlist: { ...wishlist.toObject(), products: productsWithOffers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
