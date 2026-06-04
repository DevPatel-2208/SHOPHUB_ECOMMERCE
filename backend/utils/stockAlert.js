import Product from '../models/Product.js';
import { sendLowStockAlert } from './sendEmail.js';

export const checkLowStock = async () => {
  try {
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }).sort({ stock: 1 });

    if (lowStockProducts.length > 0) {
      await sendLowStockAlert(process.env.SMTP_EMAIL, lowStockProducts);
      console.log(`⚠️ Low stock alert sent for ${lowStockProducts.length} products`);
    }
  } catch (error) {
    console.error('Stock alert error:', error);
  }
};
