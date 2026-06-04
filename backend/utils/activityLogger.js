import UserActivity from '../models/UserActivity.js';
import SecurityLog from '../models/SecurityLog.js';
import LoginActivity from '../models/LoginActivity.js';

const getClientInfo = (req) => {
  const ua = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection?.remoteAddress || '';
  const device = /mobile/i.test(ua) ? 'Mobile' : /tablet/i.test(ua) ? 'Tablet' : 'Desktop';
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox'
    : ua.includes('Safari') ? 'Safari' : ua.includes('Edge') ? 'Edge' : 'Unknown';
  const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS'
    : ua.includes('Linux') ? 'Linux' : ua.includes('Android') ? 'Android'
    : ua.includes('iOS') ? 'iOS' : 'Unknown';
  return { ip, device, browser, os, userAgent: ua };
};

export const logUserActivity = async ({ userId, type, description, referenceId, referenceModel, metadata = {}, req = null }) => {
  try {
    const info = req ? getClientInfo(req) : {};
    await UserActivity.create({
      user: userId,
      type,
      description,
      referenceId,
      referenceModel,
      metadata: { ...info, ...metadata },
    });
  } catch (err) {
    console.error('Failed to log user activity:', err.message);
  }
};

export const logSecurityEvent = async ({ userId, event, description, severity = 'info', metadata = {}, req = null }) => {
  try {
    const info = req ? getClientInfo(req) : {};
    await SecurityLog.create({
      user: userId,
      event,
      description,
      severity,
      ip: info.ip,
      device: info.device,
      metadata: { ...info, ...metadata },
    });
  } catch (err) {
    console.error('Failed to log security event:', err.message);
  }
};

export const logLoginActivity = async ({ userId, status, sessionId, failReason = '', req = null }) => {
  try {
    if (!userId) return;
    const info = req ? getClientInfo(req) : {};
    await LoginActivity.create({
      user: userId,
      status,
      sessionId: sessionId || '',
      failReason,
      ...info,
    });
  } catch (err) {
    console.error('Failed to log login activity:', err.message);
  }
};