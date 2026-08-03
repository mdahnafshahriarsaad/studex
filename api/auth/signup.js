import { getDB, saveDB, hashPassword, generateOTP, generateGuardianCode, generateToken } from '../_lib/db.js';
import { sendVerificationEmail, hasEmailConfig } from '../_lib/email.js';

const BASE_URL = process.env.BASE_URL || 'https://studex-lac.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name, selectedClass } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDB();

    if (db.users[normalizedEmail]) {
      // If user already exists and is verified, reject
      if (db.users[normalizedEmail].isVerified) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
      // If unverified, allow re-registration (update)
    }

    const emailConfigured = hasEmailConfig();
    const verificationToken = generateToken();
    const otpCode = generateOTP();

    const newUser = {
      id: db.users[normalizedEmail]?.id || `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      isVerified: false, // Start unverified
      verificationToken,
      verificationOtp: emailConfigured ? otpCode : null,
      otpExpiresAt: emailConfigured ? Date.now() + 5 * 60 * 1000 : null,
      otpResendCount: 0,
      createdAt: db.users[normalizedEmail]?.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Auto-verify only if no email config (no way to send OTP)
    if (!emailConfigured) {
      newUser.isVerified = true;
    }

    const guardianPasscode = Math.floor(1000 + Math.random() * 9000).toString();
    const guardianCode = generateGuardianCode();

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
        xp: 150, level: 1, levelTitle: 'Beginner',
        currentStreak: 1, longestStreak: 1, totalStudyMinutes: 45, achievements: [],
      },
      studyHistory: [],
      guardian: {
        enabled: true,
        passcode: guardianPasscode,
        guardianCode,
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
    db.guardianCodes[guardianPasscode] = normalizedEmail;
    db.guardianCodes[guardianCode] = normalizedEmail;

    saveDB(db);

    // Send verification email if configured
    if (emailConfigured) {
      try {
        const verificationLink = `${BASE_URL}/?verifyToken=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
        const sent = await sendVerificationEmail(normalizedEmail, name.trim(), otpCode, verificationLink);
        if (!sent) {
          // Email failed to send — auto-verify so user isn't stuck
          console.warn('Email send failed, auto-verifying user');
          newUser.isVerified = true;
          newUser.verificationOtp = null;
          newUser.otpExpiresAt = null;
          saveDB(db);
        }
      } catch (emailErr) {
        console.warn('Email send error, auto-verifying:', emailErr.message);
        newUser.isVerified = true;
        newUser.verificationOtp = null;
        newUser.otpExpiresAt = null;
        saveDB(db);
      }
    }

    const response = {
      message: newUser.isVerified
        ? 'Account created successfully! You can now sign in.'
        : 'Account created! A verification code has been sent to your email.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isVerified: newUser.isVerified,
      },
      guardianCode,
    };

    return res.status(201).json(response);
  } catch (err) {
    console.error('Signup API error:', err);
    return res.status(500).json({ error: 'Server error during signup. Please try again.' });
  }
}
