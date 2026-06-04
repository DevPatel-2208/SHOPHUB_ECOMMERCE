import express from 'express';
import { getBanners } from '../controllers/homeController.js';
import { uploadSingle } from '../middleware/upload.js';
import { protect, adminOnly } from '../middleware/auth.js';
import Banner from '../models/Banner.js';

const router = express.Router();

// Public
router.get('/', getBanners);

// Admin
router.post('/', protect, adminOnly, uploadSingle, async (req, res) => {
  try {
    if (req.file) req.body.image = req.file.path;
    if (req.body.isActive) req.body.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.order) req.body.order = Number(req.body.order);
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, adminOnly, uploadSingle, async (req, res) => {
  try {
    if (req.file) req.body.image = req.file.path;
    if (req.body.isActive) req.body.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.order) req.body.order = Number(req.body.order);
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Banner.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Banner deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;