import { getDB, saveDB, generateToken, generateOTP } from '../_lib/db.js';
import { sendResetEmail, hasEmailConfig } from '../_lib/email.js';

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

    if (!hasEmailConfig()) {
      return res.status(400).json({
        error: 'Password reset is not available. Please contact support to reset your password.',
        noEmailConfig: true,
      });
    }

    const resetToken = generateToken();
    const resetOtp = generateOTP();
    const resetExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store reset token in DB
    db.resetTokens[resetToken] = {
      email: normalizedEmail,
      otp: resetOtp,
      expiresAt: resetExpiry,
      used: false,
    };
    saveDB(db);

    const resetLink = `${BASE_URL}/?resetToken=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;
    await sendResetEmail(normalizedEmail, user.name, resetOtp, resetLink);

    // Always return success to prevent email enumeration
    return res.json({
      message: 'If an account exists with this email, a password reset code has been sent.',
    });
  } catch (err) {
    console.error('Forgot-password API error:', err);
    return res.status(500).json({ error: 'Server error during password reset request.' });
  }
}
