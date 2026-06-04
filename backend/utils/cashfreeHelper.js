import { createCashfreeOrder, fetchCashfreeOrder, verifyCashfreePayment } from '../config/cashfree.js';

export const initiatePayment = async (orderDetails) => {
  try {
    return await createCashfreeOrder(orderDetails);
  } catch (error) {
    // If order already exists in Cashfree (retry scenario), fetch it instead
    const errData = error?.response?.data || {};
    if (errData.type === 'invalid_request_error' && errData.message?.includes('already exists')) {
      return await fetchCashfreeOrder(orderDetails.orderId);
    }
    throw new Error(`Payment initiation failed: ${error.message}`);
  }
};

export const fetchExistingPayment = async (orderId) => {
  try {
    return await fetchCashfreeOrder(orderId);
  } catch (error) {
    throw new Error(`Fetch existing payment failed: ${error.message}`);
  }
};

export const verifyCashfreeOrder = async (orderId) => {
  try {
    return await verifyCashfreePayment(orderId);
  } catch (error) {
    throw new Error(`Payment verification failed: ${error.message}`);
  }
};
