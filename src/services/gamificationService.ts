import { GamificationStats, Achievement } from '../types';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_session', title: 'First Study Session', description: 'Complete your first focus session', icon: '🚀', unlocked: false },
  { id: 'chapter_finish', title: 'Chapter Master', description: 'Complete your first syllabus chapter', icon: '📚', unlocked: false },
  { id: 'focus_master', title: 'Focus Master', description: 'Complete 5 full focus study sessions', icon: '⚡', unlocked: false },
  { id: 'streak_7', title: '7-Day Streak', description: 'Maintain a continuous 7-day study streak', icon: '🔥', unlocked: false },
  { id: 'syllabus_hero', title: 'Syllabus Hero', description: '100% complete a subject syllabus', icon: '🏆', unlocked: false },
];

export function getLevelTitle(level: number): string {
  switch (level) {
    case 1: return 'Beginner';
    case 2: return 'Consistent Learner';
    case 3: return 'Knowledge Seeker';
    case 4: return 'Academic Scholar';
    case 5: return 'Focused Learner';
    case 6: return 'Study Enthusiast';
    case 7: return 'Mind Master';
    case 8: return 'Academic Elite';
    case 9: return 'Genius Scholar';
    case 10: return 'Study Master';
    default: return 'Study Master';
  }
}

export function calculateLevelFromXP(xp: number): { level: number; title: string; currentLevelXP: number; nextLevelXP: number } {
  const thresholds = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];

  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  level = Math.min(10, level);
  const currentLevelXP = thresholds[level - 1] || 0;
  const nextLevelXP = thresholds[level] || 20000;
  const title = getLevelTitle(level);

  return {
    level,
    title,
    currentLevelXP,
    nextLevelXP,
  };
}

/**
 * Award XP and check streak & achievements
 */
export function addXPAndCheckAchievements(
  currentStats: GamificationStats,
  earnedXP: number,
  sessionDurationMins: number,
  isChapterCompleted: boolean = false,
  totalCompletedSessions: number = 1
): GamificationStats {
  const newXP = currentStats.xp + earnedXP;
  const newTotalMinutes = currentStats.totalStudyMinutes + sessionDurationMins;

  // Calculate Streak
  const todayStr = new Date().toISOString().split('T')[0];
  let newStreak = currentStats.currentStreak;
  let newLongest = currentStats.longestStreak;

  if (currentStats.lastStudyDate) {
    const lastDate = new Date(currentStats.lastStudyDate);
    const today = new Date(todayStr);
    const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1; // reset streak if day missed
    }
  } else {
    newStreak = 1;
  }

  newLongest = Math.max(newLongest, newStreak);

  const { level, title } = calculateLevelFromXP(newXP);

  // Check achievements
  const updatedAchievements = currentStats.achievements.map((ach) => {
    let unlock = ach.unlocked;

    if (ach.id === 'first_session' && totalCompletedSessions >= 1) unlock = true;
    if (ach.id === 'chapter_finish' && isChapterCompleted) unlock = true;
    if (ach.id === 'focus_master' && totalCompletedSessions >= 5) unlock = true;
    if (ach.id === 'streak_7' && newStreak >= 7) unlock = true;

    return {
      ...ach,
      unlocked: unlock,
      unlockedAt: unlock && !ach.unlocked ? new Date().toISOString() : ach.unlockedAt,
    };
  });

  return {
    xp: newXP,
    level,
    levelTitle: title,
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastStudyDate: todayStr,
    totalStudyMinutes: newTotalMinutes,
    achievements: updatedAchievements,
  };
}
