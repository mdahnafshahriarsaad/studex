import { ClassLevel, SubjectItem, Chapter } from '../types';

export function calculateTotalPages(startPage: number, endPage: number): number {
  if (endPage < startPage) return 0;
  return endPage - startPage + 1;
}

export function getDefaultSubjectsForClass(selectedClass: ClassLevel): SubjectItem[] {
  let names: string[] = [];

  switch (selectedClass) {
    case 'Class 1':
    case 'Class 2':
      names = ['Bangla', 'English', 'Mathematics'];
      break;

    case 'Class 3':
    case 'Class 4':
    case 'Class 5':
      names = ['Bangla', 'English', 'Mathematics', 'Science', 'BGS', 'Religion'];
      break;

    case 'Class 6':
    case 'Class 7':
    case 'Class 8':
      names = [
        'Bangla 1st',
        'Bangla 2nd',
        'English 1st',
        'English 2nd',
        'Mathematics',
        'Science',
        'BGS',
        'Religion'
      ];
      break;

    case 'Class 9':
    case 'Class 10':
      names = [
        'Bangla 1st',
        'Bangla 2nd',
        'English 1st',
        'English 2nd',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'Higher Mathematics',
        'Religion',
        'BGS'
      ];
      break;

    default:
      names = ['Bangla', 'English', 'Mathematics'];
  }

  return names.map((name, idx) => {
    // Generate 2 sample chapters per subject for initial setup state
    const chapters: Chapter[] = [
      {
        id: `ch-1-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: 'Fundamentals & Concepts',
        startPage: 1,
        endPage: 12,
        totalPages: calculateTotalPages(1, 12), // 12 pages
        difficulty: 'Easy',
        completed: false,
      },
      {
        id: `ch-2-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: 'Advanced Dynamics',
        startPage: 13,
        endPage: 28,
        totalPages: calculateTotalPages(13, 28), // 16 pages
        difficulty: 'Medium',
        completed: false,
      }
    ];

    const totalPages = chapters.reduce((acc, c) => acc + c.totalPages, 0);

    return {
      id: `subj-${idx + 1}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name,
      order: idx + 1,
      chapters,
      totalChapters: chapters.length,
      completedChapters: 0,
      totalPages,
      completedPages: 0,
      remainingPages: totalPages,
      progressPercent: 0,
    };
  });
}
