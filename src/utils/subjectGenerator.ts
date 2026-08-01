import { ClassLevel, SubjectItem, Chapter } from '../types';

export function calculateTotalPages(startPage: number, endPage: number): number {
  if (endPage < startPage) return 0;
  return endPage - startPage + 1;
}

// ─── Class 5 Detailed Syllabus (National Curriculum, Bangladesh) ────────────────

const CLASS5_BANGLA: Chapter[] = [
  { id: 'c5-bn-1', name: 'Probad & Anubad (Prose & Translation)', startPage: 1, endPage: 25, totalPages: 25, difficulty: 'Easy', completed: false },
  { id: 'c5-bn-2', name: 'Kobita (Poetry)', startPage: 26, endPage: 45, totalPages: 20, difficulty: 'Medium', completed: false },
  { id: 'c5-bn-3', name: 'Banan o Byakaran (Grammar & Sentence)', startPage: 46, endPage: 70, totalPages: 25, difficulty: 'Medium', completed: false },
  { id: 'c5-bn-4', name: 'Nibondho o Lekha (Essay & Writing)', startPage: 71, endPage: 88, totalPages: 18, difficulty: 'Hard', completed: false },
  { id: 'c5-bn-5', name: 'Sahitto Ocharon (Literature Appreciation)', startPage: 89, endPage: 105, totalPages: 17, difficulty: 'Medium', completed: false },
];

const CLASS5_ENGLISH: Chapter[] = [
  { id: 'c5-en-1', name: 'Reading Comprehension (Seen)', startPage: 1, endPage: 22, totalPages: 22, difficulty: 'Easy', completed: false },
  { id: 'c5-en-2', name: 'Reading Comprehension (Unseen)', startPage: 23, endPage: 40, totalPages: 18, difficulty: 'Medium', completed: false },
  { id: 'c5-en-3', name: 'Grammar & Vocabulary', startPage: 41, endPage: 62, totalPages: 22, difficulty: 'Medium', completed: false },
  { id: 'c5-en-4', name: 'Paragraph & Letter Writing', startPage: 63, endPage: 78, totalPages: 16, difficulty: 'Hard', completed: false },
  { id: 'c5-en-5', name: 'Story & Essay Writing', startPage: 79, endPage: 95, totalPages: 17, difficulty: 'Hard', completed: false },
];

const CLASS5_MATH: Chapter[] = [
  { id: 'c5-mth-1', name: 'Number System & Operations', startPage: 1, endPage: 20, totalPages: 20, difficulty: 'Easy', completed: false },
  { id: 'c5-mth-2', name: 'Fractions & Decimals', startPage: 21, endPage: 42, totalPages: 22, difficulty: 'Medium', completed: false },
  { id: 'c5-mth-3', name: 'Measurement (Length, Weight, Time)', startPage: 43, endPage: 58, totalPages: 16, difficulty: 'Easy', completed: false },
  { id: 'c5-mth-4', name: 'Geometry & Shapes', startPage: 59, endPage: 78, totalPages: 20, difficulty: 'Medium', completed: false },
  { id: 'c5-mth-5', name: 'Data Handling & Patterns', startPage: 79, endPage: 92, totalPages: 14, difficulty: 'Medium', completed: false },
  { id: 'c5-mth-6', name: 'Algebraic Expressions', startPage: 93, endPage: 110, totalPages: 18, difficulty: 'Hard', completed: false },
];

const CLASS5_SCIENCE: Chapter[] = [
  { id: 'c5-sci-1', name: 'Our Body & Health', startPage: 1, endPage: 18, totalPages: 18, difficulty: 'Easy', completed: false },
  { id: 'c5-sci-2', name: 'Light & Sound', startPage: 19, endPage: 38, totalPages: 20, difficulty: 'Medium', completed: false },
  { id: 'c5-sci-3', name: 'Force & Simple Machines', startPage: 39, endPage: 56, totalPages: 18, difficulty: 'Medium', completed: false },
  { id: 'c5-sci-4', name: 'Living World & Ecosystem', startPage: 57, endPage: 75, totalPages: 19, difficulty: 'Easy', completed: false },
  { id: 'c5-sci-5', name: 'Earth, Weather & Climate', startPage: 76, endPage: 92, totalPages: 17, difficulty: 'Medium', completed: false },
  { id: 'c5-sci-6', name: 'Matter & Materials', startPage: 93, endPage: 108, totalPages: 16, difficulty: 'Hard', completed: false },
];

const CLASS5_BGS: Chapter[] = [
  { id: 'c5-bgs-1', name: 'History of Bangladesh', startPage: 1, endPage: 22, totalPages: 22, difficulty: 'Easy', completed: false },
  { id: 'c5-bgs-2', name: 'Geography of Bangladesh', startPage: 23, endPage: 42, totalPages: 20, difficulty: 'Easy', completed: false },
  { id: 'c5-bgs-3', name: 'Culture & Heritage', startPage: 43, endPage: 60, totalPages: 18, difficulty: 'Medium', completed: false },
  { id: 'c5-bgs-4', name: 'Government & Constitution', startPage: 61, endPage: 78, totalPages: 18, difficulty: 'Medium', completed: false },
  { id: 'c5-bgs-5', name: 'Global Studies & Current Affairs', startPage: 79, endPage: 95, totalPages: 17, difficulty: 'Medium', completed: false },
];

const CLASS5_RELIGION: Chapter[] = [
  { id: 'c5-rel-1', name: 'Aqeedah & Iman (Faith & Belief)', startPage: 1, endPage: 18, totalPages: 18, difficulty: 'Easy', completed: false },
  { id: 'c5-rel-2', name: 'Ibadah (Worship & Prayers)', startPage: 19, endPage: 36, totalPages: 18, difficulty: 'Easy', completed: false },
  { id: 'c5-rel-3', name: 'Life of the Prophet (Sirah)', startPage: 37, endPage: 54, totalPages: 18, difficulty: 'Medium', completed: false },
  { id: 'c5-rel-4', name: 'Akhlaq & Adab (Moral Education)', startPage: 55, endPage: 70, totalPages: 16, difficulty: 'Medium', completed: false },
];

// ─── Master Syllabus Map ────────────────────────────────────────────────────────

interface SyllabusEntry {
  name: string;
  chapters: Chapter[];
}

const CLASS_SYLLABI: Record<string, SyllabusEntry[]> = {
  'Class 1': [
    { name: 'Bangla', chapters: [mk('Bangla Alphabets', 1, 15, 'Easy'), mk('Simple Words', 16, 28, 'Easy')] },
    { name: 'English', chapters: [mk('Alphabet & Letters', 1, 14, 'Easy'), mk('Basic Words', 15, 25, 'Easy')] },
    { name: 'Mathematics', chapters: [mk('Counting & Numbers', 1, 16, 'Easy'), mk('Addition & Subtraction', 17, 30, 'Easy')] },
  ],
  'Class 2': [
    { name: 'Bangla', chapters: [mk('Banjon Borno', 1, 16, 'Easy'), mk('Simple Sentences', 17, 32, 'Easy')] },
    { name: 'English', chapters: [mk('Vocabulary Building', 1, 15, 'Easy'), mk('Simple Sentences', 16, 28, 'Easy')] },
    { name: 'Mathematics', chapters: [mk('Addition & Subtraction', 1, 18, 'Easy'), mk('Multiplication Basics', 19, 32, 'Medium')] },
  ],
  'Class 5': [
    { name: 'Bangla', chapters: CLASS5_BANGLA },
    { name: 'English', chapters: CLASS5_ENGLISH },
    { name: 'Mathematics', chapters: CLASS5_MATH },
    { name: 'Science', chapters: CLASS5_SCIENCE },
    { name: 'Bangladesh & Global Studies', chapters: CLASS5_BGS },
    { name: 'Islam & Moral Education', chapters: CLASS5_RELIGION },
  ],
  'Class 6': [
    { name: 'Bangla 1st', chapters: [mk('Prose & Poetry', 1, 20, 'Easy'), mk('Grammar', 21, 38, 'Medium')] },
    { name: 'Bangla 2nd', chapters: [mk('Supplementary Reader', 1, 22, 'Easy'), mk('Comprehension', 23, 35, 'Medium')] },
    { name: 'English 1st', chapters: [mk('Prose Section', 1, 24, 'Easy'), mk('Poetry Section', 25, 40, 'Medium')] },
    { name: 'English 2nd', chapters: [mk('Grammar & Composition', 1, 30, 'Medium'), mk('Letter & Paragraph', 31, 45, 'Hard')] },
    { name: 'Mathematics', chapters: [mk('Algebra Introduction', 1, 22, 'Medium'), mk('Geometry', 23, 42, 'Medium'), mk('Statistics', 43, 55, 'Hard')] },
    { name: 'Science', chapters: [mk('Physics Basics', 1, 25, 'Medium'), mk('Chemistry Basics', 26, 45, 'Medium'), mk('Biology Basics', 46, 65, 'Easy')] },
    { name: 'BGS', chapters: [mk('History of Bangladesh', 1, 20, 'Easy'), mk('Geography', 21, 38, 'Easy'), mk('Civics', 39, 52, 'Medium')] },
    { name: 'Religion', chapters: [mk('Faith & Belief', 1, 18, 'Easy'), mk('Worship & Morality', 19, 35, 'Medium')] },
  ],
  'Class 7': [
    { name: 'Bangla 1st', chapters: [mk('Prose', 1, 22, 'Easy'), mk('Poetry & Drama', 23, 40, 'Medium')] },
    { name: 'Bangla 2nd', chapters: [mk('Supplementary', 1, 25, 'Easy'), mk('Grammar Applied', 26, 40, 'Medium')] },
    { name: 'English 1st', chapters: [mk('Narratives & Fiction', 1, 25, 'Easy'), mk('Poems & Drama', 26, 42, 'Medium')] },
    { name: 'English 2nd', chapters: [mk('Advanced Grammar', 1, 28, 'Medium'), mk('Writing Skills', 29, 45, 'Hard')] },
    { name: 'Mathematics', chapters: [mk('Algebra & Equations', 1, 24, 'Medium'), mk('Geometry & Mensuration', 25, 45, 'Medium'), mk('Statistics & Probability', 46, 58, 'Hard')] },
    { name: 'Science', chapters: [mk('Physics: Force & Motion', 1, 22, 'Medium'), mk('Chemistry: Elements', 23, 40, 'Medium'), mk('Biology: Cell & Life', 41, 60, 'Easy')] },
    { name: 'BGS', chapters: [mk('Liberation War', 1, 22, 'Easy'), mk('Geography & Environment', 23, 40, 'Easy'), mk('Economy & Society', 41, 55, 'Medium')] },
    { name: 'Religion', chapters: [mk('Tawheed & Risalat', 1, 20, 'Easy'), mk('Akhlaq & Social Duties', 21, 38, 'Medium')] },
  ],
  'Class 8': [
    { name: 'Bangla 1st', chapters: [mk('Advanced Prose', 1, 25, 'Medium'), mk('Poetry Analysis', 26, 42, 'Medium')] },
    { name: 'Bangla 2nd', chapters: [mk('Literature Survey', 1, 28, 'Medium'), mk('Applied Grammar', 29, 45, 'Hard')] },
    { name: 'English 1st', chapters: [mk('Literature Analysis', 1, 26, 'Medium'), mk('Critical Reading', 27, 44, 'Hard')] },
    { name: 'English 2nd', chapters: [mk('Grammar Mastery', 1, 30, 'Medium'), mk('Advanced Writing', 31, 48, 'Hard')] },
    { name: 'Mathematics', chapters: [mk('Advanced Algebra', 1, 26, 'Medium'), mk('Advanced Geometry', 27, 48, 'Hard'), mk('Trigonometry Intro', 49, 62, 'Hard')] },
    { name: 'Science', chapters: [mk('Physics: Energy', 1, 25, 'Medium'), mk('Chemistry: Reactions', 26, 44, 'Medium'), mk('Biology: Human Body', 45, 62, 'Medium')] },
    { name: 'BGS', chapters: [mk('Bangladesh History', 1, 24, 'Easy'), mk('World Geography', 25, 42, 'Medium'), mk('Government & Politics', 43, 58, 'Medium')] },
    { name: 'Religion', chapters: [mk('Quran & Hadith Studies', 1, 22, 'Medium'), mk('Islamic History', 23, 40, 'Medium')] },
  ],
  'Class 9': [
    { name: 'Bangla 1st', chapters: [mk('Prose Collection', 1, 28, 'Medium'), mk('Poetry Collection', 29, 48, 'Medium'), mk('Novel/Drama Excerpt', 49, 62, 'Hard')] },
    { name: 'Bangla 2nd', chapters: [mk('Supplementary Reader', 1, 30, 'Medium'), mk('Grammar & Composition', 31, 50, 'Hard')] },
    { name: 'English 1st', chapters: [mk('Prose & Fiction', 1, 26, 'Medium'), mk('Poetry', 27, 42, 'Medium'), mk('Drama', 43, 55, 'Hard')] },
    { name: 'English 2nd', chapters: [mk('Grammar Comprehensive', 1, 32, 'Medium'), mk('Writing Skills', 33, 50, 'Hard')] },
    { name: 'Mathematics', chapters: [mk('Algebra: Polynomials', 1, 22, 'Medium'), mk('Algebra: Equations', 23, 42, 'Hard'), mk('Geometry: Circles', 43, 58, 'Hard'), mk('Trigonometry', 59, 72, 'Hard'), mk('Statistics & Probability', 73, 85, 'Medium')] },
    { name: 'Physics', chapters: [mk('Kinematics', 1, 24, 'Hard'), mk('Dynamics & Newtons Laws', 25, 48, 'Hard'), mk('Work, Energy & Power', 49, 65, 'Hard'), mk('Waves & Sound', 66, 80, 'Medium')] },
    { name: 'Chemistry', chapters: [mk('Atomic Structure', 1, 22, 'Medium'), mk('Chemical Bonding', 23, 40, 'Hard'), mk('Periodic Table', 41, 55, 'Medium'), mk('Chemical Reactions', 56, 72, 'Hard')] },
    { name: 'Biology', chapters: [mk('Cell Biology', 1, 22, 'Medium'), mk('Plant Physiology', 23, 40, 'Medium'), mk('Human Physiology', 41, 62, 'Hard'), mk('Genetics & Evolution', 63, 78, 'Hard')] },
    { name: 'Higher Mathematics', chapters: [mk('Matrix & Determinant', 1, 20, 'Hard'), mk('Vectors', 21, 38, 'Hard'), mk('Coordinate Geometry', 39, 55, 'Hard'), mk('Calculus Intro', 56, 70, 'Hard')] },
    { name: 'Religion', chapters: [mk('Aqeedah & Fiqh', 1, 24, 'Medium'), mk('Islamic Culture', 25, 42, 'Medium')] },
    { name: 'BGS', chapters: [mk('Bangladesh Studies', 1, 28, 'Easy'), mk('Global Issues', 29, 45, 'Medium')] },
  ],
  'Class 10': [
    { name: 'Bangla 1st', chapters: [mk('SSC Prose Prep', 1, 30, 'Medium'), mk('SSC Poetry Prep', 31, 50, 'Medium'), mk('Board Exam Practice', 51, 65, 'Hard')] },
    { name: 'Bangla 2nd', chapters: [mk('Supplementary Complete', 1, 32, 'Medium'), mk('Grammar for SSC', 33, 52, 'Hard')] },
    { name: 'English 1st', chapters: [mk('SSC Prose Prep', 1, 28, 'Medium'), mk('SSC Poetry Prep', 29, 44, 'Medium'), mk('Board Practice', 45, 58, 'Hard')] },
    { name: 'English 2nd', chapters: [mk('SSC Grammar', 1, 34, 'Medium'), mk('SSC Writing', 35, 52, 'Hard')] },
    { name: 'Mathematics', chapters: [mk('SSC Algebra Review', 1, 25, 'Medium'), mk('SSC Geometry Review', 26, 46, 'Hard'), mk('SSC Trigonometry', 47, 60, 'Hard'), mk('SSC Statistics', 61, 74, 'Medium'), mk('Model Tests', 75, 88, 'Hard')] },
    { name: 'Physics', chapters: [mk('SSC Physics Complete Review', 1, 35, 'Hard'), mk('Practical & Numerical', 36, 55, 'Hard'), mk('Board Model Tests', 56, 68, 'Hard')] },
    { name: 'Chemistry', chapters: [mk('SSC Chemistry Complete', 1, 32, 'Hard'), mk('Organic Chemistry Intro', 33, 48, 'Hard'), mk('Board Model Tests', 49, 62, 'Hard')] },
    { name: 'Biology', chapters: [mk('SSC Biology Complete', 1, 30, 'Medium'), mk('Human Body Systems', 31, 50, 'Hard'), mk('Board Model Tests', 51, 65, 'Hard')] },
    { name: 'Higher Mathematics', chapters: [mk('SSC Higher Math Review', 1, 28, 'Hard'), mk('Advanced Topics', 29, 48, 'Hard'), mk('Model Tests', 49, 60, 'Hard')] },
    { name: 'Religion', chapters: [mk('SSC Religion Complete', 1, 26, 'Medium'), mk('Board Practice', 27, 40, 'Hard')] },
    { name: 'BGS', chapters: [mk('SSC BGS Complete', 1, 30, 'Easy'), mk('Board Practice', 31, 45, 'Medium')] },
  ],
};

// ─── Helper ─────────────────────────────────────────────────────────────────────

function mk(name: string, start: number, end: number, difficulty: 'Easy' | 'Medium' | 'Hard'): Chapter {
  return { id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, startPage: start, endPage: end, totalPages: end - start + 1, difficulty, completed: false };
}

// ─── Optional / Additional Subjects Available for Any Class ────────────────────

export const OPTIONAL_SUBJECTS = [
  'ICT',
  'Arts & Crafts',
  'Agriculture',
  'Physical Education',
  'Home Science',
  'Music',
  'Work & Life Oriented Education',
] as const;

// ─── Public API ─────────────────────────────────────────────────────────────────

export function getDefaultSubjectsForClass(selectedClass: ClassLevel): SubjectItem[] {
  const entries = CLASS_SYLLABI[selectedClass];

  if (!entries) {
    // Fallback for any unlisted class
    return makeFallbackSubjects();
  }

  return entries.map((entry, idx) => {
    const chapters = entry.chapters.map((ch, ci) => ({
      ...ch,
      id: `ch-${idx + 1}-${ci + 1}-${entry.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}`,
    }));
    const totalPages = chapters.reduce((acc, c) => acc + c.totalPages, 0);
    return {
      id: `subj-${idx + 1}-${entry.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}`,
      name: entry.name,
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

function makeFallbackSubjects(): SubjectItem[] {
  const names = ['Bangla', 'English', 'Mathematics'];
  return names.map((name, idx) => {
    const chapters: Chapter[] = [
      { id: `ch-${idx + 1}-1-fb`, name: 'Part 1', startPage: 1, endPage: 12, totalPages: 12, difficulty: 'Easy', completed: false },
      { id: `ch-${idx + 1}-2-fb`, name: 'Part 2', startPage: 13, endPage: 28, totalPages: 16, difficulty: 'Medium', completed: false },
    ];
    const totalPages = chapters.reduce((acc, c) => acc + c.totalPages, 0);
    return {
      id: `subj-${idx + 1}-fb-${name.toLowerCase()}`,
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

// Get just the subject names for the selection screen
export function getDefaultSubjectNamesForClass(selectedClass: ClassLevel): string[] {
  const entries = CLASS_SYLLABI[selectedClass];
  if (!entries) return ['Bangla', 'English', 'Mathematics'];
  return entries.map(e => e.name);
}

// Generate a fresh set of subjects from template (for class change replace)
export function getSyllabusForClass(selectedClass: ClassLevel): SubjectItem[] {
  return getDefaultSubjectsForClass(selectedClass);
}
