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
      // Don't reveal whether account exists
      return res.json({
        message: 'If an account exists with this email, a password reset code has been sent.',
      });
    }

    const emailConfigured = hasEmailConfig();
    const resetToken = generateToken();
    const resetOtp = generateOTP();
    const resetExpiry = Date.now() + 15 * 60 * 1000;

    db.resetTokens[resetToken] = {
      email: normalizedEmail,
      otp: emailConfigured ? resetOtp : '000000',
      expiresAt: resetExpiry,
      used: false,
      autoVerified: !emailConfigured,
    };
    saveDB(db);

    if (emailConfigured) {
      try {
        const resetLink = `${BASE_URL}/?resetToken=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;
        await sendResetEmail(normalizedEmail, user.name, resetOtp, resetLink);
      } catch (emailErr) {
        console.warn('Reset email send failed:', emailErr.message);
      }
    }

    return res.json({
      message: emailConfigured
        ? 'If an account exists with this email, a password reset code has been sent.'
        : 'Password reset code: 000000 (no email config — use this code to reset).',
      noEmailCode: !emailConfigured ? '000000' : undefined,
    });
  } catch (err) {
    console.error('Forgot-password API error:', err);
    return res.status(500).json({ error: 'Server error during password reset request.' });
  }
}
