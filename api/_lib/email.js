// Email service supporting both Resend (preferred) and Nodemailer (SMTP fallback)
// Resend: just set RESEND_API_KEY in Vercel env vars
// Nodemailer: set EMAIL_USER + EMAIL_PASS (and optionally EMAIL_HOST, EMAIL_PORT)

const FROM_EMAIL = process.env.EMAIL_FROM || 'StudEx <noreply@studex-lac.vercel.app>';

async function sendViaResend(to, subject, html) {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Resend API error:', res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Resend send failed:', e.message);
    return false;
  }
}

let transporter = null;
async function getNodemailerTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  try {
    const nodemailer = (await import('nodemailer')).default;
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: parseInt(process.env.EMAIL_PORT || '587', 10) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    return transporter;
  } catch (e) {
    console.error('Failed to create nodemailer transporter:', e);
    return null;
  }
}

async function sendViaNodemailer(to, subject, html) {
  const transport = await getNodemailerTransporter();
  if (!transport) return false;
  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER ? `"StudEx" <${process.env.EMAIL_USER}>` : FROM_EMAIL,
      to, subject, html,
    });
    return true;
  } catch (e) {
    console.error('Nodemailer send failed:', e.message);
    return false;
  }
}

// Main send function: tries Resend first, then Nodemailer
async function sendEmail(to, subject, html) {
 // Try Resend first (simpler - just API key)
  if (process.env.RESEND_API_KEY) {
    const ok = await sendViaResend(to, subject, html);
    if (ok) return true;
  }
  // Fallback to Nodemailer (SMTP)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const ok = await sendViaNodemailer(to, subject, html);
    if (ok) return true;
  }
  return false;
}

export async function sendVerificationEmail(email, name, otpCode, verificationLink) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;"><h2 style="color:#6366f1;">Welcome to StudEx, ${name}!</h2><p>Please verify your email address to activate your account.</p><div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin:20px 0;"><p style="margin:0 0 8px;color:#64748b;font-size:14px;">Your verification code is:</p><span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#6366f1;">${otpCode}</span></div><p style="text-align:center;">— or —</p><p style="text-align:center;"><a href="${verificationLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">Verify Email</a></p><p style="color:#888;font-size:13px;">If the button doesn't work, copy and paste this link:<br/>${verificationLink}</p></div>`;
  return sendEmail(email, 'Verify your StudEx account', html);
}

export async function sendResetEmail(email, name, otpCode, resetLink) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;"><h2 style="color:#6366f1;">Password Reset Request</h2><p>Hi ${name}, we received a request to reset your password.</p><div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin:20px 0;"><p style="margin:0 0 8px;color:#64748b;font-size:14px;">Your reset code is:</p><span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#6366f1;">${otpCode}</span></div><p style="text-align:center;"><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">Reset Password</a></p><p style="color:#888;font-size:13px;">This code expires in 15 minutes. If you didn't request this, ignore this email.</p></div>`;
  return sendEmail(email, 'Reset your StudEx password', html);
}

export function hasEmailConfig() {
  return !!(process.env.RESEND_API_KEY || (process.env.EMAIL_USER && process.env.EMAIL_PASS));
}
