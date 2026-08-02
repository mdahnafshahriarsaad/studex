import { getDB, saveDB } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, email } = req.body;
    const db = getDB();

    let targetUserEmail = null;

    if (email && db.users[email.toLowerCase()]) {
      targetUserEmail = email.toLowerCase();
    } else {
      for (const em of Object.keys(db.users)) {
        if (db.users[em].verificationToken === token) {
          targetUserEmail = em;
          break;
        }
      }
    }

    if (!targetUserEmail || !db.users[targetUserEmail]) {
      return res.status(400).json({ error: 'Invalid verification token or email.', verified: false });
    }

    const targetUser = db.users[targetUserEmail];
    if (targetUser.isVerified) {
      return res.json({ message: 'Email is already verified. You can log in.', verified: true });
    }

    if (!token || targetUser.verificationToken !== token) {
      return res.status(400).json({ error: 'Invalid or expired verification token.', verified: false });
    }

    targetUser.isVerified = true;
    delete targetUser.verificationToken;
    delete targetUser.verificationOtp;
    delete targetUser.otpExpiresAt;
    saveDB(db);

    return res.json({ message: 'Email verified successfully! You can now log in.', verified: true });
  } catch (err) {
    console.error('Verify-email API error:', err);
    return res.status(500).json({ error: 'Server error during email verification.' });
  }
}
