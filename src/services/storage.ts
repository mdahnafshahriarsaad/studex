import { UserProfile, AppSettings } from '../types';
import { getDefaultSubjectsForClass } from '../utils/subjectGenerator';
import { INITIAL_ACHIEVEMENTS, calculateLevelFromXP } from '../services/gamificationService';
import { generateGuardianPasscode } from '../services/guardianService';

const STORAGE_KEYS = {
  USER_PROFILE: 'studex_user_profile_v3',
  APP_SETTINGS: 'studex_app_settings_v3',
};

const defaultExamDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const defaultGamification = {
  xp: 150,
  level: 1,
  levelTitle: 'Beginner',
  currentStreak: 1,
  longestStreak: 1,
  lastStudyDate: new Date().toISOString().split('T')[0],
  totalStudyMinutes: 45,
  achievements: INITIAL_ACHIEVEMENTS,
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Saad',
  avatar: '🎓',
  selectedClass: 'Class 9',
  dailyStudyTime: '2 Hours',
  preferredStudyTime: 'Evening',
  examInfo: {
    name: 'Half Yearly Examination',
    date: defaultExamDate,
  },
  subjects: getDefaultSubjectsForClass('Class 9'),
  revisions: [],
  missedTargetRecovery: null,
  gamification: defaultGamification,
  studyHistory: [],
  guardian: {
    enabled: false,
    passcode: generateGuardianPasscode(),
    dailyReportEnabled: true,
  },
  setupCompleted: false,
  createdAt: new Date().toISOString(),
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'AMOLED Dark',
  animationMode: 'Balanced',
  performanceMode: 'High Quality',
  notifications: {
    studyReminder: true,
    examReminder: true,
    guardianReport: true,
  },
  language: 'English',
};

export function getUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!data) return DEFAULT_USER_PROFILE;
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_USER_PROFILE,
      ...parsed,
      gamification: { ...defaultGamification, ...(parsed.gamification || {}) },
      guardian: { ...DEFAULT_USER_PROFILE.guardian, ...(parsed.guardian || {}) },
    };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving user profile:', e);
  }
}

export function getAppSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (!data) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(data);
    // Migrate old themes to new ones
    if (parsed.theme === 'Midnight Blue') parsed.theme = 'Ocean Blue';
    if (parsed.theme === 'Light Glass' || parsed.theme === 'Minimal White' || parsed.theme === 'Soft Sage Glass' || parsed.theme === 'Midnight Card') parsed.theme = 'Light Mode';
    return parsed;
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving app settings:', e);
  }
}
