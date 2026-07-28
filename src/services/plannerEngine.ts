import {
  SubjectItem, Chapter, ExamInfo, DailyPlanItem, SubjectPriorityScore, MissedTargetRecord
} from '../types';

/**
 * Calculate total pages formula: Ending Page - Starting Page + 1
 */
export function calculateTotalPages(startPage: number, endPage: number): number {
  if (endPage < startPage) return 0;
  return endPage - startPage + 1;
}

/**
 * Recalculate subject summary fields
 */
export function recalculateSubjectStats(subject: SubjectItem): SubjectItem {
  const totalPages = subject.chapters.reduce((sum, ch) => sum + ch.totalPages, 0);
  const completedPages = subject.chapters.reduce((sum, ch) => {
    if (ch.completed) return sum + ch.totalPages;
    return sum + (ch.completedPages || 0);
  }, 0);
  const remainingPages = Math.max(0, totalPages - completedPages);
  const progressPercent = totalPages > 0 ? Math.min(100, Math.round((completedPages / totalPages) * 100)) : 0;
  const completedChapters = subject.chapters.filter((ch) => ch.completed).length;

  return {
    ...subject,
    totalChapters: subject.chapters.length,
    completedChapters,
    totalPages,
    completedPages,
    remainingPages,
    progressPercent,
  };
}

/**
 * Calculate remaining days to exam date
 */
export function calculateRemainingDays(examDateStr?: string): number {
  if (!examDateStr) return 30; // default fallback if missing
  const examTime = new Date(examDateStr).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((examTime - now) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * DAILY TARGET FORMULA:
 * Remaining Pages ÷ Remaining Days (Always Round UP with Math.ceil)
 * Example: 4.3 pages -> 5 pages. Never round down.
 */
export function calculateDailyPageTarget(
  totalRemainingPages: number,
  examDateStr?: string,
  missedRecovery?: MissedTargetRecord | null
): { baseTarget: number; extraRecovery: number; totalDailyTarget: number; daysRemaining: number } {
  const daysRemaining = calculateRemainingDays(examDateStr);
  // CRITICAL REQUIREMENT: Math.ceil (Round UP always)
  const baseTarget = Math.ceil(totalRemainingPages / daysRemaining);

  let extraRecovery = 0;
  if (missedRecovery && missedRecovery.daysRemaining > 0) {
    extraRecovery = missedRecovery.extraPagesPerDay;
  }

  const totalDailyTarget = baseTarget + extraRecovery;

  return {
    baseTarget,
    extraRecovery,
    totalDailyTarget,
    daysRemaining,
  };
}

/**
 * SUBJECT PRIORITY ALGORITHM:
 * Ranks subjects by (1) Closest exam, (2) Lowest progress %, (3) Chapter difficulty, (4) Remaining pages
 */
export function calculateSubjectPriorities(
  subjects: SubjectItem[],
  examInfo?: ExamInfo
): SubjectPriorityScore[] {
  const daysRemaining = calculateRemainingDays(examInfo?.date);

  const scores: SubjectPriorityScore[] = subjects.map((subj) => {
    const stat = recalculateSubjectStats(subj);
    if (stat.remainingPages === 0) {
      return {
        subjectId: stat.id,
        subjectName: stat.name,
        score: -1,
        reason: 'Syllabus 100% completed!',
      };
    }

    // Factors
    const examUrgencyFactor = (100 / daysRemaining) * 3.0; // Higher weight if exam is close
    const lowProgressFactor = (100 - stat.progressPercent) * 2.5; // Higher weight for lower completion

    const totalChapters = stat.chapters.length || 1;
    const hardnessScore = stat.chapters.reduce((acc, ch) => {
      if (ch.difficulty === 'Hard') return acc + 3;
      if (ch.difficulty === 'Medium') return acc + 2;
      return acc + 1;
    }, 0) / totalChapters;
    const hardnessFactor = hardnessScore * 15;

    const volumeFactor = Math.min(50, stat.remainingPages * 0.5);
    const totalScore = examUrgencyFactor + lowProgressFactor + hardnessFactor + volumeFactor;

    const reasons: string[] = [];
    if (daysRemaining <= 30) reasons.push(`Exam in ${daysRemaining} days`);
    if (stat.progressPercent < 40) reasons.push(`Low completion (${stat.progressPercent}%)`);
    if (stat.chapters.some((c) => c.difficulty === 'Hard' && !c.completed)) reasons.push('Contains hard chapters');
    reasons.push(`${stat.remainingPages} pages remaining`);

    return {
      subjectId: stat.id,
      subjectName: stat.name,
      score: Math.round(totalScore),
      reason: `${stat.name}: ${reasons.join(' • ')}`,
    };
  });

  return scores.sort((a, b) => b.score - a.score);
}

/**
 * DAILY STUDY ROUTINE GENERATOR (MULTI-SUBJECT ROUTINE: 5 SUBJECTS DEFAULT):
 * Distributes today's target across up to 5 active subjects every single day.
 */
export function generateDailyStudyPlan(
  subjects: SubjectItem[],
  examInfo?: ExamInfo,
  missedRecovery?: MissedTargetRecord | null,
  maxSubjectsCount: number = 5
): DailyPlanItem[] {
  const daysRemaining = calculateRemainingDays(examInfo?.date);
  const prioritized = calculateSubjectPriorities(subjects, examInfo).filter((p) => p.score > 0);

  if (prioritized.length === 0) return [];

  // Pick up to 5 subjects for today's routine
  const selectedSubjectsPrio = prioritized.slice(0, maxSubjectsCount);
  const planItems: DailyPlanItem[] = [];

  for (const prio of selectedSubjectsPrio) {
    const subj = subjects.find((s) => s.id === prio.subjectId);
    if (!subj) continue;

    const stat = recalculateSubjectStats(subj);
    if (stat.remainingPages === 0) continue;

    // Daily target for this specific subject rounded UP (Math.ceil)
    const subjectDailyPageTarget = Math.ceil(stat.remainingPages / daysRemaining);

    // Find first incomplete chapter
    const activeChapter = subj.chapters.find((c) => !c.completed);
    if (!activeChapter) continue;

    const chapterRemainingPages = activeChapter.totalPages - (activeChapter.completedPages || 0);
    const pagesForThisItem = Math.max(1, Math.min(chapterRemainingPages, subjectDailyPageTarget));

    // Time per page based on difficulty: Easy = 3m, Medium = 5m, Hard = 8m
    const minPerPage = activeChapter.difficulty === 'Easy' ? 3 : activeChapter.difficulty === 'Medium' ? 5 : 8;
    const estMinutes = pagesForThisItem * minPerPage;

    const startPage = activeChapter.startPage + (activeChapter.completedPages || 0);
    const endPage = startPage + pagesForThisItem - 1;

    planItems.push({
      id: `plan-${subj.id}-${activeChapter.id}`,
      subjectId: subj.id,
      subjectName: subj.name,
      chapterId: activeChapter.id,
      chapterName: activeChapter.name,
      startPage,
      endPage,
      pagesToRead: pagesForThisItem,
      estimatedMinutes: estMinutes,
      difficulty: activeChapter.difficulty,
      completed: false,
    });
  }

  return planItems;
}

/**
 * FULL SYLLABUS COMPLETION ROUTINE ROADMAP:
 * Calculates comprehensive exam preparation roadmap for ALL subjects and chapters.
 */
export function generateCompleteSyllabusRoadmap(
  subjects: SubjectItem[],
  examInfo?: ExamInfo
) {
  const daysRemaining = calculateRemainingDays(examInfo?.date);

  const updatedSubjects = subjects.map(recalculateSubjectStats);

  const totalPages = updatedSubjects.reduce((sum, s) => sum + s.totalPages, 0);
  const completedPages = updatedSubjects.reduce((sum, s) => sum + s.completedPages, 0);
  const remainingPages = Math.max(0, totalPages - completedPages);
  const overallProgressPercent = totalPages > 0 ? Math.min(100, Math.round((completedPages / totalPages) * 100)) : 0;

  const totalChapters = updatedSubjects.reduce((sum, s) => sum + s.totalChapters, 0);
  const completedChapters = updatedSubjects.reduce((sum, s) => sum + s.completedChapters, 0);

  const subjectRoadmaps = updatedSubjects.map((s) => {
    // Math.ceil algorithm for subject daily target
    const dailyPageTarget = s.remainingPages > 0 ? Math.ceil(s.remainingPages / daysRemaining) : 0;
    return {
      subjectId: s.id,
      subjectName: s.name,
      totalChapters: s.totalChapters,
      completedChapters: s.completedChapters,
      totalPages: s.totalPages,
      completedPages: s.completedPages,
      remainingPages: s.remainingPages,
      progressPercent: s.progressPercent,
      dailyPageTarget,
      chapters: s.chapters,
    };
  });

  return {
    totalSubjects: updatedSubjects.length,
    totalChapters,
    completedChapters,
    totalPages,
    completedPages,
    remainingPages,
    overallProgressPercent,
    daysRemaining,
    overallDailyPageTarget: Math.ceil(remainingPages / daysRemaining),
    subjectRoadmaps,
  };
}

/**
 * MISSED TARGET RECOVERY:
 * Spreads missed pages across next 5 days without overloading a single day.
 */
export function calculateMissedTargetRecovery(missedPages: number): MissedTargetRecord {
  const extraPagesPerDay = Math.ceil(missedPages / 5);
  return {
    date: new Date().toISOString().split('T')[0],
    missedPages,
    extraPagesPerDay,
    daysRemaining: 5,
  };
}
