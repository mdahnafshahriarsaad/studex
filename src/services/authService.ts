import { UserAccount, UserProfile, AppSettings } from '../types';
import { DEFAULT_USER_PROFILE, DEFAULT_APP_SETTINGS, saveUserProfile, saveAppSettings } from './storage';
import { getDefaultSubjectsForClass } from '../utils/subjectGenerator';

const ACCOUNTS_STORAGE_KEY = 'studex_user_accounts_v1';
const CURRENT_SESSION_KEY = 'studex_current_session_email_v1';
const AUTH_TOKEN_KEY = 'studex_auth_token_v1';
const SYNC_CHANNEL_NAME = 'studex_cloud_sync_channel';

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
): Promise<{ message: string; user?: any; verificationLink?: string }> {
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
    };

    const newAccount: UserAccount = {
      id: data.user?.id || `usr-${Date.now()}`,
      email: normalizedEmail,
      name: name.trim() || 'Student',
      passwordHash: pass,
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
    // If backend is unreachable during client-side demo, handle with local simulation
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
      passwordHash: pass,
      selectedClass: selectedClass || 'Class 9',
      profile: customProfile,
      settings: DEFAULT_APP_SETTINGS,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    accounts[normalizedEmail] = newAccount;
    saveAccounts(accounts);
    // Local/offline mode — no real email server, skip verification requirement
    return {
      message: 'Account created successfully! You can now sign in.',
    };
  }
}

// EMAIL VERIFICATION ASYNC
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
    const syncRes = await fetch('/api/user/sync', {
      headers: { Authorization: `Bearer ${data.token}` },
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
        lastLoginAt: new Date().toISOString(),
      } as UserAccount;
      saveAccounts(accounts);

      return accounts[normalizedEmail];
    }
  } catch (backendErr: any) {
    if (backendErr.unverified) throw backendErr;
    console.warn('Backend login fallback to local:', backendErr.message);
  }

  // Fallback local check
  const accounts = getAllAccounts();
  const account = accounts[normalizedEmail];

  if (!account) {
    throw new Error('No account found with this email address.');
  }

  if (account.passwordHash !== pass) {
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

// RESET PASSWORD ASYNC
export async function resetPasswordAsync(email: string, newPass: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, newPassword: newPass }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed.');

    // Update local store as well
    const accounts = getAllAccounts();
    if (accounts[normalizedEmail]) {
      accounts[normalizedEmail].passwordHash = newPass;
      saveAccounts(accounts);
    }
    return true;
  } catch (err) {
    const accounts = getAllAccounts();
    const account = accounts[normalizedEmail];

    if (!account) {
      throw new Error('No account found with this email address.');
    }

    account.passwordHash = newPass;
    accounts[normalizedEmail] = account;
    saveAccounts(accounts);
    return true;
  }
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

  const token = getAuthToken();
  if (token) {
    try {
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profile, settings }),
      });
    } catch (err) {
      console.warn('Backend sync deferred:', err);
    }
  }
}

// Synchronous wrapper exports for compatibility
export function registerAccount(email: string, pass: string, name: string, selectedClass: any): UserAccount {
  registerAccountAsync(email, pass, name, selectedClass);
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getAllAccounts();
  return accounts[normalizedEmail];
}

export function loginAccount(email: string, pass: string): UserAccount {
  loginAccountAsync(email, pass);
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getAllAccounts();
  return accounts[normalizedEmail];
}

export function resetPassword(email: string, newPass: string): boolean {
  resetPasswordAsync(email, newPass);
  return true;
}

export function findAccountByGuardianCode(code: string): UserAccount | null {
  const cleanCode = code.trim().toUpperCase();
  const accounts = getAllAccounts();

  for (const email of Object.keys(accounts)) {
    const acc = accounts[email];
    const guardianCode = acc.profile?.guardian?.passcode?.toUpperCase();
    if (guardianCode && (guardianCode === cleanCode || `STUDEX-${guardianCode}` === cleanCode)) {
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
