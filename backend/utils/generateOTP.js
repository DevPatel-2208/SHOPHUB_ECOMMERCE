export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateOrderId = () => {
  return 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
};
