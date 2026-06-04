import express from 'express';
import { getShipments, updateShipment, trackByAWB } from '../controllers/shipmentController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, adminOnly, getShipments);
router.put('/:orderId', protect, adminOnly, updateShipment);
router.get('/track/:awb', trackByAWB);

export default router;
