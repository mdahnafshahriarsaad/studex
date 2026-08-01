const crypto = require('crypto');

const VERCEL_KV_REST_API_URL = process.env.KV_REST_API_URL;
const VERCEL_KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  if (!VERCEL_KV_REST_API_URL) return null;
  try {
    const res = await fetch(`${VERCEL_KV_REST_API_URL}/GET/${key}`, {
      headers: { Authorization: `Bearer ${VERCEL_KV_REST_API_TOKEN}` },
    });
    const data = await res.json();
    return data.result;
  } catch { return null; }
}

async function kvSet(key, value) {
  if (!VERCEL_KV_REST_API_URL) return false;
  try {
    await fetch(`${VERCEL_KV_REST_API_URL}/SET/${key}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    return true;
  } catch { return false; }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await kvGet(`studex_user:${normalizedEmail}`);

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const hashed = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash !== hashed) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    if (!user.isVerified) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://studex-lac.vercel.app';
      const verificationLink = `${baseUrl}/?verifyToken=${user.verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
      return res.status(403).json({
        error: 'Please verify your email before signing in.',
        unverified: true,
        email: normalizedEmail,
        verificationLink,
      });
    }

    user.lastLoginAt = new Date().toISOString();
    await kvSet(`studex_user:${normalizedEmail}`, user);

    const token = `token-${user.id}-${Date.now()}`;
    const profileData = await kvGet(`studex_profile:${normalizedEmail}`);
    const settingsData = await kvGet(`studex_settings:${normalizedEmail}`);

    return res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, isVerified: true },
      profile: profileData || null,
      settings: settingsData || null,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};
