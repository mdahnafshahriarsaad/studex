import { useState, useEffect } from 'react';
import { UserProfile, AppSettings, AnimationMode, SubjectItem, Chapter, ChapterDifficulty, RevisionItem, ClassLevel } from '../types';
import { getUserProfile, saveUserProfile, getAppSettings, saveAppSettings } from '../services/storage';
import { calculateTotalPages, recalculateSubjectStats, calculateMissedTargetRecovery } from '../services/plannerEngine';
import { generateRevisionSchedule } from '../services/revisionService';
import { syncCurrentAccountData, subscribeToCloudSync, getCurrentUserAccount } from '../services/authService';
import { getSyllabusForClass } from '../utils/subjectGenerator';

export function useUserStore() {
  const [profile, setProfileState] = useState<UserProfile>(() => {
    const p = getUserProfile();
    const updatedSubjects = p.subjects.map((s, idx) => ({
      ...recalculateSubjectStats(s),
      order: s.order ?? idx,
    }));
    return { ...p, subjects: updatedSubjects, revisions: p.revisions || [] };
  });

  const [settings, setSettingsState] = useState<AppSettings>(getAppSettings);

  useEffect(() => {
    saveUserProfile(profile);
    syncCurrentAccountData(profile, settings);
  }, [profile]);

  useEffect(() => {
    saveAppSettings(settings);
    syncCurrentAccountData(profile, settings);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-lang', settings.language || 'English');
      document.body.classList.toggle('lang-bengali', settings.language === 'Bengali');
    }
  }, [settings]);

  // Subscribe to automatic cross-device / multi-tab cloud sync updates
  useEffect(() => {
    const unsubscribe = subscribeToCloudSync(() => {
      const acc = getCurrentUserAccount();
      if (acc) {
        if (acc.profile) setProfileState(acc.profile);
        if (acc.settings) setSettingsState(acc.settings);
      } else {
        const freshProfile = getUserProfile();
        setProfileState(freshProfile);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfileState((prev) => ({ ...prev, ...updates }));
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...updates }));
  };

  const setAnimationMode = (mode: AnimationMode) => {
    updateSettings({ animationMode: mode });
  };

  // SUBJECT OPERATIONS
  const addSubject = (name: string) => {
    if (!name.trim()) return;
    const newSubject: SubjectItem = recalculateSubjectStats({
      id: `subj-${Date.now()}`,
      name: name.trim(),
      order: profile.subjects.length,
      chapters: [],
      totalChapters: 0,
      completedChapters: 0,
      totalPages: 0,
      completedPages: 0,
      remainingPages: 0,
      progressPercent: 0,
    });
    updateProfile({ subjects: [...profile.subjects, newSubject] });
  };

  const editSubject = (subjectId: string, newName: string) => {
    if (!newName.trim()) return;
    const updatedSubjects = profile.subjects.map((s) => (s.id === subjectId ? { ...s, name: newName.trim() } : s));
    updateProfile({ subjects: updatedSubjects });
  };

  const removeSubject = (subjectId: string) => {
    // Deep delete: also clean related revisions and study history
    const chapterIds = new Set(
      profile.subjects.find((s) => s.id === subjectId)?.chapters.map((c) => c.id) || []
    );
    updateProfile({
      subjects: profile.subjects.filter((s) => s.id !== subjectId),
      revisions: (profile.revisions || []).filter((r) => r.subjectId !== subjectId),
      studyHistory: (profile.studyHistory || []).filter(
        (h) => h.subjectId !== subjectId && !chapterIds.has(h.chapterId)
      ),
    });
  };

  const reorderSubjects = (subjectId: string, direction: 'up' | 'down') => {
    const list = [...profile.subjects].sort((a, b) => a.order - b.order);
    const index = list.findIndex((s) => s.id === subjectId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const tempOrder = list[index].order;
    list[index].order = list[targetIndex].order;
    list[targetIndex].order = tempOrder;

    updateProfile({ subjects: list.sort((a, b) => a.order - b.order) });
  };

  // CHAPTER OPERATIONS
  const addChapterToSubject = (
    subjectId: string,
    chapterName: string,
    startPage: number,
    endPage: number,
    difficulty: ChapterDifficulty
  ) => {
    const totalPages = calculateTotalPages(startPage, endPage);
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      name: chapterName.trim() || 'Untitled Chapter',
      startPage,
      endPage,
      totalPages,
      difficulty,
      completed: false,
    };

    const updatedSubjects = profile.subjects.map((subj) => {
      if (subj.id === subjectId) {
        const updatedChapters = [...subj.chapters, newChapter];
        return recalculateSubjectStats({ ...subj, chapters: updatedChapters });
      }
      return subj;
    });

    updateProfile({ subjects: updatedSubjects });
  };

  const removeChapterFromSubject = (subjectId: string, chapterId: string) => {
    const updatedSubjects = profile.subjects.map((subj) => {
      if (subj.id === subjectId) {
        const updatedChapters = subj.chapters.filter((c) => c.id !== chapterId);
        return recalculateSubjectStats({ ...subj, chapters: updatedChapters });
      }
      return subj;
    });
    // Also clean related revisions and study history
    updateProfile({
      subjects: updatedSubjects,
      revisions: (profile.revisions || []).filter((r) => r.chapterId !== chapterId),
      studyHistory: (profile.studyHistory || []).filter((h) => h.chapterId !== chapterId),
    });
  };

  const editChapterInSubject = (
    subjectId: string,
    chapterId: string,
    updates: { name?: string; startPage?: number; endPage?: number; difficulty?: ChapterDifficulty }
  ) => {
    const updatedSubjects = profile.subjects.map((subj) => {
      if (subj.id === subjectId) {
        const updatedChapters = subj.chapters.map((ch) => {
          if (ch.id === chapterId) {
            const sp = updates.startPage ?? ch.startPage;
            const ep = updates.endPage ?? ch.endPage;
            return {
              ...ch,
              name: updates.name ?? ch.name,
              startPage: sp,
              endPage: ep,
              totalPages: calculateTotalPages(sp, ep),
              difficulty: updates.difficulty ?? ch.difficulty,
            };
          }
          return ch;
        });
        return recalculateSubjectStats({ ...subj, chapters: updatedChapters });
      }
      return subj;
    });
    updateProfile({ subjects: updatedSubjects });
  };

  const reorderChapters = (subjectId: string, chapterId: string, direction: 'up' | 'down') => {
    const updatedSubjects = profile.subjects.map((subj) => {
      if (subj.id === subjectId) {
        const chapters = [...subj.chapters];
        const index = chapters.findIndex((c) => c.id === chapterId);
        if (index === -1) return subj;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= chapters.length) return subj;
        const temp = chapters[index];
        chapters[index] = chapters[targetIndex];
        chapters[targetIndex] = temp;
        return recalculateSubjectStats({ ...subj, chapters });
      }
      return subj;
    });
    updateProfile({ subjects: updatedSubjects });
  };

  const toggleChapterComplete = (subjectId: string, chapterId: string) => {
    let newRevisions: RevisionItem[] = [];

    const updatedSubjects = profile.subjects.map((subj) => {
      if (subj.id === subjectId) {
        const updatedChapters = subj.chapters.map((ch) => {
          if (ch.id === chapterId) {
            const nextState = !ch.completed;
            if (nextState) {
              newRevisions = generateRevisionSchedule(subj, { ...ch, completed: true });
            }
            return {
              ...ch,
              completed: nextState,
              completedAt: nextState ? new Date().toISOString() : undefined,
            };
          }
          return ch;
        });

        return recalculateSubjectStats({ ...subj, chapters: updatedChapters });
      }
      return subj;
    });

    updateProfile({
      subjects: updatedSubjects,
      revisions: [...(profile.revisions || []), ...newRevisions],
    });
  };

  // SYLLABUS OPERATIONS
  const replaceSyllabus = (newClass: ClassLevel) => {
    const newSubjects = getSyllabusForClass(newClass).map((s, idx) => ({
      ...s,
      id: `subj-${Date.now()}-${idx}`,
      order: idx + 1,
      chapters: s.chapters.map((ch, ci) => ({
        ...ch,
        id: `ch-${Date.now()}-${idx}-${ci}`,
        completed: false,
        completedAt: undefined,
      })),
    }));
    updateProfile({
      selectedClass: newClass,
      subjects: newSubjects,
      revisions: [],
    });
  };

  // REVISION OPERATIONS
  const toggleRevisionComplete = (revisionId: string) => {
    const updatedRevisions = (profile.revisions || []).map((rev) =>
      rev.id === revisionId ? { ...rev, completed: !rev.completed } : rev
    );
    updateProfile({ revisions: updatedRevisions });
  };

  // MISSED TARGET RECOVERY OPERATOR
  const triggerMissedRecovery = (missedPages: number) => {
    const record = calculateMissedTargetRecovery(missedPages);
    updateProfile({ missedTargetRecovery: record });
  };

  const resetSetup = () => {
    setProfileState((prev) => ({
      ...prev,
      setupCompleted: false,
    }));
  };

  return {
    profile,
    settings,
    updateProfile,
    updateSettings,
    setAnimationMode,
    addSubject,
    editSubject,
    removeSubject,
    reorderSubjects,
    addChapterToSubject,
    removeChapterFromSubject,
    editChapterInSubject,
    reorderChapters,
    toggleChapterComplete,
    replaceSyllabus,
    toggleRevisionComplete,
    triggerMissedRecovery,
    resetSetup,
  };
}
