import { Cashfree } from 'cashfree-pg';

// Cashfree API version
const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01';

// Configure Cashfree SDK using the correct v4.x pattern
// The Environment enum is a static property on Cashfree, NOT a separate named export
const envStr = (process.env.CASHFREE_ENVIRONMENT || 'SANDBOX').toUpperCase();
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = envStr === 'PRODUCTION'
  ? Cashfree.Environment.PRODUCTION
  : Cashfree.Environment.SANDBOX;

// Determine the correct Cashfree Checkout base URL for the frontend
// The hosted checkout page URL format is /order/#payment_session_id
export const CASHFREE_CHECKOUT_BASE_URL =
  Cashfree.XEnvironment === Cashfree.Environment.PRODUCTION
    ? 'https://payments.cashfree.com/order/#'
    : 'https://payments-test.cashfree.com/order/#';

/**
 * Sanitize a payment_session_id returned by Cashfree API.
 * Cashfree session IDs follow the format: session_<alphanumeric_with_hyphens_underscores>
 * This strips any extraneous characters or appended text (e.g., "paymentpayment")
 * that may appear due to API response corruption or encoding issues.
 *
 * @param {string|null} sessionId - Raw payment_session_id from Cashfree response
 * @returns {string|null} - Cleaned session_id, or null if invalid
 */
export const sanitizePaymentSessionId = (sessionId) => {
  if (!sessionId || typeof sessionId !== 'string') return null;
  // Match the valid session_ prefix followed by allowed characters (alphanumeric, hyphen, underscore)
  const match = sessionId.match(/^(session_[a-zA-Z0-9_-]+)/);
  if (match) {
    const cleaned = match[1];
    if (cleaned.length !== sessionId.length) {
      console.warn(
        `[Cashfree] Sanitized payment_session_id: removed ${sessionId.length - cleaned.length} extraneous character(s) ` +
        `("${sessionId.slice(cleaned.length)}") from end of session ID`
      );
    }
    return cleaned;
  }
  // Doesn't even start with session_ — invalid
  console.error(`[Cashfree] Invalid payment_session_id format: does not start with "session_"`);
  return null;
};

export const createCashfreeOrder = async ({
  orderId,
  orderAmount,
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  returnUrl,
}) => {
  try {
    // Cashfree CreateOrderRequest requires order_amount as a number (not string)
    const numericAmount = Number(orderAmount);
    if (!numericAmount || numericAmount <= 0) {
      throw new Error(`Invalid order amount: ${orderAmount}. Must be a positive number.`);
    }

    // Cashfree requires customer_phone to be a valid 10-digit Indian phone number
    const sanitizedPhone = (customerPhone || '').replace(/\D/g, '').slice(-10);
    const validPhone = sanitizedPhone.length === 10 ? sanitizedPhone : '9999999999';

    // Cashfree requires customer_id to be alphanumeric (no special chars like in MongoDB ObjectId)
    // MongoDB ObjectId is hex so it's already alphanumeric, but we sanitize anyway
    const sanitizedCustomerId = customerId.replace(/[^a-zA-Z0-9_\-]/g, '');

    // Cashfree requires customer_name — this is CRITICAL for valid payment session creation
    // Without it, Cashfree returns "client session id is invalid" on the checkout page
    const sanitizedCustomerName = (customerName || 'Customer').trim();

    const request = {
      order_id: orderId,
      order_amount: numericAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: sanitizedCustomerId,
        customer_name: sanitizedCustomerName,
        customer_email: customerEmail,
        customer_phone: validPhone,
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`}/api/payments/webhook`,
      },
    };

    console.log('Cashfree Create Order Request:', JSON.stringify(request, null, 2));
    const response = await Cashfree.PGCreateOrder(CASHFREE_API_VERSION, request);
    // response.data contains: cf_order_id, order_id, order_status, payment_session_id, order_amount, etc.
    console.log('Cashfree Create Order Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    const errDetails = error?.response?.data || error.message || error;
    console.error('Cashfree Create Order Error:', errDetails);
    throw error;
  }
};

// Fetch an existing Cashfree order by order_id — used for retry scenarios
// where the order already exists in Cashfree but payment wasn't completed
export const fetchCashfreeOrder = async (orderId) => {
  try {
    const response = await Cashfree.PGFetchOrder(CASHFREE_API_VERSION, orderId);
    console.log('Cashfree Fetch Order Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Cashfree Fetch Order Error:', error?.response?.data || error.message || error);
    throw error;
  }
};

export const verifyCashfreePayment = async (orderId) => {
  try {
    const response = await Cashfree.PGFetchOrder(CASHFREE_API_VERSION, orderId);
    return response.data;
  } catch (error) {
    console.error('Cashfree Verify Error:', error?.response?.data || error.message || error);
    throw error;
  }
};

export default Cashfree;
