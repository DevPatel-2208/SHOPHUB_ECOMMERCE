import Address from '../models/Address.js';
import User from '../models/User.js';

// @desc    Get addresses
// @route   GET /api/addresses
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add address
// @route   POST /api/addresses
export const addAddress = async (req, res) => {
  try {
    const { isDefault, ...addressData } = req.body;

    if (isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({ ...addressData, user: req.user.id, isDefault: isDefault || false });
    await User.findByIdAndUpdate(req.user.id, { $push: { addresses: address._id } });

    res.status(201).json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
export const updateAddress = async (req, res) => {
  try {
    const { isDefault, ...addressData } = req.body;

    if (isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { ...addressData, isDefault: isDefault || false },
      { new: true }
    );

    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: false },
      { new: true }
    );
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, message: 'Address removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set default address
// @route   PATCH /api/addresses/:id/set-default
export const setDefaultAddress = async (req, res) => {
  try {
    await Address.updateMany({ user: req.user.id }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isDefault: true },
      { new: true }
    );
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
