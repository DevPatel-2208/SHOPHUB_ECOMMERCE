import express from 'express';
import Subscriber from '../models/Subscriber.js';

const router = express.Router();

// @desc    Public newsletter subscription
// @route   POST /api/subscribers
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { email, name, source } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if already subscribed
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.unsubscribedAt = null;
        await existing.save();
        return res.json({ success: true, message: 'Subscription reactivated successfully' });
      }
      return res.json({ success: true, message: 'Already subscribed' });
    }

    const subscriber = await Subscriber.create({
      email,
      name: name || '',
      source: source || 'homepage',
    });

    res.status(201).json({ success: true, message: 'Subscribed successfully', subscriber });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ success: true, message: 'Already subscribed' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;