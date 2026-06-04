import express from 'express';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/addressController.js';
import { protect } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validator.js';

const router = express.Router();

router.get('/', protect, getAddresses);
router.post('/', protect, validate(schemas.address), addAddress);
router.put('/:id', protect, validate(schemas.address), updateAddress);
router.delete('/:id', protect, deleteAddress);
router.patch('/:id/set-default', protect, setDefaultAddress);

export default router;
