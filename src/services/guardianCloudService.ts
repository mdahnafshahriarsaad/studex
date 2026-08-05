import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isConfigured } from '../lib/firebase';
import { UserProfile } from '../types';

// =============================================================
// GUARDIAN CLOUD SERVICE — Firestore-based cross-device sharing
// =============================================================
//
// How it works:
// 1. Student publishes a snapshot of their profile to Firestore,
//    keyed by their guardian code (e.g. STDX-A1B2-C3D4).
// 2. Guardian on ANY device opens the link /guardian?code=STDX-...
// 3. The app reads the profile from Firestore — no login needed.
// 4. The collection is "guardian_links" with document ID = the code.
//
// Firestore Security Rules (must be set in Firebase Console):
//   rules_version = '2';
//   service cloud.firestore {
//     match /databases/{database}/documents {
//       match /guardian_links/{code} {
//         allow read: if true;                                    // Anyone with the code can read
//         allow write: if request.auth != null;                  // Only logged-in students can write
//       }
//     }
//   }
// =============================================================

const COLLECTION = 'guardian_links';

/** A stripped-down version of the profile safe for guardian viewing. */
interface GuardianSnapshot {
  studentName: string;
  studentClass: string;
  guardianCode: string;
  updatedAt: any; // Firestore timestamp
  subjects: Array<{
    id: string;
    name: string;
    completedChapters: number;
    chaptersCount: number;
    completedPages: number;
    totalPages: number;
    progressPercent: number;
  }>;
  studyHistory: Array<{
    timestamp: string;
    durationMinutes: number;
    pagesCompleted: number;
  }>;
  examInfo: { name: string; date: string };
  gamification: { currentStreak: number; longestStreak: number; totalStudyMinutes: number; xp: number; level: number; levelTitle: string };
}

/** Build a guardian-safe snapshot from the full profile. */
function buildSnapshot(profile: UserProfile, guardianCode: string): GuardianSnapshot {
  return {
    studentName: profile.name,
    studentClass: profile.selectedClass,
    guardianCode,
    updatedAt: serverTimestamp(),
    subjects: profile.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      completedChapters: s.completedChapters,
      chaptersCount: s.chapters?.length || 0,
      completedPages: s.completedPages,
      totalPages: s.totalPages,
      progressPercent: s.progressPercent,
    })),
    studyHistory: (profile.studyHistory || []).map((s) => ({
      timestamp: s.timestamp,
      durationMinutes: s.durationMinutes,
      pagesCompleted: s.pagesCompleted,
    })),
    examInfo: {
      name: profile.examInfo?.name || '',
      date: profile.examInfo?.date || '',
    },
    gamification: {
      currentStreak: profile.gamification?.currentStreak || 1,
      longestStreak: profile.gamification?.longestStreak || 1,
      totalStudyMinutes: profile.gamification?.totalStudyMinutes || 0,
      xp: profile.gamification?.xp || 0,
      level: profile.gamification?.level || 1,
      levelTitle: profile.gamification?.levelTitle || 'Beginner',
    },
  };
}

/**
 * Publish (or update) the student's guardian data to Firestore.
 * Called automatically when the student's profile is saved.
 */
export async function publishGuardianData(profile: UserProfile): Promise<void> {
  if (!isConfigured) return;

  const code = profile.guardian?.guardianCode || profile.guardian?.passcode;
  if (!code) return;

  const cleanCode = code.trim().toUpperCase();
  const snapshot = buildSnapshot(profile, cleanCode);

  try {
    const ref = doc(db, COLLECTION, cleanCode);
    await setDoc(ref, snapshot, { merge: true });
  } catch (err) {
    // Silent fail — guardian cloud is best-effort, don't block the student
    console.warn('[GuardianCloud] Failed to publish:', err);
  }
}

/**
 * Look up a student's data by guardian code. Works from ANY device.
 * No Firebase auth required to read (governed by Firestore rules).
 */
export async function lookupGuardianByCode(
  code: string
): Promise<{ studentName: string; snapshot: GuardianSnapshot } | null> {
  if (!isConfigured) return null;

  const cleanCode = code.trim().toUpperCase();

  try {
    const ref = doc(db, COLLECTION, cleanCode);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data() as GuardianSnapshot;
    return {
      studentName: data.studentName,
      snapshot: data,
    };
  } catch (err) {
    console.warn('[GuardianCloud] Lookup failed:', err);
    return null;
  }
}

/**
 * Reconstruct a minimal UserProfile from a GuardianSnapshot
 * so the existing GuardianPage dashboard renders without changes.
 */
export function reconstructProfileFromSnapshot(snap: GuardianSnapshot): UserProfile {
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = (snap.studyHistory || []).filter(
    (s) => s.timestamp.split('T')[0] === todayStr
  );
  const totalTodayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    name: snap.studentName,
    avatar: '🎓',
    selectedClass: snap.studentClass as any,
    dailyStudyTime: '2 Hours',
    preferredStudyTime: 'Evening',
    examInfo: { name: snap.examInfo.name, date: snap.examInfo.date },
    subjects: snap.subjects.map((s, idx) => ({
      id: s.id,
      name: s.name,
      order: idx,
      chapters: [],
      totalChapters: s.chaptersCount,
      completedChapters: s.completedChapters,
      totalPages: s.totalPages,
      completedPages: s.completedPages,
      remainingPages: Math.max(0, s.totalPages - s.completedPages),
      progressPercent: s.progressPercent,
    })),
    revisions: [],
    missedTargetRecovery: null,
    gamification: {
      xp: snap.gamification.xp,
      level: snap.gamification.level,
      levelTitle: snap.gamification.levelTitle,
      currentStreak: snap.gamification.currentStreak,
      longestStreak: snap.gamification.longestStreak,
      lastStudyDate: todaySessions.length > 0 ? todayStr : '',
      totalStudyMinutes: snap.gamification.totalStudyMinutes,
      achievements: [],
    },
    studyHistory: todaySessions.map((s, i) => ({
      id: `sess-${i}`,
      subjectId: '',
      subjectName: '',
      chapterId: '',
      chapterName: '',
      durationMinutes: s.durationMinutes,
      pagesCompleted: s.pagesCompleted,
      difficultyFeedback: 'Medium' as const,
      mood: 'Neutral',
      timestamp: s.timestamp,
    })),
    guardian: { enabled: true, passcode: '', dailyReportEnabled: true },
    setupCompleted: true,
    createdAt: '',
  };
}
