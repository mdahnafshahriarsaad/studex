const crypto = require('crypto');

// Vercel KV or simple in-memory store (persists per deployment)
// For production, connect to Vercel KV, Supabase, or MongoDB
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
    const { email, password, name, selectedClass } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const existing = await kvGet(`studex_user:${normalizedEmail}`);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const verificationToken = crypto.randomBytes(24).toString('hex');

    const user = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
      isVerified: false,
      selectedClass: selectedClass || 'Class 9',
      verificationToken,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await kvSet(`studex_user:${normalizedEmail}`, user);

    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://studex-lac.vercel.app'}/?verifyToken=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Email sending: use Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Studex <noreply@studex.app>',
            to: normalizedEmail,
            subject: 'Verify Your Studex Account',
            html: `
              <div style="background:#000;color:#fff;padding:40px;font-family:Inter,sans-serif;max-width:500px;margin:auto;">
                <div style="text-align:center;margin-bottom:30px;">
                  <h1 style="color:#00F0FF;font-size:28px;">STUDEX</h1>
                  <p style="color:#888;font-size:13px;">Smart Academic Planner</p>
                </div>
                <h2 style="margin-bottom:10px;font-size:20px;">Verify Your Email</h2>
                <p style="color:#aaa;font-size:14px;">Click the button below to verify your Studex account:</p>
                <div style="text-align:center;margin:30px 0;">
                  <a href="${verificationLink}"
                     style="background:linear-gradient(to right,#0A84FF,#00F0FF);color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
                    Verify Email Address
                  </a>
                </div>
                <p style="color:#555;font-size:12px;">If the button doesn't work, copy this link:</p>
                <p style="color:#00F0FF;font-size:12px;word-break:break-all;">${verificationLink}</p>
                <p style="color:#444;font-size:10px;margin-top:30px;">© 2026 Studex. All Rights Reserved.</p>
              </div>
            `,
          }),
        });
        if (resendRes.ok) {
          console.log(`Verification email sent to ${normalizedEmail}`);
        }
      } catch (mailErr) {
        console.error('Email send failed:', mailErr.message);
      }
    }

    // If no KV or email configured, auto-verify for smooth UX
    if (!VERCEL_KV_REST_API_URL) {
      user.isVerified = true;
      await kvSet(`studex_user:${normalizedEmail}`, user);
    }

    return res.status(201).json({
      message: user.isVerified
        ? 'Account created successfully! You can now sign in.'
        : 'Account created! Please check your email to verify your account.',
      user: { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified },
      verificationToken,
      verificationLink: VERCEL_KV_REST_API_URL ? verificationLink : undefined,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error during signup. Please try again.' });
  }
};
