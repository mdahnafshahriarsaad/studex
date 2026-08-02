import { getDB, saveDB } from '../_lib/db.js';

// In-memory rate limit (lost on cold start, acceptable for MVP)
const otpRateLimit = {};
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkOtpRateLimit(email) {
  const entry = otpRateLimit[email];
  if (!entry) return { allowed: true };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return { allowed: false, lockedUntil: entry.lockedUntil };
  }
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    delete otpRateLimit[email];
    return { allowed: true };
  }
  return { allowed: true };
}

function recordOtpFailure(email) {
  if (!otpRateLimit[email]) {
    otpRateLimit[email] = { attempts: 0, lockedUntil: null };
  }
  otpRateLimit[email].attempts += 1;
  if (otpRateLimit[email].attempts >= MAX_OTP_ATTEMPTS) {
    otpRateLimit[email].lockedUntil = Date.now() + OTP_LOCKOUT_MS;
  }
}

function recordOtpSuccess(email) {
  delete otpRateLimit[email];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.', verified: false });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check rate limit
    const rateCheck = checkOtpRateLimit(normalizedEmail);
    if (!rateCheck.allowed) {
      const remainingMinutes = Math.ceil((rateCheck.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        error: `Too many failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        verified: false,
        locked: true,
        retryAfter: rateCheck.lockedUntil,
      });
    }

    const db = getDB();
    const user = db.users[normalizedEmail];

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.', verified: false });
    }

    if (user.isVerified) {
      return res.json({ verified: true, message: 'Already verified' });
    }

    // Check OTP expiry (5 min)
    if (Date.now() > user.otpExpiresAt) {
      return res.status(400).json({
        error: 'Verification code expired. Please request a new one.',
        verified: false,
        expired: true,
      });
    }

    // Check OTP match
    if (user.verificationOtp !== otp.toString().trim()) {
      recordOtpFailure(normalizedEmail);
      return res.status(400).json({
        error: 'Invalid verification code.',
        verified: false,
      });
    }

    // OTP matches – verify the user
    user.isVerified = true;
    delete user.verificationOtp;
    delete user.otpExpiresAt;
    delete user.verificationToken;
    recordOtpSuccess(normalizedEmail);
    saveDB(db);

    return res.json({ verified: true, message: 'Email verified successfully!' });
  } catch (err) {
    console.error('Verify-OTP API error:', err);
    return res.status(500).json({ error: 'Server error during OTP verification.', verified: false });
  }
}
