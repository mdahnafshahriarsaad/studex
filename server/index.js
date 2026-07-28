const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'studex_super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'studex.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite database:', err);
  } else {
    console.log('Connected to Studex SQLite database at:', dbPath);
  }
});

// Setup DB Tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      verified_status INTEGER DEFAULT 0,
      verification_token TEXT,
      reset_token TEXT,
      created_at TEXT NOT NULL,
      last_login TEXT
    )
  `);

  // Student Profiles table
  db.run(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY,
      selected_class TEXT,
      daily_study_time TEXT,
      preferred_study_time TEXT,
      avatar TEXT,
      exam_name TEXT,
      exam_date TEXT,
      gamification_json TEXT,
      revisions_json TEXT,
      missed_recovery_json TEXT,
      setup_completed INTEGER DEFAULT 1,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Subjects table
  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      order_idx INTEGER DEFAULT 0,
      progress_percent REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Chapters table
  db.run(`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      start_page INTEGER DEFAULT 1,
      end_page INTEGER DEFAULT 10,
      total_pages INTEGER DEFAULT 10,
      completed_pages INTEGER DEFAULT 0,
      difficulty TEXT DEFAULT 'Medium',
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Exams table
  db.run(`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exam_name TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Study Sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      subject_name TEXT,
      chapter_id TEXT,
      chapter_name TEXT,
      duration_minutes INTEGER NOT NULL,
      pages_completed INTEGER DEFAULT 0,
      difficulty_feedback TEXT,
      mood TEXT,
      notes TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Guardian Connections table
  db.run(`
    CREATE TABLE IF NOT EXISTS guardian_connections (
      user_id TEXT PRIMARY KEY,
      guardian_name TEXT,
      passcode TEXT,
      permission_status TEXT DEFAULT 'active',
      daily_report_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // App Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'AMOLED Dark',
      animation_mode TEXT DEFAULT 'Balanced',
      performance_mode TEXT DEFAULT 'High Quality',
      language TEXT DEFAULT 'English',
      notifications_json TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});

// Configure Nodemailer (falls back to console log verification link if SMTP is not configured)
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail(email, name, token) {
  const host = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${host}?verifyToken=${token}&email=${encodeURIComponent(email)}`;

  console.log('==================================================');
  console.log(`[STUDEX AUTH] Verification link for ${email}:`);
  console.log(verificationLink);
  console.log('==================================================');

  if (transporter) {
    try {
      await transporter.sendMail({
        from: '"Studex Academic Planner" <noreply@studex.edu>',
        to: email,
        subject: 'Verify your Studex Account',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; background: #000; border-radius: 12px;">
            <h2 style="color: #00f0ff;">Welcome to Studex, ${name}!</h2>
            <p style="color: #ccc;">Please click the button below to activate your account and access your academic planner:</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #00f0ff; color: #000; text-decoration: none; font-weight: bold; border-radius: 8px; margin: 16px 0;">Verify Email Address</a>
            <p style="color: #888; font-size: 12px;">Or copy and paste this link: ${verificationLink}</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Failed to send verification email via SMTP:', err.message);
    }
  }
  return verificationLink;
}

// ----------------------
// AUTHENTICATION ROUTES
// ----------------------

// Signup Endpoint
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name, selectedClass } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (row) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const verificationToken = jwt.sign({ userId, email: normalizedEmail }, JWT_SECRET, { expiresIn: '1d' });
    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO users (id, name, email, password_hash, verified_status, verification_token, created_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [userId, name.trim(), normalizedEmail, passwordHash, verificationToken, createdAt],
      async function (insertErr) {
        if (insertErr) return res.status(500).json({ error: 'Failed to create user record.' });

        // Initialize Student Profile
        db.run(
          `INSERT INTO student_profiles (user_id, selected_class, daily_study_time, preferred_study_time, avatar, setup_completed, updated_at)
           VALUES (?, ?, '2 Hours', 'Evening', '🎓', 1, ?)`,
          [userId, selectedClass || 'Class 9', createdAt]
        );

        // Initialize App Settings
        db.run(
          `INSERT INTO app_settings (user_id, theme, animation_mode, performance_mode, language, notifications_json)
           VALUES (?, 'AMOLED Dark', 'Balanced', 'High Quality', 'English', ?)`,
          [userId, JSON.stringify({ studyReminder: true, examReminder: true, guardianReport: true })]
        );

        // Send verification email link
        const verificationLink = await sendVerificationEmail(normalizedEmail, name.trim(), verificationToken);

        res.status(201).json({
          message: 'Account created! Please verify your email before continuing.',
          user: { id: userId, email: normalizedEmail, name: name.trim(), verified: false },
          verificationToken,
          verificationLink,
        });
      }
    );
  });
});

// Verify Email Endpoint
app.post('/api/auth/verify-email', (req, res) => {
  const { token, email } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const targetEmail = (email || decoded.email).toLowerCase();

    db.run(
      'UPDATE users SET verified_status = 1, verification_token = NULL WHERE email = ? OR id = ?',
      [targetEmail, decoded.userId],
      function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update verification status.' });
        if (this.changes === 0) return res.status(404).json({ error: 'User account not found.' });

        res.json({ message: 'Email verified successfully! You can now log in to Studex.' });
      }
    );
  } catch (err) {
    return res.status(400).json({ error: 'Invalid or expired verification token.' });
  }
});

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    if (!user.verified_status) {
      const verificationLink = await sendVerificationEmail(user.email, user.name, user.verification_token);
      return res.status(403).json({
        error: 'Please verify your email before continuing.',
        unverified: true,
        email: user.email,
        verificationToken: user.verification_token,
        verificationLink,
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const lastLogin = new Date().toISOString();

    db.run('UPDATE users SET last_login = ? WHERE id = ?', [lastLogin, user.id]);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: true,
        created_at: user.created_at,
      },
    });
  });
});

// Reset Password Endpoint
app.post('/api/auth/forgot-password', (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: 'Failed to reset password.' });
      res.json({ message: 'Password reset successfully! Please log in with your new password.' });
    });
  });
});

// ----------------------
// DATA SYNC ROUTES
// ----------------------

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

// Fetch Full Sync Data for Authenticated User
app.get('/api/user/sync', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.get('SELECT * FROM student_profiles WHERE user_id = ?', [userId], (err, profileRow) => {
    if (err) return res.status(500).json({ error: 'Error fetching profile.' });

    db.all('SELECT * FROM subjects WHERE user_id = ? ORDER BY order_idx ASC', [userId], (err, subjectRows) => {
      if (err) return res.status(500).json({ error: 'Error fetching subjects.' });

      db.all('SELECT * FROM chapters WHERE user_id = ?', [userId], (err, chapterRows) => {
        if (err) return res.status(500).json({ error: 'Error fetching chapters.' });

        db.get('SELECT * FROM app_settings WHERE user_id = ?', [userId], (err, settingsRow) => {
          if (err) return res.status(500).json({ error: 'Error fetching settings.' });

          db.all('SELECT * FROM study_sessions WHERE user_id = ? ORDER BY timestamp DESC', [userId], (err, sessionRows) => {
            db.get('SELECT * FROM guardian_connections WHERE user_id = ?', [userId], (err, guardianRow) => {
              // Format Subjects & Chapters
              const subjectsMap = (subjectRows || []).map((s) => {
                const chapters = (chapterRows || [])
                  .filter((c) => c.subject_id === s.id)
                  .map((c) => ({
                    id: c.id,
                    name: c.name,
                    startPage: c.start_page,
                    endPage: c.end_page,
                    totalPages: c.total_pages,
                    completedPages: c.completed_pages,
                    difficulty: c.difficulty,
                    completed: !!c.completed,
                    completedAt: c.completed_at,
                  }));

                return {
                  id: s.id,
                  name: s.name,
                  order: s.order_idx,
                  chapters,
                  totalChapters: chapters.length,
                  completedChapters: chapters.filter((c) => c.completed).length,
                  totalPages: chapters.reduce((acc, c) => acc + (c.totalPages || 0), 0),
                  completedPages: chapters.reduce((acc, c) => acc + (c.completed ? c.totalPages : 0), 0),
                  remainingPages: chapters.reduce((acc, c) => acc + (!c.completed ? c.totalPages : 0), 0),
                  progressPercent: chapters.length
                    ? Math.round((chapters.filter((c) => c.completed).length / chapters.length) * 100)
                    : 0,
                };
              });

              res.json({
                profile: {
                  selectedClass: profileRow?.selected_class || 'Class 9',
                  dailyStudyTime: profileRow?.daily_study_time || '2 Hours',
                  preferredStudyTime: profileRow?.preferred_study_time || 'Evening',
                  avatar: profileRow?.avatar || '🎓',
                  examInfo: {
                    name: profileRow?.exam_name || 'Annual Final Exam',
                    date: profileRow?.exam_date || '2026-11-15',
                  },
                  subjects: subjectsMap,
                  revisions: profileRow?.revisions_json ? JSON.parse(profileRow.revisions_json) : [],
                  missedTargetRecovery: profileRow?.missed_recovery_json ? JSON.parse(profileRow.missed_recovery_json) : null,
                  gamification: profileRow?.gamification_json
                    ? JSON.parse(profileRow.gamification_json)
                    : { xp: 150, level: 1, levelTitle: 'Novice Scholar', currentStreak: 1, longestStreak: 1, totalStudyMinutes: 60, achievements: [] },
                  studyHistory: (sessionRows || []).map((sess) => ({
                    id: sess.id,
                    subjectId: sess.subject_id,
                    subjectName: sess.subject_name,
                    chapterId: sess.chapter_id,
                    chapterName: sess.chapter_name,
                    durationMinutes: sess.duration_minutes,
                    pagesCompleted: sess.pages_completed,
                    difficultyFeedback: sess.difficulty_feedback,
                    mood: sess.mood,
                    notes: sess.notes,
                    timestamp: sess.timestamp,
                  })),
                  guardian: {
                    enabled: !!guardianRow?.passcode,
                    passcode: guardianRow?.passcode || 'PASS123',
                    connectedGuardianName: guardianRow?.guardian_name || undefined,
                    dailyReportEnabled: !!guardianRow?.daily_report_enabled,
                  },
                  setupCompleted: !!profileRow?.setup_completed,
                },
                settings: {
                  theme: settingsRow?.theme || 'AMOLED Dark',
                  animationMode: settingsRow?.animation_mode || 'Balanced',
                  performanceMode: settingsRow?.performance_mode || 'High Quality',
                  language: settingsRow?.language || 'English',
                  notifications: settingsRow?.notifications_json
                    ? JSON.parse(settingsRow.notifications_json)
                    : { studyReminder: true, examReminder: true, guardianReport: true },
                },
              });
            });
          });
        });
      });
    });
  });
});

// Save / Sync Data from Frontend to Database
app.post('/api/user/sync', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { profile, settings } = req.body;

  if (!profile && !settings) {
    return res.status(400).json({ error: 'Profile or settings required.' });
  }

  db.serialize(() => {
    if (profile) {
      db.run(
        `INSERT INTO student_profiles (user_id, selected_class, daily_study_time, preferred_study_time, avatar, exam_name, exam_date, gamification_json, revisions_json, missed_recovery_json, setup_completed, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
         selected_class = excluded.selected_class,
         daily_study_time = excluded.daily_study_time,
         preferred_study_time = excluded.preferred_study_time,
         avatar = excluded.avatar,
         exam_name = excluded.exam_name,
         exam_date = excluded.exam_date,
         gamification_json = excluded.gamification_json,
         revisions_json = excluded.revisions_json,
         missed_recovery_json = excluded.missed_recovery_json,
         setup_completed = excluded.setup_completed,
         updated_at = excluded.updated_at`,
        [
          userId,
          profile.selectedClass || 'Class 9',
          profile.dailyStudyTime || '2 Hours',
          profile.preferredStudyTime || 'Evening',
          profile.avatar || '🎓',
          profile.examInfo?.name || 'Annual Final Exam',
          profile.examInfo?.date || '2026-11-15',
          JSON.stringify(profile.gamification || {}),
          JSON.stringify(profile.revisions || []),
          JSON.stringify(profile.missedTargetRecovery || null),
          profile.setupCompleted ? 1 : 0,
          new Date().toISOString(),
        ]
      );

      // Replace subjects and chapters
      if (Array.isArray(profile.subjects)) {
        db.run('DELETE FROM chapters WHERE user_id = ?', [userId]);
        db.run('DELETE FROM subjects WHERE user_id = ?', [userId]);

        profile.subjects.forEach((subj, idx) => {
          db.run(
            `INSERT INTO subjects (id, user_id, name, order_idx, progress_percent) VALUES (?, ?, ?, ?, ?)`,
            [subj.id, userId, subj.name, idx, subj.progressPercent || 0]
          );

          if (Array.isArray(subj.chapters)) {
            subj.chapters.forEach((ch) => {
              db.run(
                `INSERT INTO chapters (id, subject_id, user_id, name, start_page, end_page, total_pages, completed_pages, difficulty, completed, completed_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  ch.id,
                  subj.id,
                  userId,
                  ch.name,
                  ch.startPage,
                  ch.endPage,
                  ch.totalPages,
                  ch.completedPages || 0,
                  ch.difficulty || 'Medium',
                  ch.completed ? 1 : 0,
                  ch.completedAt || null,
                ]
              );
            });
          }
        });
      }
    }

    if (settings) {
      db.run(
        `INSERT INTO app_settings (user_id, theme, animation_mode, performance_mode, language, notifications_json)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
         theme = excluded.theme,
         animation_mode = excluded.animation_mode,
         performance_mode = excluded.performance_mode,
         language = excluded.language,
         notifications_json = excluded.notifications_json`,
        [
          userId,
          settings.theme || 'AMOLED Dark',
          settings.animationMode || 'Balanced',
          settings.performanceMode || 'High Quality',
          settings.language || 'English',
          JSON.stringify(settings.notifications || {}),
        ]
      );
    }

    res.json({ message: 'User data synced successfully with Studex SQLite Database!' });
  });
});

app.listen(PORT, () => {
  console.log(`Studex Backend Server running on port ${PORT}`);
});
