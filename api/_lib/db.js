import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

// Use Vercel persistent storage if available, otherwise /tmp
const DB_DIR = process.env.DB_DIR || '/tmp/studex';
const DB_FILE = join(DB_DIR, 'db.json');

const EMPTY_DB = { users: {}, profiles: {}, guardianCodes: {}, guardianLinks: {}, resetTokens: {} };

export function getDB() {
  try {
    if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
    if (!existsSync(DB_FILE)) {
      const initial = JSON.parse(JSON.stringify(EMPTY_DB));
      writeFileSync(DB_FILE, JSON.stringify(initial));
      return initial;
    }
    const data = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
    // Ensure all keys exist (forward compat)
    if (!data.users) data.users = {};
    if (!data.profiles) data.profiles = {};
    if (!data.guardianCodes) data.guardianCodes = {};
    if (!data.guardianLinks) data.guardianLinks = {};
    if (!data.resetTokens) data.resetTokens = {};
    return data;
  } catch (e) {
    console.error('DB read error:', e);
    return JSON.parse(JSON.stringify(EMPTY_DB));
  }
}

export function saveDB(db) {
  try {
    if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('DB write error:', e);
  }
}

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateGuardianCode() {
  const seg1 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const seg2 = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `STDX-${seg1}-${seg2}`;
}

export function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}