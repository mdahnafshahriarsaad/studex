export type ClassLevel = 
  | 'Class 1' | 'Class 2' | 'Class 3' | 'Class 4' | 'Class 5'
  | 'Class 6' | 'Class 7' | 'Class 8' | 'Class 9' | 'Class 10';

export type DailyStudyHours = '1 Hour' | '2 Hours' | '3 Hours' | string;

export type PreferredTime = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export type AnimationMode = 'OFF' | 'Balanced' | 'Full';

export type PerformanceMode = 'High Quality' | 'Balanced' | 'Performance Mode';

export type ChapterDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Chapter {
  id: string;
  name: string;
  startPage: number;
  endPage: number;
  totalPages: number; // Formula: endPage - startPage + 1
  completedPages?: number;
  difficulty: ChapterDifficulty;
  completed: boolean;
  completedAt?: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  order: number;
  chapters: Chapter[];
  totalChapters: number;
  completedChapters: number;
  totalPages: number;
  completedPages: number;
  remainingPages: number;
  progressPercent: number;
}

export interface ExamInfo {
  name: string;
  date: string;
}

export interface RevisionItem {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  dueDate: string;
  stage: 'Day 1' | 'Day 3' | 'Day 7';
  completed: boolean;
}

export interface DailyPlanItem {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  startPage: number;
  endPage: number;
  pagesToRead: number;
  estimatedMinutes: number;
  difficulty: ChapterDifficulty;
  completed: boolean;
}

export interface MissedTargetRecord {
  date: string;
  missedPages: number;
  extraPagesPerDay: number;
  daysRemaining: number;
}

export interface SubjectPriorityScore {
  subjectId: string;
  subjectName: string;
  score: number;
  reason: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GamificationStats {
  xp: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
  totalStudyMinutes: number;
  achievements: Achievement[];
}

export interface StudySessionRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  durationMinutes: number;
  pagesCompleted: number;
  difficultyFeedback: ChapterDifficulty;
  mood: string;
  notes?: string;
  timestamp: string;
}

export interface GuardianInfo {
  enabled: boolean;
  passcode: string;
  connectedGuardianName?: string;
  dailyReportEnabled: boolean;
}

export interface NotificationSettings {
  studyReminder: boolean;
  examReminder: boolean;
  guardianReport: boolean;
}

export interface UserProfile {
  name: string;
  avatar: string;
  selectedClass: ClassLevel;
  dailyStudyTime: DailyStudyHours;
  preferredStudyTime: PreferredTime;
  examInfo: ExamInfo;
  subjects: SubjectItem[];
  revisions: RevisionItem[];
  missedTargetRecovery: MissedTargetRecord | null;
  gamification: GamificationStats;
  studyHistory: StudySessionRecord[];
  guardian: GuardianInfo;
  setupCompleted: boolean;
  createdAt: string;
}

export type ThemeMode = 'AMOLED Dark' | 'Ocean Blue' | 'Light Mode' | 'Neo Green';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  selectedClass: ClassLevel;
  profile: UserProfile;
  settings: AppSettings;
  createdAt: string;
  lastLoginAt: string;
}

export type AuthMode = 'login' | 'signup' | 'forgot-password';

export interface AppSettings {
  theme: ThemeMode;
  animationMode: AnimationMode;
  performanceMode: PerformanceMode;
  notifications: NotificationSettings;
  language: 'English' | 'Bengali';
}
