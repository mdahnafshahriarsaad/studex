import { RevisionItem, Chapter, SubjectItem } from '../types';

/**
 * Generate 3 revision schedule items (Day 1, Day 3, Day 7) when a chapter is marked completed.
 */
export function generateRevisionSchedule(subject: SubjectItem, chapter: Chapter): RevisionItem[] {
  const now = new Date();

  const addDays = (days: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: `rev-d1-${chapter.id}`,
      subjectId: subject.id,
      subjectName: subject.name,
      chapterId: chapter.id,
      chapterName: chapter.name,
      dueDate: addDays(1),
      stage: 'Day 1',
      completed: false,
    },
    {
      id: `rev-d3-${chapter.id}`,
      subjectId: subject.id,
      subjectName: subject.name,
      chapterId: chapter.id,
      chapterName: chapter.name,
      dueDate: addDays(3),
      stage: 'Day 3',
      completed: false,
    },
    {
      id: `rev-d7-${chapter.id}`,
      subjectId: subject.id,
      subjectName: subject.name,
      chapterId: chapter.id,
      chapterName: chapter.name,
      dueDate: addDays(7),
      stage: 'Day 7',
      completed: false,
    },
  ];
}
