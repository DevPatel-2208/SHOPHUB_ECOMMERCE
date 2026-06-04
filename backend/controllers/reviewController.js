import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Get product reviews with filtering & sorting
// @route   GET /api/reviews/product/:productId
export const getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', rating } = req.query;
    const query = { product: req.params.productId, isActive: true };

    // Filter by rating
    if (rating && !isNaN(rating)) query.rating = Number(rating);

    const sortObj = {};
    if (sort === 'helpful') sortObj.helpful = -1;
    else if (sort === '-helpful') sortObj.helpful = -1;
    else if (sort === 'rating') sortObj.rating = -1;
    else if (sort === '-rating') sortObj.rating = -1;
    else sortObj.createdAt = -1;

    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments(query);

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.productId), isActive: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((r) => { distribution[r._id] = r.count; });

    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
      distribution,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create review
// @route   POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const { product, rating, title, comment, images } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ user: req.user.id, product, isActive: true });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    // Verify purchase
    const hasOrdered = await Order.findOne({
      user: req.user.id,
      'orderItems.product': product,
      status: 'delivered',
    });

    const review = await Review.create({
      user: req.user.id,
      product,
      rating,
      title,
      comment,
      images: images || [],
      isVerifiedPurchase: !!hasOrdered,
    });

    // Update product rating
    const reviews = await Review.find({ product, isActive: true });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(product, { ratings: Math.round(avgRating * 10) / 10, numReviews: reviews.length });

    await review.populate('user', 'name avatar');
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
export const markHelpful = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpful: 1 } },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, helpful: review.helpful });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: false },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
