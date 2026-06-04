import { verifyCashfreePayment } from './config/cashfree.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const orderId = 'TEST_ORDER_1779691201349';
    console.log('Fetching Cashfree Order details for:', orderId);
    const orderDetails = await verifyCashfreePayment(orderId);
    console.log('\n--- SUCCESS ---');
    console.log('Order Details:', JSON.stringify(orderDetails, null, 2));
  } catch (error) {
    console.error('\n--- ERROR ---');
    console.error(error?.response?.data || error.message || error);
  }
}

run();
