import { UserProfile } from '../types';

export function generateGuardianPasscode(): string {
  const seg1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const seg2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `STDX-${seg1}-${seg2}`;
}

export interface DailyReportSummary {
  date: string;
  studentName: string;
  className: string;
  studyTimeFormatted: string;
  pagesCompletedToday: number;
  sessionsCount: number;
  overallProgressPercent: number;
  reportText: string;
}

export function generateDailyReportSummary(profile: UserProfile): DailyReportSummary {
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate today's study sessions
  const todaySessions = (profile.studyHistory || []).filter(
    (s) => s.timestamp.split('T')[0] === todayStr
  );

  const totalTodayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalTodayPages = todaySessions.reduce((sum, s) => sum + s.pagesCompleted, 0);

  const hours = Math.floor(totalTodayMinutes / 60);
  const mins = totalTodayMinutes % 60;
  const timeFormatted = `${hours}h ${mins}m`;

  const totalPages = profile.subjects.reduce((sum, s) => sum + (s.totalPages || 0), 0);
  const completedPages = profile.subjects.reduce((sum, s) => sum + (s.completedPages || 0), 0);
  const overallProgress = totalPages > 0 ? Math.min(100, Math.round((completedPages / totalPages) * 100)) : 0;

  const reportText = `STUDEX DAILY REPORT\nDate: ${todayStr}\nStudent: ${profile.name} (${profile.selectedClass})\n-----------------------------\nStudy Time: ${timeFormatted}\nPages Completed: ${totalTodayPages}\nSessions Completed: ${todaySessions.length}\nOverall Progress: ${overallProgress}%\nCurrent Streak: ${profile.gamification?.currentStreak || 1} Days`;

  return {
    date: todayStr,
    studentName: profile.name,
    className: profile.selectedClass,
    studyTimeFormatted: timeFormatted,
    pagesCompletedToday: totalTodayPages,
    sessionsCount: todaySessions.length,
    overallProgressPercent: overallProgress,
    reportText,
  };
}
