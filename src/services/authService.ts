import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  reload,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isConfigured } from '../lib/firebase';
import { UserProfile, AppSettings, UserAccount } from '../types';
import { DEFAULT_USER_PROFILE, DEFAULT_APP_SETTINGS, saveUserProfile, saveAppSettings, getUserProfile, getAppSettings } from './storage';
import { getDefaultSubjectsForClass } from '../utils/subjectGenerator';

// Re-export for components
export { isConfigured } from '../lib/firebase';

// =============================================================
// FIREBASE AUTH SERVICE — REAL EMAIL VERIFICATION
// No fake OTPs. No localStorage users. No simulated sends.
// Firebase handles account creation, email sending, and
// verification status. We only check user.emailVerified.
// =============================================================

// ---- Persistent auth state listeners ----
type AuthStateListener = (user: User | null) => void;
const listeners: Set<AuthStateListener> = new Set();

/** Subscribe to Firebase auth state changes. Returns unsubscribe fn. */
export function onAuthChange(fn: AuthStateListener): () => void {
  listeners.add(fn);
  // If Firebase isn't configured, don't even try
  if (!isConfigured) return () => listeners.delete(fn);
  return onAuthStateChanged(auth, (firebaseUser) => {
    fn(firebaseUser);
  });
}

function notifyListeners(user: User | null) {
  listeners.forEach((fn) => fn(user));
}

// ---- Signup ----
/**
 * Creates account via Firebase, immediately sends verification email.
 * Firebase handles the actual email delivery — we never touch it.
 */
export async function registerAccountAsync(
  email: string,
  password: string,
  name: string,
  selectedClass: string
): Promise<{ message: string; needsVerification: boolean }> {
  if (!isConfigured) {
    throw new Error(
      'Firebase is not configured. Authentication is disabled until you add your Firebase project credentials.'
    );
  }

  if (!email.trim() || !password || !name.trim()) {
    throw new Error('Name, email, and password are required.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Create user in Firebase (this creates the account on Firebase servers)
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

  // 2. Update display name
  await updateProfile(credential.user, { displayName: name.trim() });

  // 3. Send REAL verification email from Firebase
  await sendEmailVerification(credential.user);

  // 4. Save initial profile locally (will be used after verification)
  const customProfile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    name: name.trim() || 'Student',
    selectedClass: (selectedClass as any) || 'Class 9',
    subjects: getDefaultSubjectsForClass((selectedClass as any) || 'Class 9'),
    setupCompleted: true,
  };
  saveUserProfile(customProfile);
  saveAppSettings(DEFAULT_APP_SETTINGS);

  // 5. Sign out immediately — user must verify email before first login
  await signOut(auth);

  return {
    message: `Verification email sent to ${normalizedEmail}. Please check your inbox and click the verification link before signing in.`,
    needsVerification: true,
  };
}

// ---- Login ----
/**
 * Signs in via Firebase, then reloads user to get fresh emailVerified.
 * If emailVerified is false → BLOCKS login. No exceptions.
 */
export async function loginAccountAsync(
  email: string,
  password: string
): Promise<{ user: User; profile: UserProfile; settings: AppSettings }> {
  if (!isConfigured) {
    throw new Error(
      'Firebase is not configured. Authentication is disabled until you add your Firebase project credentials.'
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Sign in with Firebase
  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);

  // 2. RELOAD to get latest emailVerified from Firebase servers
  await reload(credential.user);

  // 3. CHECK VERIFICATION — absolute gate
  if (!credential.user.emailVerified) {
    // Sign them out — not allowed in
    await signOut(auth);
    const err: any = new Error(
      'Your email has not been verified yet. Please check your inbox for the verification email from Firebase, then try again.'
    );
    err.unverified = true;
    err.email = normalizedEmail;
    throw err;
  }

  // 4. Load or create local profile for this user
  const uid = credential.user.uid;
  const profileKey = `studex_profile_${uid}`;
  const settingsKey = `studex_settings_${uid}`;

  let profile = getUserProfile(profileKey);
  let settings = getAppSettings(settingsKey);

  // First time login after verification — bootstrap defaults
  if (!profile.name || profile.name === 'Student') {
    profile = {
      ...DEFAULT_USER_PROFILE,
      name: credential.user.displayName || 'Student',
    };
    settings = DEFAULT_APP_SETTINGS;
  }

  saveUserProfile(profile, profileKey);
  saveAppSettings(settings, settingsKey);

  return { user: credential.user, profile, settings };
}

// ---- Logout ----
export async function logoutAccount(): Promise<void> {
  await signOut(auth);
  notifyListeners(null);
}

// ---- Resend Verification Email ----
export async function resendVerificationEmail(): Promise<string> {
  if (!isConfigured) {
    throw new Error('Firebase is not configured.');
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('No active session. Please sign up first.');
  }

  await reload(user);
  if (user.emailVerified) {
    throw new Error('Your email is already verified. You can sign in.');
  }

  await sendEmailVerification(user);
  return 'A new verification email has been sent. Please check your inbox.';
}

// ---- Forgot / Reset Password ----
export async function requestPasswordResetAsync(email: string): Promise<string> {
  if (!isConfigured) {
    throw new Error('Firebase is not configured.');
  }

  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  return 'If an account exists with this email, a password reset link has been sent.';
}

export async function changePasswordAsync(currentPassword: string, newPassword: string): Promise<string> {
  if (!isConfigured) {
    throw new Error('Firebase is not configured.');
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to change your password.');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  // Re-authenticate first (Firebase requires this for sensitive operations)
 const normalizedEmail = user.email!.toLowerCase();
  await signInWithEmailAndPassword(auth, normalizedEmail, currentPassword);

  // Now change the password
  await updatePassword(user, newPassword);
  return 'Password changed successfully.';
}

// ---- Current User Helpers ----
/** Get the current Firebase user (or null). */
export function getCurrentFirebaseUser(): User | null {
  return auth.currentUser;
}

/** Check if a user is currently signed in AND verified. */
export function isUserVerified(): boolean {
  return auth.currentUser?.emailVerified === true;
}

/** Get the current user's profile data from localStorage. */
export function getCurrentUserAccount(): { user: User; profile: UserProfile; settings: AppSettings } | null {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return null;

  const uid = user.uid;
  const profile = getUserProfile(`studex_profile_${uid}`);
  const settings = getAppSettings(`studex_settings_${uid}`);

  if (!profile) return null;

  return { user, profile, settings };
}

/** Save profile+settings (localStorage only, keyed by UID) and publish guardian data to Firestore. */
export function syncCurrentAccountData(profile: UserProfile, settings: AppSettings): void {
  const user = auth.currentUser;
  if (!user) return;

  const uid = user.uid;
  saveUserProfile(profile, `studex_profile_${uid}`);
  saveAppSettings(settings, `studex_settings_${uid}`);

  // Best-effort: publish guardian data to Firestore for cross-device access
  import('./guardianCloudService').then(({ publishGuardianData }) => {
    publishGuardianData(profile);
  });
}

// ---- Legacy compatibility shims ----
// These are kept so files that import them don't break.
// They no longer do anything meaningful.

export function getAuthToken(): string | null {
  // No more fake tokens. Firebase uses ID tokens internally.
  return null;
}

export function setAuthToken(_token: string | null): void {
  // No-op. Firebase manages tokens.
}

export function getCurrentSessionEmail(): string | null {
  return auth.currentUser?.email ?? null;
}

export function getAllAccounts(): Record<string, never> {
  // No more localStorage account database.
  return {};
}

// ---- Guardian functions (kept for GuardianPage) ----
// These are local-only utilities that don't depend on fake auth.

export function findAccountByGuardianCode(code: string): UserAccount | null {
  const cleanCode = code.trim().toUpperCase();
  const user = auth.currentUser;
  if (!user) return null;

  const uid = user.uid;
  const profile = getUserProfile(`studex_profile_${uid}`);
  if (!profile) return null;

  const guardianCode = profile?.guardian?.passcode?.toUpperCase();
  const fullGuardianCode = profile?.guardian?.guardianCode?.toUpperCase();

  if (
    (guardianCode && (guardianCode === cleanCode || `STUDEX-${guardianCode}` === cleanCode)) ||
    (fullGuardianCode && fullGuardianCode === cleanCode)
  ) {
    return {
      id: uid,
      email: user.email || '',
      name: profile.name,
      profile,
      settings: getAppSettings(`studex_settings_${uid}`),
      passwordHash: '',
      selectedClass: profile.selectedClass,
      createdAt: '',
      lastLoginAt: new Date().toISOString(),
    };
  }

  return null;
}

// Cross-device guardian lookup via Firestore
export async function lookupGuardianStudentAsync(code: string): Promise<{ student: any; profile: UserProfile } | null> {
  const { lookupGuardianByCode, reconstructProfileFromSnapshot } = await import('./guardianCloudService');
  const result = await lookupGuardianByCode(code);
  if (!result) return null;
  const profile = reconstructProfileFromSnapshot(result.snapshot);
  return { student: { name: result.studentName }, profile };
}

export async function connectGuardianAsync(
  code: string,
  guardianName: string,
  _guardianEmail?: string
): Promise<{ success: boolean; message: string; studentName?: string }> {
  const { lookupGuardianByCode } = await import('./guardianCloudService');
  const result = await lookupGuardianByCode(code);
  if (!result) {
    return { success: false, message: 'Invalid guardian code. Please check and try again.' };
  }
  return { success: true, message: `Connected to ${result.studentName}'s study dashboard.`, studentName: result.studentName };
}

export async function fetchGuardianDashboardAsync(code: string): Promise<{ profile: UserProfile } | null> {
  const { lookupGuardianByCode, reconstructProfileFromSnapshot } = await import('./guardianCloudService');
  const result = await lookupGuardianByCode(code);
  if (!result) return null;
  return { profile: reconstructProfileFromSnapshot(result.snapshot) };
}

// ---- Cross-tab sync (BroadcastChannel only, no fake backend) ----
const SYNC_CHANNEL_NAME = 'studex_cloud_sync_channel';
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
  const handler = (_event: MessageEvent) => {
    onSync();
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handler);
  }

  const storageHandler = (e: StorageEvent) => {
    if (e.key?.startsWith('studex_profile_') || e.key?.startsWith('studex_settings_')) {
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
