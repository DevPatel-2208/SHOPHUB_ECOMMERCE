import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import UserSession from '../models/UserSession.js';
import { sendEmail } from '../config/email.js';
import { logUserActivity, logSecurityEvent, logLoginActivity } from '../utils/activityLogger.js';

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000,
};

// @desc    Register user with OTP
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name, email, phone, password,
      otp, otpExpire,
    });

    await sendEmail({
      to: email,
      subject: 'Verify Your Email - OTP',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">
          <h2 style="color:#4F46E5;">Welcome to Our Store!</h2>
          <p>Hi ${name},</p>
          <p>Your OTP for email verification is:</p>
          <div style="background:#f3f4f6;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#4F46E5;border-radius:8px;margin:20px 0;">
            ${otp}
          </div>
          <p style="color:#666;">This OTP expires in 10 minutes.</p>
          <p style="color:#999;font-size:12px;">If you didn't request this, please ignore.</p>
        </div>
      `,
    });

    res.status(201).json({ success: true, message: 'OTP sent to your email. Please verify.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+otp +otpExpire');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logLoginActivity({ userId: null, status: 'failed', failReason: 'User not found', req });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      logLoginActivity({ userId: user._id, status: 'failed', failReason: 'Email not verified', req });
      return res.status(401).json({ success: false, message: 'Please verify your email first' });
    }
    if (!user.isActive) {
      logLoginActivity({ userId: user._id, status: 'failed', failReason: 'Account deactivated', req });
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logLoginActivity({ userId: user._id, status: 'failed', failReason: 'Wrong password', req });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if this is an admin trying to log into admin panel
    const isAdminLogin = req.headers['x-admin-panel'] === 'true';
    if (isAdminLogin && user.role !== 'admin' && user.role !== 'superadmin') {
      logLoginActivity({ userId: user._id, status: 'failed', failReason: 'Admin access denied', req });
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);
    const decoded = jwt.decode(token);
    const sessionId = decoded?.jti || `${user._id}_${Date.now()}`;
    res.cookie('token', token, cookieOptions);

    // Create session
    await UserSession.create({
      user: user._id,
      sessionId,
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      isActive: true,
    }).catch(() => {});

    // Log activity
    logLoginActivity({ userId: user._id, status: 'success', sessionId, req });
    logUserActivity({ userId: user._id, type: 'login', description: 'Logged in successfully', req });

    res.json({
      success: true,
      token,
      sessionId,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    // Log failed login attempt
    if (req.body?.email) {
      const failedUser = await User.findOne({ email: req.body.email }).catch(() => null);
      if (failedUser) {
        logLoginActivity({ userId: failedUser._id, status: 'failed', failReason: error.message, req });
      }
    }
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error. Please try again.' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+otp +otpExpire');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail({
      to: email,
      subject: 'New OTP - Email Verification',
      html: `<div style="font-family:Arial,sans-serif;text-align:center;padding:40px;"><h2>Your new OTP is:</h2><div style="font-size:36px;font-weight:bold;color:#4F46E5;letter-spacing:10px;">${otp}</div><p>Expires in 10 minutes</p></div>`,
    });

    res.json({ success: true, message: 'New OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpire = new Date(Date.now() + 30 * 60 * 1000);

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#4F46E5;">Password Reset</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;margin:20px 0;">Reset Password</a>
          <p style="color:#666;">This link expires in 30 minutes.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('addresses');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  res.cookie('token', 'none', { ...cookieOptions, maxAge: 0 });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
export const googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id, req.user.role);
    res.cookie('token', token, cookieOptions);
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};
