import mongoose from 'mongoose';

const loginActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ip: { type: String, default: '' },
  device: { type: String, default: '' },
  browser: { type: String, default: '' },
  os: { type: String, default: '' },
  location: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  failReason: { type: String, default: '' },
  sessionId: { type: String, default: '' },
}, { timestamps: true });

loginActivitySchema.index({ user: 1, createdAt: -1 });
loginActivitySchema.index({ sessionId: 1 });

const LoginActivity = mongoose.model('LoginActivity', loginActivitySchema);
export default LoginActivity;