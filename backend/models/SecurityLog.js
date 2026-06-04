import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event: {
    type: String,
    enum: [
      'password_changed', 'password_reset', 'profile_updated', 'avatar_changed',
      'two_factor_enabled', 'two_factor_disabled', 'email_changed',
      'phone_changed', 'account_deactivated', 'account_reactivated',
      'login_from_new_device', 'failed_login_attempt', 'session_terminated',
      'suspicious_activity', 'security_alert',
    ],
    required: true,
  },
  description: { type: String, default: '' },
  ip: { type: String, default: '' },
  device: { type: String, default: '' },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

securityLogSchema.index({ user: 1, createdAt: -1 });
securityLogSchema.index({ user: 1, event: 1 });

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);
export default SecurityLog;