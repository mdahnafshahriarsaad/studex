const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'studex_database.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Pre-seeded demo user
const DEMO_EMAIL = 'student@studex.edu';
const DEMO_PASS = '123456';
const DEMO_PASS_HASH = crypto.createHash('sha256').update(DEMO_PASS).digest('hex');

// Initialize persistent Database Store
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDB = { users: {}, profiles: {}, guardianCodes: {} };
      
      // Create default demo user (pre-verified)
      const demoUser = {
        id: 'usr-demo-101',
        name: 'Saad Rahman',
        email: DEMO_EMAIL,
        passwordHash: DEMO_PASS_HASH,
        isVerified: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      
      const demoProfile = {
        name: 'Saad Rahman',
        avatar: '🎓',
        selectedClass: 'Class 9',
        dailyStudyTime: '2 Hours',
        preferredStudyTime: 'Evening',
        examInfo: {
          name: 'Half Yearly Examination',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        subjects: [],
        revisions: [],
        missedTargetRecovery: null,
        gamification: {
          xp: 250,
          level: 2,
          levelTitle: 'Scholar',
          currentStreak: 3,
          longestStreak: 5,
          totalStudyMinutes: 120,
          achievements: [],
        },
        studyHistory: [],
        guardian: {
          enabled: true,
          passcode: generateSTDXCode(),
          dailyReportEnabled: true,
        },
        setupCompleted: true,
        createdAt: new Date().toISOString(),
      };

      const demoSettings = {
        theme: 'AMOLED Dark',
        animationMode: 'Balanced',
        performanceMode: 'High Quality',
        notifications: { studyReminder: true, examReminder: true, guardianReport: true },
        language: 'English',
      };

      initialDB.users[DEMO_EMAIL] = demoUser;
      initialDB.profiles[DEMO_EMAIL] = { profile: demoProfile, settings: demoSettings };
      initialDB.guardianCodes[demoProfile.guardian.passcode] = DEMO_EMAIL;

      fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
      return initialDB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.users) parsed.users = {};
    if (!parsed.profiles) parsed.profiles = {};
    if (!parsed.guardianCodes) parsed.guardianCodes = {};

    // Ensure demo user exists
    if (!parsed.users[DEMO_EMAIL]) {
      parsed.users[DEMO_EMAIL] = {
        id: 'usr-demo-101',
        name: 'Saad Rahman',
        email: DEMO_EMAIL,
        passwordHash: DEMO_PASS_HASH,
        isVerified: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }

    return parsed;
  } catch (err) {
    console.error('Error reading database file:', err);
    return { users: {}, profiles: {}, guardianCodes: {} };
  }
}

function saveDB(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// Generate STDX-XXXX-XXXX format guardian code
function generateSTDXCode() {
  const seg1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const seg2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `STDX-${seg1}-${seg2}`;
}

// Email sender (using nodemailer if SMTP env vars set, otherwise logs the link)
async function sendVerificationEmail(email, verificationLink) {
  // Try to use nodemailer if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"Studex" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify Your Studex Account',
        html: `
          <div style="background:#000;color:#fff;padding:40px;font-family:Inter,sans-serif;">
            <div style="text-align:center;margin-bottom:30px;">
              <h1 style="color:#00F0FF;">STUDEX</h1>
              <p style="color:#888;">Smart Academic Planner</p>
            </div>
            <h2 style="margin-bottom:10px;">Verify Your Email</h2>
            <p style="color:#aaa;">Click the button below to verify your Studex account:</p>
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
      });
      console.log(`Verification email sent to ${email}`);
      return true;
    } catch (mailErr) {
      console.error('Failed to send email via SMTP:', mailErr.message);
      console.log(`[EMAIL_FALLBACK] Verification link for ${email}: ${verificationLink}`);
      return false;
    }
  }
  
  // No SMTP configured — log the link for development
  console.log(`[EMAIL_FALLBACK] Verification link for ${email}: ${verificationLink}`);
  return false;
}

// 1. SIGNUP ENDPOINT
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, selectedClass } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = loadDB();

    if (db.users[normalizedEmail]) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const verificationToken = crypto.randomBytes(24).toString('hex');
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
      isVerified: false, // Require email verification
      verificationToken,
      verificationOtp: otpCode,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const guardianCode = generateSTDXCode();

    const defaultProfile = {
      name: name.trim(),
      avatar: '🎓',
      selectedClass: selectedClass || 'Class 9',
      dailyStudyTime: '2 Hours',
      preferredStudyTime: 'Evening',
      examInfo: {
        name: 'Half Yearly Examination',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      subjects: [],
      revisions: [],
      missedTargetRecovery: null,
      gamification: {
        xp: 150,
        level: 1,
        levelTitle: 'Beginner',
        currentStreak: 1,
        longestStreak: 1,
        totalStudyMinutes: 45,
        achievements: [],
      },
      studyHistory: [],
      guardian: {
        enabled: true,
        passcode: guardianCode,
        dailyReportEnabled: true,
      },
      setupCompleted: true,
      createdAt: new Date().toISOString(),
    };

    const defaultSettings = {
      theme: 'AMOLED Dark',
      animationMode: 'Balanced',
      performanceMode: 'High Quality',
      notifications: { studyReminder: true, examReminder: true, guardianReport: true },
      language: 'English',
    };

    db.users[normalizedEmail] = newUser;
    db.profiles[normalizedEmail] = { profile: defaultProfile, settings: defaultSettings };
    db.guardianCodes[guardianCode] = normalizedEmail;

    saveDB(db);

    const verificationLink = `/?verifyToken=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Attempt to send verification email
    await sendVerificationEmail(normalizedEmail, verificationLink);

    res.status(201).json({
      message: 'Account created! Please check your email to verify your account before signing in.',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, isVerified: false },
      verificationToken,
      verificationLink,
      otpCode,
    });
  } catch (err) {
    console.error('Signup API error:', err);
    res.status(500).json({ error: 'Server error during signup. Please try again.' });
  }
});

// 2. VERIFY EMAIL ENDPOINT
app.post('/api/auth/verify-email', (req, res) => {
  try {
    const { token, email } = req.body;
    const db = loadDB();

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

    if (targetUserEmail && db.users[targetUserEmail]) {
      db.users[targetUserEmail].isVerified = true;
      delete db.users[targetUserEmail].verificationToken;
      saveDB(db);
      return res.json({ message: 'Email verified successfully! You can now log in.', verified: true });
    }

    return res.status(400).json({ error: 'Invalid or expired verification link.' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// 3. LOGIN ENDPOINT
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = loadDB();
    const user = db.users[normalizedEmail];

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const hashed = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash !== hashed && user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    // CHECK VERIFICATION STATUS — gate login if not verified
    if (!user.isVerified) {
      const verificationLink = `/?verifyToken=${user.verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
      return res.status(403).json({
        error: 'Please verify your email before signing in.',
        unverified: true,
        email: normalizedEmail,
        verificationLink,
      });
    }

    user.lastLoginAt = new Date().toISOString();
    saveDB(db);

    const token = `token-${user.id}-${Date.now()}`;
    const userProfile = db.profiles[normalizedEmail] || {};

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, isVerified: true },
      profile: userProfile.profile,
      settings: userProfile.settings,
    });
  } catch (err) {
    console.error('Login API error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// 4. FORGOT & RESET PASSWORD ENDPOINT
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = loadDB();
    const user = db.users[normalizedEmail];

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    user.passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    saveDB(db);

    res.json({ message: 'Password reset successfully! Please log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// 5. USER MULTI-DEVICE DATA SYNC ENDPOINT
app.get('/api/user/sync', (req, res) => {
  try {
    const db = loadDB();
    const userEmails = Object.keys(db.users);
    if (userEmails.length === 0) {
      return res.json({ profile: null, settings: null });
    }

    const firstUserEmail = userEmails[0];
    const userProfile = db.profiles[firstUserEmail];

    res.json({
      profile: userProfile?.profile || null,
      settings: userProfile?.settings || null,
    });
  } catch (err) {
    res.json({ profile: null, settings: null });
  }
});

app.post('/api/user/sync', (req, res) => {
  try {
    const { profile, settings } = req.body;
    const db = loadDB();

    const userEmails = Object.keys(db.users);
    if (userEmails.length > 0) {
      const targetEmail = userEmails[userEmails.length - 1];
      db.profiles[targetEmail] = { profile, settings };
      if (profile?.guardian?.passcode) {
        db.guardianCodes[profile.guardian.passcode] = targetEmail;
      }
      saveDB(db);
    }

    res.json({ message: 'Data synced successfully to backend database.' });
  } catch (err) {
    res.json({ message: 'Local data saved.' });
  }
});

// 6. GUARDIAN LOOKUP ENDPOINT
app.get('/api/guardian/lookup', (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Guardian code required.' });

    const cleanCode = code.toString().trim().toUpperCase();
    const db = loadDB();

    let targetEmail = db.guardianCodes[cleanCode];
    if (!targetEmail) {
      for (const em of Object.keys(db.profiles)) {
        const p = db.profiles[em]?.profile;
        if (p?.guardian?.passcode && p.guardian.passcode.toUpperCase() === cleanCode) {
          targetEmail = em;
          break;
        }
      }
    }

    if (!targetEmail || !db.profiles[targetEmail]) {
      return res.status(404).json({ error: 'No student account found for this Guardian Code.' });
    }

    res.json({
      student: db.users[targetEmail],
      profile: db.profiles[targetEmail].profile,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error processing Guardian lookup.' });
  }
});

// Global Fallback Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error.' });
});

app.listen(PORT, () => {
  console.log(`Studex Backend Server & Database running on http://localhost:${PORT}`);
});
