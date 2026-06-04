import express from 'express';
import { getLowStock, updateStock, getInventoryOverview } from '../controllers/stockController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/low', protect, adminOnly, getLowStock);
router.get('/overview', protect, adminOnly, getInventoryOverview);
router.put('/:productId', protect, adminOnly, updateStock);

export default router;
