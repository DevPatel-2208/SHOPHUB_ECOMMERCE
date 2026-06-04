import Joi from 'joi';

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
  }
  next();
};

export const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    password: Joi.string().min(6).required(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  otpVerify: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  }),
  product: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().positive().required(),
    stock: Joi.number().integer().min(0).required(),
    category: Joi.string().required(),
  }),
  order: Joi.object({
    shippingAddress: Joi.object({
      fullName: Joi.string().required(),
      phone: Joi.string().required(),
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().allow('', null).optional(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().optional(),
    }).unknown(true).required(),
    paymentMethod: Joi.string().valid('cashfree', 'cod', 'wallet'),
  }),
  address: Joi.object({
    fullName: Joi.string().required(),
    phone: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow('', null).optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().optional(),
    addressType: Joi.string().valid('home', 'work', 'other'),
    isDefault: Joi.boolean(),
  }),
  coupon: Joi.object({
    code: Joi.string().uppercase().required(),
    discountType: Joi.string().valid('percentage', 'fixed').required(),
    discountValue: Joi.number().positive().required(),
    expiryDate: Joi.date().greater('now').required(),
    minOrderValue: Joi.number().min(0),
    maxUses: Joi.number().integer().min(1),
  }),
};
