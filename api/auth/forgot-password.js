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
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await kvGet(`studex_user:${normalizedEmail}`);

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    user.passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    await kvSet(`studex_user:${normalizedEmail}`, user);

    return res.json({ message: 'Password reset successfully! Please log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
};
