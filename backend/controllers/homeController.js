import Banner from '../models/Banner.js';
import Offer from '../models/Offer.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { getCache, setCache } from '../config/redis.js';

// @desc    Get all active banners
// @route   GET /api/banners
export const getBanners = async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: now } },
      ],
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    })
      .sort({ order: 1 })
      .lean();

    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active offers for flash deals
// @route   GET /api/offers/active
export const getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(5)
      .lean();

    res.json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get testimonials (recent reviews with high ratings)
// @route   GET /api/reviews/testimonials
export const getTestimonials = async (req, res) => {
  try {
    const reviews = await Review.find({ isActive: true, rating: { $gte: 4 } })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complete homepage data in one request
// @route   GET /api/home
export const getHomepageData = async (req, res) => {
  try {
    const cacheKey = 'homepage:data';
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const now = new Date();

    // Use Promise.allSettled so each query is independent — a populate CastError
    // on one Product query won't crash the entire homepage.
    const results = await Promise.allSettled([
      // Banners
      Banner.find({
        isActive: true,
        $and: [
          {
            $or: [
              { startDate: { $exists: false } },
              { startDate: null },
              { startDate: { $lte: now } },
            ],
          },
          {
            $or: [
              { endDate: { $exists: false } },
              { endDate: null },
              { endDate: { $gte: now } },
            ],
          },
        ],
      })
        .sort({ order: 1 })
        .lean(),

      // Categories with product counts
      Category.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'products',
          },
        },
        {
          $addFields: {
            productCount: { $size: '$products' },
          },
        },
        { $sort: { order: 1 } },
        { $project: { products: 0 } },
      ]),

      // Featured products
      Product.find({ isActive: true, isFeatured: true })
        .populate('category', 'name slug')
        .populate({ path: 'brand', select: 'name' })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),

      // New arrivals
      Product.find({ isActive: true })
        .populate('category', 'name slug')
        .populate({ path: 'brand', select: 'name' })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),

      // Active offers
      Offer.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
        .sort({ priority: -1, createdAt: -1 })
        .limit(5)
        .lean(),

      // Testimonials
      Review.find({ isActive: true, rating: { $gte: 4 } })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Brands
      Brand.find({ isActive: true }).sort({ order: 1 }).limit(6).lean(),

      // Best sellers (products with most reviews/orders)
      Product.find({ isActive: true, stock: { $gt: 0 } })
        .populate('category', 'name slug')
        .populate({ path: 'brand', select: 'name' })
        .sort({ numReviews: -1, ratings: -1 })
        .limit(4)
        .lean(),

      // Trending products (highest rated + most reviewed)
      Product.find({ isActive: true, ratings: { $gte: 4 } })
        .populate('category', 'name slug')
        .populate({ path: 'brand', select: 'name' })
        .sort({ ratings: -1, numReviews: -1 })
        .limit(4)
        .lean(),

      // Statistics
      (async () => {
        const [
          productCount,
          brandCount,
          categoryCount,
          orderResult,
          reviewCount,
          activeProductCount,
          userCount,
        ] = await Promise.all([
          Product.countDocuments({ isActive: true }),
          Brand.countDocuments({ isActive: true }),
          Category.countDocuments({ isActive: true }),
          Order.aggregate([
            { $match: { isActive: { $ne: false } } },
            { $count: 'count' },
          ]),
          Review.countDocuments({ isActive: true }),
          Product.countDocuments({ isActive: true, stock: { $gt: 0 } }),
          User.countDocuments({ isActive: { $ne: false } }),
        ]);
        return {
          products: productCount,
          brands: brandCount,
          categories: categoryCount,
          orders: orderResult[0]?.count || 0,
          reviews: reviewCount,
          happyCustomers: userCount || Math.max(productCount * 3, 100),
          inStock: activeProductCount,
        };
      })(),
    ]);

    // Helper: extract fulfilled value or return fallback (empty array / object)
    const extract = (result, fallback = []) =>
      result.status === 'fulfilled' ? result.value : fallback;

    const statsResult = extract(results[9], {
      products: 0, brands: 0, categories: 0, orders: 0,
      reviews: 0, happyCustomers: 0, inStock: 0,
    });

    const result = {
      success: true,
      data: {
        banners: extract(results[0]),
        categories: extract(results[1]),
        featuredProducts: extract(results[2]),
        newArrivals: extract(results[3]),
        activeOffers: extract(results[4]),
        testimonials: extract(results[5]),
        brands: extract(results[6]),
        bestSellers: extract(results[7]),
        trendingProducts: extract(results[8]),
        stats: statsResult,
      },
    };
    await setCache(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
    console.error('getHomepageData error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};