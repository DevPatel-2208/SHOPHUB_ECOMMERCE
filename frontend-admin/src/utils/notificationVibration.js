/**
 * ============================================================
 * NOTIFICATION VIBRATION UTILITY
 * ============================================================
 *
 * Production-level vibration patterns for admin notifications.
 * Provides safe browser vibration with mobile-only detection,
 * browser permission unlock, and fallback handling.
 *
 * Patterns inspired by premium eCommerce platforms:
 * - Amazon: subtle double buzz for new orders
 * - Shopify: short single for general notifications
 * - Flipkart: aggressive triple for urgent alerts
 *
 * @author Admin Dashboard
 * @version 2.0.0
 */

// ──────────────────────────────────────────
// Premium Vibration Pattern Definitions
// ──────────────────────────────────────────

/**
 * Premium vibration patterns mapped by notification type.
 * Each pattern is an array of [vibrate_ms, pause_ms, vibrate_ms, ...]
 *
 * Patterns:
 * - new_order:       Crisp double tap — professional and noticeable
 * - payment_success: Soft light triple — reassuring feedback
 * - urgent_alert:    Aggressive triple — demands attention
 * - short:           Single quick buzz — minimal interruption
 * - refund:          Medium double — balanced notification
 * - low_stock:       Sharp double — important but not urgent
 * - new_customer:    Gentle double — welcoming feel
 * - system:          Subtle single — system events
 */
export const VIBRATION_PATTERNS = {
  new_order:       [150, 80, 150],        // 👤 Requirement: [150, 80, 150]
  payment_success: [100, 50, 100, 50, 100],
  urgent_alert:    [250, 100, 250],       // 👤 Requirement: [250, 100, 250]
  short:           120,                   // 👤 Requirement: 120
  refund:          [150, 80, 150],
  low_stock:       [100, 50, 200],
  new_customer:    [120, 60, 120],
  system:          [80,  40, 80],
};

// ──────────────────────────────────────────
// Notification Type → Pattern Mapping
// ──────────────────────────────────────────

/**
 * Maps notification types to vibration patterns.
 * Falls back to 'short' for unknown types.
 */
const TYPE_TO_PATTERN = {
  new_order:       'new_order',
  payment_success: 'payment_success',
  payment:         'payment_success',
  order_cancelled: 'urgent_alert',
  low_stock:       'low_stock',
  refund:          'refund',
  new_customer:    'new_customer',
  system:          'system',
};

// ──────────────────────────────────────────
// Cached State
// ──────────────────────────────────────────

/** @type {boolean|null} Cached vibration support check */
let _vibrationSupported = null;

/** @type {boolean} Whether vibration has been unlocked via user interaction */
let _vibrationUnlocked = false;

/** @type {Array<Function>} Pending vibration calls queued before unlock */
const _pendingVibrations = [];

// ──────────────────────────────────────────
// Mobile Detection
// ──────────────────────────────────────────

/**
 * Checks if the current device is a mobile device based on viewport width.
 * Vibration is only useful on mobile devices; desktop browsers either don't
 * support it or the hardware doesn't exist.
 *
 * @returns {boolean} Whether the device is considered mobile
 *
 * @example
 * isMobileDevice(); // true if window.innerWidth < 768
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

// ──────────────────────────────────────────
// Browser Compatibility Check
// ──────────────────────────────────────────

/**
 * Checks if the browser supports the Vibration API.
 * Caches the result for performance.
 *
 * @returns {boolean} Whether vibration is supported
 */
export const isVibrationSupported = () => {
  if (_vibrationSupported !== null) return _vibrationSupported;
  try {
    _vibrationSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    return _vibrationSupported;
  } catch {
    _vibrationSupported = false;
    return false;
  }
};

/**
 * Checks if vibration is available and should be used on this device.
 * Combines browser support + mobile check.
 * This prevents unnecessary vibration on desktop browsers that may claim
 * support but have no vibration hardware.
 *
 * @returns {boolean} Whether vibration is available and should be used
 */
export const isVibrationAvailable = () => {
  return isVibrationSupported() && isMobileDevice();
};

// ──────────────────────────────────────────
// Vibration Permission Unlock
// ──────────────────────────────────────────

/**
 * Unlocks vibration after first user interaction.
 *
 * Chrome and other browsers block vibrate() calls not initiated by user
 * gestures. This must be called on first click/touchstart to "prime" the API.
 *
 * Call this once on first user interaction (e.g., in a click handler).
 * After this call, all subsequent navigator.vibrate() calls will work.
 *
 * @returns {boolean} Whether vibration was successfully unlocked
 */
export const unlockVibration = () => {
  if (_vibrationUnlocked) return true;
  if (!isVibrationSupported()) return false;

  try {
    // Chrome requires a user gesture to "unlock" the vibration API.
    // A zero-length vibration primes it without actually vibrating.
    const result = navigator.vibrate(0);
    if (result !== false) {
      _vibrationUnlocked = true;

      // Flush any pending vibrations that were queued before unlock
      _pendingVibrations.splice(0).forEach(fn => fn());

      return true;
    }
  } catch {
    // Silently fail — browser may not allow priming
  }

  return false;
};

/**
 * Checks if vibration has been unlocked by a user interaction.
 *
 * @returns {boolean} Whether vibration is unlocked
 */
export const isVibrationUnlocked = () => {
  return _vibrationUnlocked;
};

// ──────────────────────────────────────────
// Safe Vibration Trigger
// ──────────────────────────────────────────

/**
 * Safely triggers device vibration.
 * Handles unsupported browsers, permission issues, and silent failures.
 *
 * @param {number|number[]} pattern - Vibration pattern (ms or array of ms)
 * @returns {boolean} Whether vibration was successfully triggered
 */
export const safeVibrate = (pattern) => {
  // 1. Check browser support
  if (!isVibrationSupported()) return false;

  // 2. Mobile-only: skip if not a mobile device
  //    Desktop browsers that support the API likely don't have hardware
  if (!isMobileDevice()) return false;

  // 3. Validate pattern before calling
  if (!isValidVibrationPattern(pattern)) return false;

  // 4. If vibration hasn't been unlocked yet, queue it
  //    The unlock handler will flush pending vibrations
  if (!_vibrationUnlocked) {
    return new Promise((resolve) => {
      _pendingVibrations.push(() => {
        resolve(executeVibrate(pattern));
      });
    });
  }

  // 5. Execute vibration
  return executeVibrate(pattern);
};

/**
 * Internal — executes navigator.vibrate() with error handling.
 *
 * @param {number|number[]} pattern - Vibration pattern
 * @returns {boolean} Whether vibration was triggered
 */
const executeVibrate = (pattern) => {
  try {
    const result = navigator.vibrate(pattern);

    // Handle unsupported return value (undefined from some older browsers)
    if (typeof result === 'undefined') return false;

    return result;
  } catch (error) {
    // Silently fail — no console noise
    // Some mobile browsers may throw when vibration is disallowed
    // or when the page is not in focus (e.g., background tab)
    return false;
  }
};

// ──────────────────────────────────────────
// Public API
// ──────────────────────────────────────────

/**
 * Triggers vibration for a specific notification type.
 * Maps the type to a pattern and vibrates safely.
 * Only vibrates on mobile devices with Vibration API support.
 *
 * @param {string} notificationType - The type of notification (e.g., 'new_order')
 * @returns {boolean|Promise<boolean>} Whether vibration was successfully triggered
 *   Returns a Promise if vibration was queued pending unlock
 *
 * @example
 * vibrateForNotification('new_order'); // Professional double buzz
 * vibrateForNotification('urgent_alert'); // Aggressive triple buzz
 * vibrateForNotification('payment_success'); // Soft triple buzz
 */
export const vibrateForNotification = (notificationType) => {
  const patternKey = TYPE_TO_PATTERN[notificationType] || 'short';
  const pattern = VIBRATION_PATTERNS[patternKey];
  return safeVibrate(pattern);
};

/**
 * Stops any ongoing vibration immediately.
 * Useful when dismissing notifications or navigating away.
 *
 * @returns {boolean} Whether stop was successful
 */
export const stopVibration = () => {
  if (isVibrationSupported() && isMobileDevice()) {
    try {
      const result = navigator.vibrate(0);
      return result !== false;
    } catch {
      return false;
    }
  }
  return false;
};

// ──────────────────────────────────────────
// Pattern Validation
// ──────────────────────────────────────────

/**
 * Validates if a vibration pattern is well-formed.
 *
 * @param {number|number[]} pattern - Pattern to validate
 * @returns {boolean} Whether the pattern is valid
 *
 * @example
 * isValidVibrationPattern(150); // true
 * isValidVibrationPattern([150, 80, 150]); // true
 * isValidVibrationPattern(-1); // false
 */
export const isValidVibrationPattern = (pattern) => {
  if (typeof pattern === 'number') {
    return pattern >= 0 && pattern <= 10000;
  }
  if (Array.isArray(pattern)) {
    return pattern.length > 0 && pattern.every(
      (val) => typeof val === 'number' && val >= 0 && val <= 10000
    );
  }
  return false;
};

// ──────────────────────────────────────────
// React Hook Helper — Unlock on User Interaction
// ──────────────────────────────────────────

/**
 * Returns a set of event handlers to attach to your root React component.
 * Call this on first render to set up vibration unlock listeners.
 *
 * @returns {{ onClick: Function, onTouchStart: Function }}
 *
 * @example
 * // In your App component:
 * const vibrationHandlers = useVibrationUnlock();
 * return <div {...vibrationHandlers}><App /></div>;
 */
export const getVibrationUnlockHandlers = () => ({
  onClick: unlockVibration,
  onTouchStart: unlockVibration,
});

// ──────────────────────────────────────────
// Reset (for testing)
// ──────────────────────────────────────────

/**
 * Resets internal cached state. Useful for testing.
 */
export const resetVibrationState = () => {
  _vibrationSupported = null;
  _vibrationUnlocked = false;
  _pendingVibrations.length = 0;
};

export default {
  VIBRATION_PATTERNS,
  isVibrationSupported,
  isVibrationAvailable,
  isMobileDevice,
  safeVibrate,
  vibrateForNotification,
  stopVibration,
  isValidVibrationPattern,
  unlockVibration,
  isVibrationUnlocked,
  getVibrationUnlockHandlers,
  resetVibrationState,
};