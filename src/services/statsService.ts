import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db, isConfigured } from '../lib/firebase';

interface AppStats {
  emailSignups: number;
  guestSignups: number;
  updatedAt: string;
}

const EMPTY_STATS: AppStats = { emailSignups: 0, guestSignups: 0, updatedAt: '' };

/**
 * Atomically increment email signup count in Firestore.
 * Called after a successful Firebase Auth signup (before sign-out).
 */
export async function incrementEmailSignupCount(): Promise<void> {
  if (!isConfigured) return;
  try {
    const ref = doc(db, 'app_stats', 'counters');
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists() ? (snap.data() as AppStats) : EMPTY_STATS;
      tx.set(ref, {
        emailSignups: (data.emailSignups ?? 0) + 1,
        guestSignups: data.guestSignups ?? 0,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
  } catch (e) {
    console.warn('[stats] Failed to increment email count:', e);
  }
}

/**
 * Atomically increment guest (no-email) signup count in Firestore.
 * Called when a user completes setup without Firebase Auth.
 */
export async function incrementGuestSignupCount(): Promise<void> {
  if (!isConfigured) return;
  try {
    const ref = doc(db, 'app_stats', 'counters');
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists() ? (snap.data() as AppStats) : EMPTY_STATS;
      tx.set(ref, {
        emailSignups: data.emailSignups ?? 0,
        guestSignups: (data.guestSignups ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
  } catch (e) {
    console.warn('[stats] Failed to increment guest count:', e);
  }
}

/**
 * Read both counters from Firestore.
 */
export async function getUserCounts(): Promise<{ emailSignups: number; guestSignups: number }> {
  if (!isConfigured) return { emailSignups: 0, guestSignups: 0 };
  try {
    const ref = doc(db, 'app_stats', 'counters');
    const snap = await getDoc(ref);
    if (!snap.exists()) return { emailSignups: 0, guestSignups: 0 };
    const data = snap.data() as AppStats;
    return {
      emailSignups: data.emailSignups ?? 0,
      guestSignups: data.guestSignups ?? 0,
    };
  } catch (e) {
    console.warn('[stats] Failed to read user counts:', e);
    return { emailSignups: 0, guestSignups: 0 };
  }
}
