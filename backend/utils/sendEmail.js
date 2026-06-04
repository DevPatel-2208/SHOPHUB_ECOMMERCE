import { sendEmail as sendMail } from '../config/email.js';

// Re-export the raw sendEmail function for direct use (e.g., newsletter controller)
export { sendMail as sendEmail };

export const sendWelcomeEmail = async (to, name) => {
  await sendMail({
    to,
    subject: 'Welcome to Our Store!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border-radius:15px;text-align:center;">
        <h1 style="margin-bottom:20px;">Welcome, ${name}!</h1>
        <p style="font-size:18px;">Thank you for joining us. Start exploring amazing products now!</p>
        <a href="${process.env.CLIENT_URL}" style="display:inline-block;margin-top:20px;padding:12px 30px;background:white;color:#667eea;text-decoration:none;border-radius:25px;font-weight:bold;">Start Shopping</a>
      </div>
    `,
  });
};

export const sendOrderConfirmationEmail = async (to, order) => {
  await sendMail({
    to,
    subject: `Order Confirmation #${order._id.toString().slice(-6).toUpperCase()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">
        <h2 style="color:#4F46E5;">Order Confirmed!</h2>
        <p>Your order has been placed successfully.</p>
        <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;">
          <p><strong>Order ID:</strong> ${order._id.toString().slice(-6).toUpperCase()}</p>
          <p><strong>Total:</strong> ₹${order.totalPrice}</p>
        </div>
        <p style="color:#666;">You will receive tracking updates via email.</p>
      </div>
    `,
  });
};

export const sendLowStockAlert = async (to, products) => {
  const productList = products.map(p => `<li>${p.name} - Only ${p.stock} left</li>`).join('');
  await sendMail({
    to,
    subject: 'Low Stock Alert - Action Required',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#EF4444;">⚠️ Low Stock Alert</h2>
        <p>The following products are running low on stock:</p>
        <ul style="background:#FEF2F2;padding:15px;border-radius:8px;">${productList}</ul>
        <a href="${process.env.ADMIN_URL}/stock-alerts" style="display:inline-block;padding:10px 20px;background:#EF4444;color:white;text-decoration:none;border-radius:6px;">View Stock Alerts</a>
      </div>
    `,
  });
};
