import Product from '../models/Product.js';
import { sendEmail } from '../config/email.js';

// @desc    Get low stock products (Admin)
// @route   GET /api/stock/low
export const getLowStock = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }).sort({ stock: 1 });
    res.json({ success: true, products, count: products.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update stock (Admin)
// @route   PUT /api/stock/:productId
export const updateStock = async (req, res) => {
  try {
    const { stock, lowStockThreshold } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { stock, lowStockThreshold, outOfStock: stock <= 0 },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get inventory overview (Admin)
// @route   GET /api/stock/overview
export const getInventoryOverview = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const outOfStock = await Product.countDocuments({ isActive: true, outOfStock: true });
    const lowStock = await Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      stock: { $gt: 0 },
    });
    const totalStock = await Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, total: { $sum: '$stock' } } }]);

    res.json({ success: true, overview: { totalProducts, outOfStock, lowStock, totalStockValue: totalStock[0]?.total || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
