import Offer from '../models/Offer.js';

/**
 * Find the best applicable offer for a given product from a list of active offers.
 * Supports: all, product-specific, category-wise, brand-wise offers with exclusions.
 */
export const findBestOffer = (product, activeOffers) => {
  if (!activeOffers || !activeOffers.length || !product) return null;

  const productId = product._id?.toString();
  const categoryId = (product.category?._id || product.category)?.toString();
  const brandId = (product.brand?._id || product.brand)?.toString();

  let best = null;
  let bestDiscount = -1;

  for (const offer of activeOffers) {
    // Check exclusions
    if (offer.excludeProducts?.some(id => id.toString() === productId)) continue;
    if (offer.excludeCategories?.some(id => id.toString() === categoryId)) continue;
    if (offer.excludeBrands?.some(id => id.toString() === brandId)) continue;

    // Check applicability
    let applicable = false;
    if (offer.applyOn === 'all') applicable = true;
    else if (offer.applyOn === 'product') applicable = offer.applicableItems?.some(id => id.toString() === productId);
    else if (offer.applyOn === 'category') applicable = offer.applicableItems?.some(id => id.toString() === categoryId);
    else if (offer.applyOn === 'brand') applicable = offer.applicableItems?.some(id => id.toString() === brandId);
    if (!applicable) continue;

    // Compute discount amount
    const price = product.price || 0;
    let discountAmount = 0;
    if (offer.discountType === 'percentage') {
      discountAmount = (price * offer.discountValue) / 100;
      if (offer.maxDiscount) discountAmount = Math.min(discountAmount, offer.maxDiscount);
    } else if (offer.discountType === 'flat' || offer.discountType === 'fixed') {
      discountAmount = offer.discountValue;
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

    // Pick the highest absolute discount (priority is already sorted in query)
    if (discountAmount > bestDiscount) {
      bestDiscount = discountAmount;
      best = {
        offerId: offer._id,
        title: offer.title,
        description: offer.description || '',
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        maxDiscount: offer.maxDiscount || null,
        minOrderAmount: offer.minOrderAmount || 0,
        discountAmount,
        discountedPrice: Math.max(0, Math.round((price - discountAmount) * 100) / 100),
        endDate: offer.endDate,
      };
    }
  }

  return best;
};

/**
 * Fetch all currently active offers from the database.
 */
export const getActiveOffers = async () => {
  const now = new Date();
  return Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .sort({ priority: -1, discountValue: -1 })
    .lean();
};

/**
 * Enrich a cart by computing the best offer per item and recalculating totals.
 * Returns a plain object (not a mongoose document) with enriched fields.
 */
export const enrichCartWithPricing = async (cart) => {
  if (!cart) return null;

  const activeOffers = await getActiveOffers();

  let totalOfferDiscount = 0;
  const items = cart.items.map((item) => {
    const itemObj = item.toObject ? item.toObject() : { ...item };

    if (itemObj.product) {
      const product = typeof itemObj.product === 'object'
        ? itemObj.product
        : { _id: itemObj.product?.toString?.(), price: itemObj.price, category: null, brand: null };

      const offer = findBestOffer(product, activeOffers);
      if (offer) {
        const qtyDiscount = Math.round(offer.discountAmount * (itemObj.quantity || 1) * 100) / 100;
        totalOfferDiscount += qtyDiscount;
        itemObj.offer = {
          ...offer,
          discountAmount: qtyDiscount,
        };
      } else {
        itemObj.offer = null;
      }
    }

    return itemObj;
  });

  const totalOfferDiscountRounded = Math.round(totalOfferDiscount * 100) / 100;
  const totalAmount = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const couponDiscount = cart.discountAmount || 0;
  const finalAmount = Math.max(0, Math.round((totalAmount - totalOfferDiscountRounded - couponDiscount) * 100) / 100);

  return {
    _id: cart._id,
    user: cart.user,
    items,
    coupon: cart.coupon || null,
    totalAmount,
    offerDiscount: totalOfferDiscountRounded,
    discountAmount: couponDiscount,
    finalAmount,
  };
};

/**
 * Compute pricing for order creation — re-validates offers from DB.
 * Returns { orderItems, itemsPrice, offerDiscount, shippingPrice, taxPrice, totalPrice, appliedOfferId, appliedOfferName }
 */
export const computeOrderPricing = async (cart) => {
  if (!cart || !cart.items || !cart.items.length) {
    throw new Error('Cart is empty');
  }

  const activeOffers = await getActiveOffers();

  let itemsPrice = 0;
  let totalOfferDiscount = 0;
  let appliedOfferId = null;
  let appliedOfferName = '';
  const orderItems = [];

  for (const item of cart.items) {
    const product = typeof item.product === 'object' ? item.product : null;
    if (!product) continue;

    const price = product.price || item.price || 0;
    const qty = item.quantity || 1;
    const lineTotal = price * qty;
    itemsPrice += lineTotal;

    const offer = findBestOffer(product, activeOffers);
    if (offer) {
      const itemDiscount = Math.round(offer.discountAmount * qty * 100) / 100;
      totalOfferDiscount += itemDiscount;
      if (!appliedOfferId) {
        appliedOfferId = offer.offerId;
        appliedOfferName = offer.title || '';
      }
    }

    orderItems.push({
      product: product._id,
      name: product.name || 'Product',
      image: product.images?.[0] || '',
      price,
      quantity: qty,
      sku: product.sku || '',
      variant: item.variant ? { color: item.variant.color, size: item.variant.size } : undefined,
    });
  }

  totalOfferDiscount = Math.round(totalOfferDiscount * 100) / 100;
  const itemsPriceRounded = Math.round(itemsPrice * 100) / 100;
  const afterOffer = Math.max(0, itemsPriceRounded - totalOfferDiscount);
  const couponDiscount = cart.discountAmount || 0;
  const afterCoupon = Math.max(0, afterOffer - couponDiscount);
  const shippingPrice = afterCoupon > 500 ? 0 : 49;
  const taxPrice = Math.round(afterCoupon * 0.18 * 100) / 100;
  const totalPrice = Math.round((afterCoupon + shippingPrice + taxPrice) * 100) / 100;

  return {
    orderItems,
    itemsPrice: itemsPriceRounded,
    offerDiscount: totalOfferDiscount,
    couponDiscount,
    shippingPrice,
    taxPrice,
    totalPrice,
    appliedOfferId,
    appliedOfferName,
  };
};
