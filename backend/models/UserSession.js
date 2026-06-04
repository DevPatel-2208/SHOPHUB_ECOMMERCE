import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, unique: true },
  ip: { type: String, default: '' },
  device: { type: String, default: '' },
  browser: { type: String, default: '' },
  os: { type: String, default: '' },
  location: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now },
  expiredAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
}, { timestamps: true });

userSessionSchema.index({ user: 1, isActive: 1 });
userSessionSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

const UserSession = mongoose.model('UserSession', userSessionSchema);
export default UserSession;