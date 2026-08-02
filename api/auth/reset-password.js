import { getDB, saveDB, hashPassword } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, token, otp, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }
    if (!token && !otp) {
      return res.status(400).json({ error: 'Reset token or OTP code is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDB();

    // Look up the reset token
    let resetEntry = null;
    let resetKey = null;

    if (token) {
      resetEntry = db.resetTokens[token];
      resetKey = token;
    }

    // If token not found, try matching by email+OTP
    if (!resetEntry) {
      for (const [key, val] of Object.entries(db.resetTokens)) {
        if (val.email === normalizedEmail && !val.used) {
          if (otp && val.otp === otp.toString().trim()) {
            resetEntry = val;
            resetKey = key;
            break;
          }
          if (!otp && val.email === normalizedEmail) {
            resetEntry = val;
            resetKey = key;
            break;
          }
        }
      }
    }

    if (!resetEntry) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    if (resetEntry.used) {
      return res.status(400).json({ error: 'This reset link has already been used.' });
    }

    if (resetEntry.email !== normalizedEmail) {
      return res.status(400).json({ error: 'Reset token does not match this email.' });
    }

    if (Date.now() > resetEntry.expiresAt) {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.', expired: true });
    }

    // If OTP was provided, verify it
    if (otp && resetEntry.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid reset code.' });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Update password
    const user = db.users[normalizedEmail];
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    user.passwordHash = hashPassword(newPassword);

    // Mark token as used
    resetEntry.used = true;
    saveDB(db);

    return res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset-password API error:', err);
    return res.status(500).json({ error: 'Server error during password reset.' });
  }
}
