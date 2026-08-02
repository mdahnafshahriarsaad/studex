import { getDB, saveDB, hashPassword } from '../_lib/db.js';

const BASE_URL = process.env.BASE_URL || 'https://studex-lac.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDB();
    const user = db.users[normalizedEmail];

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Only compare hashed passwords — no plaintext fallback
    const hashed = hashPassword(password);
    if (user.passwordHash !== hashed) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        unverified: true,
        email: normalizedEmail,
      });
    }

    user.lastLoginAt = new Date().toISOString();
    saveDB(db);

    const token = `token-${user.id}-${Date.now()}`;
    const userProfile = db.profiles[normalizedEmail] || {};

    return res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, isVerified: true },
      profile: userProfile.profile,
      settings: userProfile.settings,
    });
  } catch (err) {
    console.error('Login API error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
}