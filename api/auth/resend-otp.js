import { getDB, saveDB, generateOTP } from '../_lib/db.js';
import { sendVerificationEmail, hasEmailConfig } from '../_lib/email.js';

const BASE_URL = process.env.BASE_URL || 'https://studex-lac.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDB();
    const user = db.users[normalizedEmail];

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Already verified' });
    }

    if ((user.otpResendCount || 0) >= 5) {
      return res.status(429).json({
        error: 'Maximum resend attempts reached. Please contact support.',
        maxResendReached: true,
      });
    }

    const emailConfigured = hasEmailConfig();

    if (!emailConfigured) {
      // No email config — just auto-verify
      user.isVerified = true;
      delete user.verificationOtp;
      delete user.otpExpiresAt;
      saveDB(db);
      return res.json({ message: 'Account auto-verified (no email config). You can log in now.' });
    }

    // Generate new OTP and update expiry
    const newOtp = generateOTP();
    user.verificationOtp = newOtp;
    user.otpExpiresAt = Date.now() + 5 * 60 * 1000;
    user.otpResendCount = (user.otpResendCount || 0) + 1;

    saveDB(db);

    const verificationLink = `${BASE_URL}/?verifyToken=${user.verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
    await sendVerificationEmail(normalizedEmail, user.name, newOtp, verificationLink);

    return res.json({
      message: 'New verification code sent!',
      resendCount: user.otpResendCount,
    });
  } catch (err) {
    console.error('Resend-OTP API error:', err);
    return res.status(500).json({ error: 'Server error while resending OTP.' });
  }
}