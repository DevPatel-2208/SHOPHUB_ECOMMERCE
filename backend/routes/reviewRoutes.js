import express from 'express';
import { getProductReviews, createReview, updateReview, deleteReview, markHelpful } from '../controllers/reviewController.js';
import { getTestimonials } from '../controllers/homeController.js';
import { protect } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validator.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);
router.get('/testimonials', getTestimonials);
router.post('/', protect, validate(schemas.review), createReview);
router.put('/:id', protect, validate(schemas.review), updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', markHelpful);

export default router;
