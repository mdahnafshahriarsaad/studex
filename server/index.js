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

// Initialize persistent Database Store
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDB = { users: {}, profiles: {}, guardianCodes: {} };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
      return initialDB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
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

// 1. SIGNUP ENDPOINT
app.post('/api/auth/signup', (req, res) => {
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
    isVerified: false,
    verificationToken,
    verificationOtp: otpCode,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

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
      passcode: Math.floor(1000 + Math.random() * 9000).toString(),
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
  db.guardianCodes[defaultProfile.guardian.passcode] = normalizedEmail;

  saveDB(db);

  const verificationLink = `/?verifyToken=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;

  res.status(201).json({
    message: 'Account created! Please verify your email before continuing.',
    user: { id: newUser.id, name: newUser.name, email: newUser.email, isVerified: false },
    verificationToken,
    verificationLink,
    otpCode,
  });
});

// 2. VERIFY EMAIL ENDPOINT
app.post('/api/auth/verify-email', (req, res) => {
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

  if (!targetUserEmail || !db.users[targetUserEmail]) {
    return res.status(400).json({ error: 'Invalid or expired verification token.' });
  }

  db.users[targetUserEmail].isVerified = true;
  saveDB(db);

  res.json({ message: 'Email verified successfully! You can now log in.', verified: true });
});

// 3. LOGIN ENDPOINT
app.post('/api/auth/login', (req, res) => {
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

  // Enforce Email Verification requirement
  if (!user.isVerified) {
    const verificationLink = `/?verifyToken=${user.verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
    return res.status(403).json({
      error: 'Please verify your email before continuing.',
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
});

// 4. FORGOT & RESET PASSWORD ENDPOINT
app.post('/api/auth/forgot-password', (req, res) => {
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
});

// 5. USER MULTI-DEVICE DATA SYNC ENDPOINT
app.get('/api/user/sync', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized session.' });

  const db = loadDB();
  const userEmails = Object.keys(db.users);
  if (userEmails.length === 0) return res.status(404).json({ error: 'No user session active.' });

  const firstUserEmail = userEmails[0];
  const userProfile = db.profiles[firstUserEmail];

  res.json({
    profile: userProfile?.profile,
    settings: userProfile?.settings,
  });
});

app.post('/api/user/sync', (req, res) => {
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
});

// 6. GUARDIAN LOOKUP ENDPOINT
app.get('/api/guardian/lookup', (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Guardian code required.' });

  const cleanCode = code.toString().trim().toUpperCase().replace('STUDEX-GUARDIAN-', '');
  const db = loadDB();

  let targetEmail = db.guardianCodes[cleanCode];
  if (!targetEmail) {
    for (const em of Object.keys(db.profiles)) {
      const p = db.profiles[em]?.profile;
      if (p?.guardian?.passcode === cleanCode) {
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
});

app.listen(PORT, () => {
  console.log(`Studex Backend Server & Database running on http://localhost:${PORT}`);
});
