import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [50, 'Name cannot exceed 50 chars'] },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, sparse: true },
    password: { type: String, minlength: [6, 'Password must be at least 6 chars'], select: false },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    googleId: { type: String, unique: true, sparse: true },
    otp: { type: String, select: false },
    otpExpire: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    // Extended profile fields
    username: { type: String, trim: true, unique: true, sparse: true },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'], default: 'prefer-not-to-say' },
    dob: { type: Date },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
    pincode: { type: String, trim: true },
    twoFactorEnabled: { type: Boolean, default: false },
    // Activity tracking
    lastPasswordChanged: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function () {
  const fields = [
    this.name, this.email, this.phone, this.avatar,
    this.gender && this.gender !== 'prefer-not-to-say',
    this.dob, this.address, this.city, this.state, this.country, this.pincode
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const User = mongoose.model('User', userSchema);
export default User;
