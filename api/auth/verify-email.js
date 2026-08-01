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
    const { token, email } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const targetEmail = email ? email.trim().toLowerCase() : null;
    let user = null;
    let userEmail = null;

    if (targetEmail) {
      user = await kvGet(`studex_user:${targetEmail}`);
      if (user && user.verificationToken === token) {
        userEmail = targetEmail;
      }
    }

    if (!userEmail) {
      // Token-only verification not supported without KV scanning
      return res.status(400).json({ error: 'Invalid or expired verification link.' });
    }

    user.isVerified = true;
    delete user.verificationToken;
    await kvSet(`studex_user:${userEmail}`, user);

    return res.json({ message: 'Email verified successfully! You can now log in.', verified: true });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: 'Verification failed.' });
  }
};
