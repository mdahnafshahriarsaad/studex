import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db, isConfigured } from '../lib/firebase';

const STATS_DOC_PATH = 'app_stats/counters';

/**
 * Atomically increment the real user count in Firestore.
 * Called after a successful Firebase Auth signup (before sign-out).
 * Best-effort: silently fails if Firebase isn't configured or network is down.
 */
export async function incrementUserCount(): Promise<void> {
  if (!isConfigured) return;
  try {
    const statsRef = doc(db, 'app_stats', 'counters');
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(statsRef);
      const current = snap.exists() ? (snap.data().userCount ?? 0) : 0;
      transaction.set(statsRef, { userCount: current + 1, updatedAt: new Date().toISOString() }, { merge: true });
    });
  } catch (e) {
    // Best-effort — never block the signup flow
    console.warn('[stats] Failed to increment user count:', e);
  }
}

/**
 * Read the current real user count from Firestore.
 * Returns 0 if Firebase isn't configured or the document doesn't exist yet.
 */
export async function getUserCount(): Promise<number> {
  if (!isConfigured) return 0;
  try {
    const statsRef = doc(db, 'app_stats', 'counters');
    const snap = await getDoc(statsRef);
    if (!snap.exists()) return 0;
    return snap.data().userCount ?? 0;
  } catch (e) {
    console.warn('[stats] Failed to read user count:', e);
    return 0;
  }
}
