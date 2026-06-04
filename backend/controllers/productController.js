import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Review from '../models/Review.js';
import Offer from '../models/Offer.js';
import { findBestOffer } from '../utils/pricing.js';

// @desc    Get all products with search, filter, sort
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, search, category, subcategory, brand,
      minPrice, maxPrice, sort = '-createdAt', inStock, tags,
      rating, hasOffer, availability,
    } = req.query;

    const query = { isActive: true };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } },
      ];
    }
    // Support multiple categories: ?category=id1,id2,id3
    if (category) {
      const ids = category.split(',').filter((id) => /^[a-f\d]{24}$/i.test(id));
      if (ids.length === 1) query.category = ids[0];
      else if (ids.length > 1) query.category = { $in: ids };
    }
    if (subcategory && subcategory !== 'undefined' && /^[a-f\d]{24}$/i.test(subcategory)) query.subcategory = subcategory;
    // Support multiple brands: ?brand=id1,id2
    if (brand) {
      const ids = brand.split(',').filter((id) => /^[a-f\d]{24}$/i.test(id));
      if (ids.length === 1) query.brand = ids[0];
      else if (ids.length > 1) query.brand = { $in: ids };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (rating) {
      const r = Number(rating);
      if (r >= 1 && r <= 5) query.ratings = { $gte: r };
    }
    if (inStock === 'true') query.stock = { $gt: 0 };
    if (availability === 'in_stock') query.stock = { $gt: 0 };
    else if (availability === 'out_of_stock') query.stock = { $lte: 0 };
    if (tags) query.tags = { $in: tags.split(',') };

    const sortObj = {};
    if (sort === 'price_asc') sortObj.price = 1;
    else if (sort === 'price_desc') sortObj.price = -1;
    else if (sort === 'rating') sortObj.ratings = -1;
    else if (sort === 'name_asc') sortObj.name = 1;
    else sortObj.createdAt = -1;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortObj);

    const count = await Product.countDocuments(query);

    // Fetch active offers and compute applicable offer per product
    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ priority: -1, discountValue: -1 }).lean();

    let productsWithOffers = products.map((product) => {
      const prod = product.toObject ? product.toObject() : { ...product };
      const best = findBestOffer(prod, activeOffers);
      if (best) {
        prod.offer = {
          _id: best.offerId,
          title: best.title,
          discountType: best.discountType,
          discountValue: best.discountValue,
          maxDiscount: best.maxDiscount || null,
          discountAmount: best.discountAmount,
          discountedPrice: best.discountedPrice,
        };
      }
      return prod;
    });

    if (hasOffer === 'true') {
      productsWithOffers = productsWithOffers.filter((p) => p.offer);
    }

    const result = {
      success: true,
      products: productsWithOffers,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
      filters: { brands: await Brand.find({ isActive: true }).select('name slug').lean() },
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product (light version)
// @route   GET /api/products/:id
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('brand', 'name')
      .populate({ path: 'specifications', populate: { path: 'specKey', select: 'key label' } });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const reviews = await Review.find({ product: req.params.id, isActive: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, product, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get full product details with offers, recommendations, reviews
// @route   GET /api/products/:id/details
export const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('brand', 'name')
      .populate({ path: 'specifications', populate: { path: 'specKey', select: 'key label' } });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Fetch reviews with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const reviews = await Review.find({ product: req.params.id, isActive: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalReviews = await Review.countDocuments({ product: req.params.id, isActive: true });

    // Fetch active offers applicable to this product
    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { applyOn: 'all' },
        { applyOn: 'product', applicableItems: product._id },
        { applyOn: 'category', applicableItems: product.category?._id },
        { applyOn: 'brand', applicableItems: product.brand?._id },
      ],
      $and: [
        { $or: [{ excludeProducts: { $ne: product._id } }, { excludeProducts: { $exists: false } }] },
        { $or: [{ excludeCategories: { $ne: product.category?._id } }, { excludeCategories: { $exists: false } }] },
        { $or: [{ excludeBrands: { $ne: product.brand?._id } }, { excludeBrands: { $exists: false } }] },
      ],
    }).sort({ priority: -1 }).lean();

    // Fetch related products (same category)
    let relatedProducts = [];
    if (product.category?._id) {
      relatedProducts = await Product.find({
        _id: { $ne: product._id },
        category: product.category._id,
        isActive: true,
      })
        .populate('category', 'name slug')
        .select('name price comparePrice images ratings numReviews stock outOfStock isFeatured')
        .sort({ ratings: -1 })
        .limit(8)
        .lean();
    }

    // If less than 4 related, fill with trending products
    if (relatedProducts.length < 4) {
      const trending = await Product.find({
        _id: { $ne: product._id },
        ...(product.category?._id ? { category: { $ne: product.category._id } } : {}),
        isActive: true,
        stock: { $gt: 0 },
      })
        .populate('category', 'name slug')
        .select('name price comparePrice images ratings numReviews stock outOfStock isFeatured')
        .sort({ numReviews: -1, ratings: -1 })
        .limit(8 - relatedProducts.length)
        .lean();
      relatedProducts = [...relatedProducts, ...trending];
    }

    // Fetch also bought products (based on same category, highest rated)
    const alsoBought = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      stock: { $gt: 0 },
    })
      .populate('category', 'name slug')
      .select('name price comparePrice images ratings numReviews stock outOfStock isFeatured')
      .sort({ numReviews: -1 })
      .limit(8)
      .lean();

    // Rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { product: product._id, isActive: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((r) => { distribution[r._id] = r.count; });

    res.json({
      success: true,
      product,
      reviews: {
        items: reviews,
        total: totalReviews,
        page,
        totalPages: Math.ceil(totalReviews / limit),
        distribution,
      },
      offers: activeOffers,
      relatedProducts,
      alsoBought,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get review summary for a product
// @route   GET /api/products/:id/review-summary
export const getProductReviewSummary = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments({ product: req.params.id, isActive: true });
    const ratingDistribution = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.id), isActive: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    ratingDistribution.forEach((r) => {
      distribution[r._id] = r.count;
      totalRating += r._id * r.count;
    });
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0;

    res.json({
      success: true,
      summary: {
        average: Math.round(averageRating * 10) / 10,
        total: totalReviews,
        distribution,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create product (Admin)
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    // Handle uploaded images from multer-cloudinary
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => file.path);
    }
    // Parse JSON string fields from FormData
    if (req.body.specifications && typeof req.body.specifications === 'string') {
      req.body.specifications = JSON.parse(req.body.specifications);
    }
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = JSON.parse(req.body.tags);
    }
    if (req.body.dimensions && typeof req.body.dimensions === 'string') {
      req.body.dimensions = JSON.parse(req.body.dimensions);
    }
    // Convert numeric fields
    req.body.price = Number(req.body.price);
    if (req.body.comparePrice) req.body.comparePrice = Number(req.body.comparePrice);
    req.body.stock = Number(req.body.stock) || 0;
    if (req.body.lowStockThreshold) req.body.lowStockThreshold = Number(req.body.lowStockThreshold);
    if (req.body.weight) req.body.weight = Number(req.body.weight);
    // Convert boolean fields
    if (req.body.isActive) req.body.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.isFeatured) req.body.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    // Handle uploaded images - merge new with existing
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
      req.body.images = [...existingImages, ...newImages];
    } else if (req.body.existingImages) {
      req.body.images = JSON.parse(req.body.existingImages);
    }
    delete req.body.existingImages;

    // Parse JSON string fields from FormData
    if (req.body.specifications && typeof req.body.specifications === 'string') {
      req.body.specifications = JSON.parse(req.body.specifications);
    }
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = JSON.parse(req.body.tags);
    }
    if (req.body.dimensions && typeof req.body.dimensions === 'string') {
      req.body.dimensions = JSON.parse(req.body.dimensions);
    }
    // Convert numeric fields
    if (req.body.price) req.body.price = Number(req.body.price);
    if (req.body.comparePrice) req.body.comparePrice = Number(req.body.comparePrice);
    if (req.body.stock) req.body.stock = Number(req.body.stock);
    if (req.body.lowStockThreshold) req.body.lowStockThreshold = Number(req.body.lowStockThreshold);
    if (req.body.weight) req.body.weight = Number(req.body.weight);
    // Convert boolean fields
    if (req.body.isActive) req.body.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.isFeatured) req.body.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search products with autocomplete
// @route   GET /api/products/search
export const searchProducts = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, products: [] });
    }

    const searchTerm = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } },
      ],
    })
      .select('name thumbnail price comparePrice category stock slug')
      .populate('category', 'name')
      .limit(limit * 1)
      .sort({ ratings: -1, createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
export const getFeatured = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true, stock: { $gt: 0 } })
      .limit(8)
      .populate('category', 'name');

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get filter metadata (category counts, brand counts, price range, etc.)
// @route   GET /api/products/filters/metadata
export const getFilterMetadata = async (req, res) => {
  try {
    const baseQuery = { isActive: true };

    // Price range
    const priceAgg = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } },
    ]);
    const priceRange = priceAgg[0] || { minPrice: 0, maxPrice: 100000 };

    // Category counts
    const categoryCounts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $match: { 'category.isActive': true } },
      { $sort: { count: -1 } },
    ]);

    // Brand counts (only brands with active products)
    const brandCounts = await Product.aggregate([
      { $match: { isActive: true, brand: { $ne: null } } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'brand' } },
      { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      { $match: { 'brand.isActive': true } },
      { $sort: { count: -1 } },
    ]);

    // Rating counts
    const ratingCounts = await Product.aggregate([
      { $match: { isActive: true, ratings: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          fourAndAbove: { $sum: { $cond: [{ $gte: ['$ratings', 4] }, 1, 0] } },
          threeAndAbove: { $sum: { $cond: [{ $gte: ['$ratings', 3] }, 1, 0] } },
          twoAndAbove: { $sum: { $cond: [{ $gte: ['$ratings', 2] }, 1, 0] } },
          oneAndAbove: { $sum: { $cond: [{ $gte: ['$ratings', 1] }, 1, 0] } },
        },
      },
    ]);

    // Offer counts
    const now = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();
    const offerProductIds = new Set();
    const offerCategoryIds = new Set();
    const offerBrandIds = new Set();
    for (const o of activeOffers) {
      if (o.applyOn === 'all') { /* all products */ }
      else if (o.applyOn === 'product' && o.applicableItems) o.applicableItems.forEach((id) => offerProductIds.add(id.toString()));
      else if (o.applyOn === 'category' && o.applicableItems) o.applicableItems.forEach((id) => offerCategoryIds.add(id.toString()));
      else if (o.applyOn === 'brand' && o.applicableItems) o.applicableItems.forEach((id) => offerBrandIds.add(id.toString()));
    }
    const hasGlobalOffer = activeOffers.some((o) => o.applyOn === 'all');
    let offerCount = 0;
    if (hasGlobalOffer) {
      offerCount = await Product.countDocuments({ isActive: true });
    } else {
      const offerQuery = {
        isActive: true,
        $or: [
          ...(offerProductIds.size ? [{ _id: { $in: [...offerProductIds] } }] : []),
          ...(offerCategoryIds.size ? [{ category: { $in: [...offerCategoryIds] } }] : []),
          ...(offerBrandIds.size ? [{ brand: { $in: [...offerBrandIds] } }] : []),
        ],
      };
      if (offerQuery.$or.length > 0) {
        offerCount = await Product.countDocuments(offerQuery);
      }
    }

    // Availability counts
    const inStockCount = await Product.countDocuments({ isActive: true, stock: { $gt: 0 } });
    const outOfStockCount = await Product.countDocuments({ isActive: true, stock: { $lte: 0 } });

    res.json({
      success: true,
      filters: {
        priceRange: { min: priceRange.minPrice, max: priceRange.maxPrice },
        categories: categoryCounts.map((c) => ({
          _id: c._id,
          name: c.category?.name || 'Unknown',
          slug: c.category?.slug || '',
          count: c.count,
        })),
        brands: brandCounts.map((b) => ({
          _id: b._id,
          name: b.brand?.name || 'Unknown',
          slug: b.brand?.slug || '',
          count: b.count,
        })),
        ratings: ratingCounts[0] || { fourAndAbove: 0, threeAndAbove: 0, twoAndAbove: 0, oneAndAbove: 0 },
        offers: { count: offerCount },
        availability: { inStock: inStockCount, outOfStock: outOfStockCount },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get filtered product IDs and counts for sidebar live counts
// @route   POST /api/products/filter-counts
export const getFilterCounts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, rating, inStock } = req.body || {};
    const query = { isActive: true };

    if (category) {
      const ids = category.split(',').filter((id) => /^[a-f\d]{24}$/i.test(id));
      if (ids.length) query.category = { $in: ids };
    }
    if (brand) {
      const ids = brand.split(',').filter((id) => /^[a-f\d]{24}$/i.test(id));
      if (ids.length) query.brand = { $in: ids };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (inStock === 'true') query.stock = { $gt: 0 };
    if (rating) {
      const r = Number(rating);
      if (r >= 1 && r <= 5) query.ratings = { $gte: r };
    }

    const results = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          categories: { $addToSet: '$category' },
          brands: { $addToSet: '$brand' },
          minP: { $min: '$price' },
          maxP: { $max: '$price' },
        },
      },
    ]);

    res.json({ success: true, counts: { total: results[0]?.total || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
