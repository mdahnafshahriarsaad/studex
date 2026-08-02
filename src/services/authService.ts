import { UserAccount, UserProfile, AppSettings } from '../types';
import { DEFAULT_USER_PROFILE, DEFAULT_APP_SETTINGS, saveUserProfile, saveAppSettings } from './storage';
import { getDefaultSubjectsForClass } from '../utils/subjectGenerator';

const ACCOUNTS_STORAGE_KEY = 'studex_user_accounts_v1';
const CURRENT_SESSION_KEY = 'studex_current_session_email_v1';
const AUTH_TOKEN_KEY = 'studex_auth_token_v1';
const SYNC_CHANNEL_NAME = 'studex_cloud_sync_channel';

// Simple hash for local password storage (deterministic, no crypto dependency)
function hashLocal(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex string with salt for basic obfuscation
  const salted = 'studex_' + String(hash) + '_' + password.length;
  let hex = '';
  for (let i = 0; i < salted.length; i++) {
    const c = salted.charCodeAt(i);
    hex += ((c & 0xff) < 16 ? '0' : '') + (c & 0xff).toString(16);
  }
  return hex;
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to set auth token:', e);
  }
}

export function getAllAccounts(): Record<string, UserAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Record<string, UserAccount>): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    broadcastSync('ACCOUNTS_UPDATED');
  } catch (e) {
    console.error('Failed to save accounts database:', e);
  }
}

export function getCurrentSessionEmail(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  } catch {
    return null;
  }
}

export function getCurrentUserAccount(): UserAccount | null {
  const email = getCurrentSessionEmail();
  if (!email) return null;
  const accounts = getAllAccounts();
  return accounts[email.toLowerCase()] || null;
}

// REGISTER NEW USER ACCOUNT (ASYNC BACKEND + FALLBACK)
export async function registerAccountAsync(
  email: string,
  pass: string,
  name: string,
  selectedClass: any
): Promise<{ message: string; user?: any; verificationLink?: string; guardianCode?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password: pass, name: name.trim(), selectedClass }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register account.');
    }

    // Also update local store
    const customProfile: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      name: name.trim() || 'Student',
      selectedClass: selectedClass || 'Class 9',
      subjects: getDefaultSubjectsForClass(selectedClass || 'Class 9'),
      setupCompleted: true,
      guardian: {
        enabled: true,
        passcode: data.guardianCode || DEFAULT_USER_PROFILE.guardian.passcode,
        guardianCode: data.guardianCode || '',
        dailyReportEnabled: true,
      },
    };

    const newAccount: UserAccount = {
      id: data.user?.id || `usr-${Date.now()}`,
      email: normalizedEmail,
      name: name.trim() || 'Student',
      passwordHash: hashLocal(pass),
      selectedClass: selectedClass || 'Class 9',
      profile: customProfile,
      settings: DEFAULT_APP_SETTINGS,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const accounts = getAllAccounts();
    accounts[normalizedEmail] = newAccount;
    saveAccounts(accounts);

    return data;
  } catch (backendErr: any) {
    // If backend is unreachable, fallback to localStorage-only mode
    console.warn('Backend unavailable, fallback to local register:', backendErr.message);
    const accounts = getAllAccounts();
    if (accounts[normalizedEmail]) {
      throw new Error('An account with this email already exists.');
    }

    const customProfile: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      name: name.trim() || 'Student',
      selectedClass: selectedClass || 'Class 9',
      subjects: getDefaultSubjectsForClass(selectedClass || 'Class 9'),
      setupCompleted: true,
    };

    const newAccount: UserAccount = {
      id: `usr-${Date.now()}`,
      email: normalizedEmail,
      name: name.trim() || 'Student',
      passwordHash: hashLocal(pass),
      selectedClass: selectedClass || 'Class 9',
      profile: customProfile,
      settings: DEFAULT_APP_SETTINGS,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    accounts[normalizedEmail] = newAccount;
    saveAccounts(accounts);
    return {
      message: 'Account created! You can now sign in.',
    };
  }
}

// VERIFY EMAIL VIA TOKEN (link click)
export async function verifyEmailAsync(token: string, email?: string): Promise<string> {
  try {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed.');
    return data.message || 'Email verified successfully!';
  } catch (err: any) {
    if (token === 'demo_token' && email) {
      return 'Email verified successfully!';
    }
    throw new Error(err.message || 'Failed to verify email.');
  }
}

// VERIFY EMAIL VIA OTP CODE
export async function verifyOtpAsync(email: string, otp: string): Promise<{ verified: boolean; message: string }> {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OTP verification failed.');
    return { verified: data.verified, message: data.message || 'Email verified successfully!' };
  } catch (err: any) {
    throw new Error(err.message || 'Failed to verify OTP.');
  }
}

// RESEND VERIFICATION OTP
export async function resendOtpAsync(email: string): Promise<{ message: string; resendCount?: number }> {
  try {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resend OTP.');
    return { message: data.message, resendCount: data.resendCount };
  } catch (err: any) {
    throw new Error(err.message || 'Failed to resend verification code.');
  }
}

// REQUEST PASSWORD RESET (sends email with OTP)
export async function requestPasswordResetAsync(email: string): Promise<string> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset request failed.');
    return data.message || 'If an account exists, a reset code has been sent.';
  } catch (err: any) {
    throw new Error(err.message || 'Failed to request password reset.');
  }
}

// RESET PASSWORD WITH TOKEN/OTP
export async function resetPasswordAsync(
  email: string,
  newPassword: string,
  token?: string,
  otp?: string
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, newPassword, token, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed.');

    // Update local store as well
    const accounts = getAllAccounts();
    if (accounts[normalizedEmail]) {
      accounts[normalizedEmail].passwordHash = hashLocal(newPassword);
      saveAccounts(accounts);
    }
    return data.message || 'Password reset successfully!';
  } catch (err: any) {
    // Fallback: update local password directly
    const accounts = getAllAccounts();
    const account = accounts[normalizedEmail];
    if (!account) {
      throw new Error('No account found with this email address.');
    }
    account.passwordHash = hashLocal(newPassword);
    accounts[normalizedEmail] = account;
    saveAccounts(accounts);
    return 'Password reset successfully!';
  }
}

// LOGIN USER ASYNC
export async function loginAccountAsync(email: string, pass: string): Promise<UserAccount> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password: pass }),
    });

    const data = await res.json();

    if (!res.ok) {
      // If backend DB is empty (ephemeral /tmp), fall back to local auth
      if (data.localFallback) {
        console.warn('Backend DB empty, using local auth fallback.');
        throw new Error('LOCAL_FALLBACK');
      }
      if (data.unverified) {
        const errorMsg: any = new Error(data.error || 'Please verify your email before continuing.');
        errorMsg.unverified = true;
        errorMsg.verificationLink = data.verificationLink;
        errorMsg.email = data.email;
        throw errorMsg;
      }
      throw new Error(data.error || 'Login failed.');
    }

    setAuthToken(data.token);
    setCurrentSession(normalizedEmail);

    // Fetch initial backend synced state
    try {
      const syncRes = await fetch('/api/user/sync', {
        headers: { 'X-Auth-Email': normalizedEmail },
      });
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.profile) saveUserProfile(syncData.profile);
        if (syncData.settings) saveAppSettings(syncData.settings);

        const accounts = getAllAccounts();
        const existing = accounts[normalizedEmail] || {};
        accounts[normalizedEmail] = {
          ...existing,
          id: data.user.id,
          email: normalizedEmail,
          name: data.user.name,
          profile: syncData.profile || existing.profile,
          settings: syncData.settings || existing.settings,
          passwordHash: hashLocal(pass),
          lastLoginAt: new Date().toISOString(),
        } as UserAccount;
        saveAccounts(accounts);

        return accounts[normalizedEmail];
      }
    } catch (syncErr) {
      console.warn('Backend sync failed, using local data:', syncErr);
    }

    // Fallback: update local account from login response
    const accounts = getAllAccounts();
    const existing = accounts[normalizedEmail] || {};
    accounts[normalizedEmail] = {
      ...existing,
      id: data.user.id,
      email: normalizedEmail,
      name: data.user.name,
      passwordHash: hashLocal(pass),
      lastLoginAt: new Date().toISOString(),
    } as UserAccount;
    saveAccounts(accounts);
    return accounts[normalizedEmail];
  } catch (backendErr: any) {
    if (backendErr.unverified) throw backendErr;
    // LOCAL_FALLBACK or any other backend error → use localStorage auth
    console.warn('Backend login fallback to local:', backendErr.message);
  }

  // Fallback local check
  const accounts = getAllAccounts();
  const account = accounts[normalizedEmail];

  if (!account) {
    throw new Error('No account found with this email address.');
  }

  if (account.passwordHash !== hashLocal(pass)) {
    throw new Error('Invalid password. Please check your credentials.');
  }

  account.lastLoginAt = new Date().toISOString();
  accounts[normalizedEmail] = account;
  saveAccounts(accounts);

  setCurrentSession(normalizedEmail);
  saveUserProfile(account.profile);
  saveAppSettings(account.settings);

  return account;
}

// LOGOUT
export function logoutAccount(): void {
  try {
    setAuthToken(null);
    localStorage.removeItem(CURRENT_SESSION_KEY);
    broadcastSync('LOGOUT');
  } catch (e) {
    console.error('Logout error:', e);
  }
}

function setCurrentSession(email: string): void {
  localStorage.setItem(CURRENT_SESSION_KEY, email);
  broadcastSync('LOGIN');
}

// SYNC CURRENT USER STATE TO BACKEND DATABASE
export async function syncCurrentAccountData(profile: UserProfile, settings: AppSettings): Promise<void> {
  const email = getCurrentSessionEmail();
  if (!email) return;

  const accounts = getAllAccounts();
  if (accounts[email.toLowerCase()]) {
    accounts[email.toLowerCase()].profile = profile;
    accounts[email.toLowerCase()].settings = settings;
    saveAccounts(accounts);
  }

  try {
    await fetch('/api/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Email': email.toLowerCase(),
      },
      body: JSON.stringify({ profile, settings, email: email.toLowerCase() }),
    });
  } catch (err) {
    console.warn('Backend sync deferred:', err);
  }
}

// GUARDIAN: Lookup student by code (backend)
export async function lookupGuardianStudentAsync(code: string): Promise<{ student: any; profile: UserProfile } | null> {
  try {
    const res = await fetch(`/api/guardian/lookup?code=${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// GUARDIAN: Connect guardian to student (backend)
export async function connectGuardianAsync(code: string, guardianName: string, guardianEmail?: string): Promise<{ success: boolean; message: string; studentName?: string }> {
  try {
    const res = await fetch('/api/guardian/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, guardianName, guardianEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Guardian connection failed.');
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to connect as guardian.');
  }
}

// GUARDIAN: Fetch dashboard data for a connected guardian
export async function fetchGuardianDashboardAsync(code: string): Promise<any> {
  try {
    const res = await fetch(`/api/guardian/dashboard/${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Local guardian code lookup (fallback)
export function findAccountByGuardianCode(code: string): UserAccount | null {
  const cleanCode = code.trim().toUpperCase();
  const accounts = getAllAccounts();

  for (const email of Object.keys(accounts)) {
    const acc = accounts[email];
    const guardianCode = acc.profile?.guardian?.passcode?.toUpperCase();
    const fullGuardianCode = acc.profile?.guardian?.guardianCode?.toUpperCase();
    if (
      (guardianCode && (guardianCode === cleanCode || `STUDEX-${guardianCode}` === cleanCode)) ||
      (fullGuardianCode && (fullGuardianCode === cleanCode || fullGuardianCode === `STDX-${cleanCode.replace(/^STDX-/, '')}`))
    ) {
      return acc;
    }
  }
  return null;
}

let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch {
  syncChannel = null;
}

function broadcastSync(type: string) {
  if (syncChannel) {
    syncChannel.postMessage({ type, timestamp: Date.now() });
  }
}

export function subscribeToCloudSync(onSync: () => void): () => void {
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type) {
      onSync();
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handler);
  }

  const storageHandler = (e: StorageEvent) => {
    if (e.key === ACCOUNTS_STORAGE_KEY || e.key === CURRENT_SESSION_KEY) {
      onSync();
    }
  };

  window.addEventListener('storage', storageHandler);

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handler);
    }
    window.removeEventListener('storage', storageHandler);
  };
}
