import { ClassLevel, SubjectItem, Chapter } from '../types';

export function calculateTotalPages(start: number, end: number): number {
  if (end < start) return 0;
  return end - start + 1;
}

// ─── Helper ─────────────────────────────────────────────────────────────────────

function mk(name: string, start: number, end: number, difficulty: 'Easy' | 'Medium' | 'Hard', prefix: string): Chapter {
  return {
    id: `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}-${start}-${end}`,
    name, startPage: start, endPage: end,
    totalPages: end - start + 1, difficulty, completed: false,
  };
}

// ─── Class 5 Detailed Syllabus ──────────────────────────────────────────────────

const CLASS5_BANGLA: Chapter[] = [
  mk('Probad & Anubad (Prose & Translation)', 1, 25, 'Easy', 'c5bn'),
  mk('Kobita (Poetry)', 26, 45, 'Medium', 'c5bn'),
  mk('Banan o Byakaran (Grammar)', 46, 70, 'Medium', 'c5bn'),
  mk('Nibondho o Lekha (Essay & Writing)', 71, 88, 'Hard', 'c5bn'),
  mk('Sahitto Ocharon (Literature)', 89, 105, 'Medium', 'c5bn'),
];

const CLASS5_ENGLISH: Chapter[] = [
  mk('Reading Comprehension (Seen)', 1, 22, 'Easy', 'c5en'),
  mk('Reading Comprehension (Unseen)', 23, 40, 'Medium', 'c5en'),
  mk('Grammar & Vocabulary', 41, 62, 'Medium', 'c5en'),
  mk('Paragraph & Letter Writing', 63, 78, 'Hard', 'c5en'),
  mk('Story & Essay Writing', 79, 95, 'Hard', 'c5en'),
];

const CLASS5_MATH: Chapter[] = [
  mk('Number System & Operations', 1, 20, 'Easy', 'c5mt'),
  mk('Fractions & Decimals', 21, 42, 'Medium', 'c5mt'),
  mk('Measurement', 43, 58, 'Easy', 'c5mt'),
  mk('Geometry & Shapes', 59, 78, 'Medium', 'c5mt'),
  mk('Data Handling & Patterns', 79, 92, 'Medium', 'c5mt'),
  mk('Algebraic Expressions', 93, 110, 'Hard', 'c5mt'),
];

const CLASS5_SCIENCE: Chapter[] = [
  mk('Our Body & Health', 1, 18, 'Easy', 'c5sc'),
  mk('Light & Sound', 19, 38, 'Medium', 'c5sc'),
  mk('Force & Simple Machines', 39, 56, 'Medium', 'c5sc'),
  mk('Living World & Ecosystem', 57, 75, 'Easy', 'c5sc'),
  mk('Earth, Weather & Climate', 76, 92, 'Medium', 'c5sc'),
  mk('Matter & Materials', 93, 108, 'Hard', 'c5sc'),
];

const CLASS5_BGS: Chapter[] = [
  mk('History of Bangladesh', 1, 22, 'Easy', 'c5bg'),
  mk('Geography of Bangladesh', 23, 42, 'Easy', 'c5bg'),
  mk('Culture & Heritage', 43, 60, 'Medium', 'c5bg'),
  mk('Government & Constitution', 61, 78, 'Medium', 'c5bg'),
  mk('Global Studies & Current Affairs', 79, 95, 'Medium', 'c5bg'),
];

const CLASS5_RELIGION: Chapter[] = [
  mk('Aqeedah & Iman (Faith & Belief)', 1, 18, 'Easy', 'c5rl'),
  mk('Ibadah (Worship & Prayers)', 19, 36, 'Easy', 'c5rl'),
  mk('Life of the Prophet (Sirah)', 37, 54, 'Medium', 'c5rl'),
  mk('Akhlaq & Adab (Moral Education)', 55, 70, 'Medium', 'c5rl'),
];

// ─── Master Syllabus Map ────────────────────────────────────────────────────────

interface SyllabusEntry { name: string; chapters: Chapter[]; }

const CLASS_SYLLABI: Record<string, SyllabusEntry[]> = {
  'Class 1': [
    { name: 'Bangla', chapters: [mk('Bangla Alphabets', 1, 15, 'Easy', 'c1bn'), mk('Simple Words', 16, 28, 'Easy', 'c1bn')] },
    { name: 'English', chapters: [mk('Alphabet & Letters', 1, 14, 'Easy', 'c1en'), mk('Basic Words', 15, 25, 'Easy', 'c1en')] },
    { name: 'Mathematics', chapters: [mk('Counting & Numbers', 1, 16, 'Easy', 'c1mt'), mk('Addition & Subtraction', 17, 30, 'Easy', 'c1mt')] },
  ],
  'Class 2': [
    { name: 'Bangla', chapters: [mk('Banjon Borno', 1, 16, 'Easy', 'c2bn'), mk('Simple Sentences', 17, 32, 'Easy', 'c2bn')] },
    { name: 'English', chapters: [mk('Vocabulary Building', 1, 15, 'Easy', 'c2en'), mk('Simple Sentences', 16, 28, 'Easy', 'c2en')] },
    { name: 'Mathematics', chapters: [mk('Addition & Subtraction', 1, 18, 'Easy', 'c2mt'), mk('Multiplication Basics', 19, 32, 'Medium', 'c2mt')] },
  ],
  'Class 3': [
    { name: 'Bangla', chapters: [mk('Prose & Poetry Basics', 1, 20, 'Easy', 'c3bn'), mk('Grammar Basics', 21, 35, 'Easy', 'c3bn'), mk('Comprehension', 36, 48, 'Medium', 'c3bn')] },
    { name: 'English', chapters: [mk('Reading Skills', 1, 18, 'Easy', 'c3en'), mk('Grammar & Vocabulary', 19, 34, 'Medium', 'c3en'), mk('Writing Basics', 35, 45, 'Medium', 'c3en')] },
    { name: 'Mathematics', chapters: [mk('Numbers & Operations', 1, 22, 'Easy', 'c3mt'), mk('Fractions', 23, 38, 'Medium', 'c3mt'), mk('Geometry Basics', 39, 50, 'Easy', 'c3mt')] },
    { name: 'Science', chapters: [mk('Our Environment', 1, 18, 'Easy', 'c3sc'), mk('Living & Non-living', 19, 32, 'Easy', 'c3sc'), mk('Simple Machines', 33, 45, 'Medium', 'c3sc')] },
    { name: 'Bangladesh & Global Studies', chapters: [mk('Our Bangladesh', 1, 16, 'Easy', 'c3bg'), mk('Our World', 17, 30, 'Easy', 'c3bg')] },
    { name: 'Religion', chapters: [mk('Faith & Belief', 1, 15, 'Easy', 'c3rl'), mk('Good Deeds & Morality', 16, 28, 'Easy', 'c3rl')] },
  ],
  'Class 4': [
    { name: 'Bangla', chapters: [mk('Prose Collection', 1, 22, 'Easy', 'c4bn'), mk('Poetry', 23, 38, 'Medium', 'c4bn'), mk('Grammar & Composition', 39, 55, 'Medium', 'c4bn')] },
    { name: 'English', chapters: [mk('Prose & Fiction', 1, 20, 'Easy', 'c4en'), mk('Grammar & Vocabulary', 21, 38, 'Medium', 'c4en'), mk('Paragraph & Letter Writing', 39, 50, 'Medium', 'c4en')] },
    { name: 'Mathematics', chapters: [mk('Arithmetic & Fractions', 1, 24, 'Easy', 'c4mt'), mk('Geometry & Measurement', 25, 42, 'Medium', 'c4mt'), mk('Data Handling', 43, 55, 'Medium', 'c4mt')] },
    { name: 'Science', chapters: [mk('Human Body & Health', 1, 20, 'Easy', 'c4sc'), mk('Light, Sound & Force', 21, 38, 'Medium', 'c4sc'), mk('Living World', 39, 52, 'Easy', 'c4sc')] },
    { name: 'Bangladesh & Global Studies', chapters: [mk('History & Heritage', 1, 18, 'Easy', 'c4bg'), mk('Geography & Culture', 19, 35, 'Easy', 'c4bg')] },
    { name: 'Religion', chapters: [mk('Worship & Daily Life', 1, 16, 'Easy', 'c4rl'), mk('Life of the Prophet', 17, 32, 'Medium', 'c4rl')] },
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
    { name: 'Bangla 1st Paper', chapters: [mk('Prose & Poetry', 1, 20, 'Easy', 'c6b1'), mk('Grammar', 21, 38, 'Medium', 'c6b1')] },
    { name: 'Bangla 2nd Paper', chapters: [mk('Supplementary Reader', 1, 22, 'Easy', 'c6b2'), mk('Comprehension', 23, 35, 'Medium', 'c6b2')] },
    { name: 'English 1st Paper', chapters: [mk('Prose Section', 1, 24, 'Easy', 'c6e1'), mk('Poetry Section', 25, 40, 'Medium', 'c6e1')] },
    { name: 'English 2nd Paper', chapters: [mk('Grammar & Composition', 1, 30, 'Medium', 'c6e2'), mk('Letter & Paragraph', 31, 45, 'Hard', 'c6e2')] },
    { name: 'Mathematics', chapters: [mk('Algebra Introduction', 1, 22, 'Medium', 'c6mt'), mk('Geometry', 23, 42, 'Medium', 'c6mt'), mk('Statistics', 43, 55, 'Hard', 'c6mt')] },
    { name: 'Science', chapters: [mk('Physics Basics', 1, 25, 'Medium', 'c6sc'), mk('Chemistry Basics', 26, 45, 'Medium', 'c6sc'), mk('Biology Basics', 46, 65, 'Easy', 'c6sc')] },
    { name: 'Bangladesh & Global Studies', chapters: [mk('History of Bangladesh', 1, 20, 'Easy', 'c6bg'), mk('Geography', 21, 38, 'Easy', 'c6bg'), mk('Civics', 39, 52, 'Medium', 'c6bg')] },
    { name: 'Religion', chapters: [mk('Faith & Belief', 1, 18, 'Easy', 'c6rl'), mk('Worship & Morality', 19, 35, 'Medium', 'c6rl')] },
  ],
  'Class 7': [
    { name: 'Bangla 1st Paper', chapters: [mk('Prose', 1, 22, 'Easy', 'c7b1'), mk('Poetry & Drama', 23, 40, 'Medium', 'c7b1')] },
    { name: 'Bangla 2nd Paper', chapters: [mk('Supplementary', 1, 25, 'Easy', 'c7b2'), mk('Grammar Applied', 26, 40, 'Medium', 'c7b2')] },
    { name: 'English 1st Paper', chapters: [mk('Narratives & Fiction', 1, 25, 'Easy', 'c7e1'), mk('Poems & Drama', 26, 42, 'Medium', 'c7e1')] },
    { name: 'English 2nd Paper', chapters: [mk('Advanced Grammar', 1, 28, 'Medium', 'c7e2'), mk('Writing Skills', 29, 45, 'Hard', 'c7e2')] },
    { name: 'Mathematics', chapters: [mk('Algebra & Equations', 1, 24, 'Medium', 'c7mt'), mk('Geometry & Mensuration', 25, 45, 'Medium', 'c7mt'), mk('Statistics & Probability', 46, 58, 'Hard', 'c7mt')] },
    { name: 'Science', chapters: [mk('Physics: Force & Motion', 1, 22, 'Medium', 'c7sc'), mk('Chemistry: Elements', 23, 40, 'Medium', 'c7sc'), mk('Biology: Cell & Life', 41, 60, 'Easy', 'c7sc')] },
    { name: 'Bangladesh & Global Studies', chapters: [mk('Liberation War', 1, 22, 'Easy', 'c7bg'), mk('Geography & Environment', 23, 40, 'Easy', 'c7bg'), mk('Economy & Society', 41, 55, 'Medium', 'c7bg')] },
    { name: 'Religion', chapters: [mk('Tawheed & Risalat', 1, 20, 'Easy', 'c7rl'), mk('Akhlaq & Social Duties', 21, 38, 'Medium', 'c7rl')] },
  ],
  'Class 8': [
    { name: 'Bangla 1st Paper', chapters: [mk('Advanced Prose', 1, 25, 'Medium', 'c8b1'), mk('Poetry Analysis', 26, 42, 'Medium', 'c8b1')] },
    { name: 'Bangla 2nd Paper', chapters: [mk('Literature Survey', 1, 28, 'Medium', 'c8b2'), mk('Applied Grammar', 29, 45, 'Hard', 'c8b2')] },
    { name: 'English 1st Paper', chapters: [mk('Literature Analysis', 1, 26, 'Medium', 'c8e1'), mk('Critical Reading', 27, 44, 'Hard', 'c8e1')] },
    { name: 'English 2nd Paper', chapters: [mk('Grammar Mastery', 1, 30, 'Medium', 'c8e2'), mk('Advanced Writing', 31, 48, 'Hard', 'c8e2')] },
    { name: 'Mathematics', chapters: [mk('Advanced Algebra', 1, 26, 'Medium', 'c8mt'), mk('Advanced Geometry', 27, 48, 'Hard', 'c8mt'), mk('Trigonometry Intro', 49, 62, 'Hard', 'c8mt')] },
    { name: 'Science', chapters: [mk('Physics: Energy', 1, 25, 'Medium', 'c8sc'), mk('Chemistry: Reactions', 26, 44, 'Medium', 'c8sc'), mk('Biology: Human Body', 45, 62, 'Medium', 'c8sc')] },
    { name: 'Bangladesh & Global Studies', chapters: [mk('Bangladesh History', 1, 24, 'Easy', 'c8bg'), mk('World Geography', 25, 42, 'Medium', 'c8bg'), mk('Government & Politics', 43, 58, 'Medium', 'c8bg')] },
    { name: 'Religion', chapters: [mk('Quran & Hadith Studies', 1, 22, 'Medium', 'c8rl'), mk('Islamic History', 23, 40, 'Medium', 'c8rl')] },
  ],
  'Class 9': [
    { name: 'Bangla 1st Paper', chapters: [mk('Prose Collection', 1, 28, 'Medium', 'c9b1'), mk('Poetry Collection', 29, 48, 'Medium', 'c9b1'), mk('Novel/Drama Excerpt', 49, 62, 'Hard', 'c9b1')] },
    { name: 'Bangla 2nd Paper', chapters: [mk('Supplementary Reader', 1, 30, 'Medium', 'c9b2'), mk('Grammar & Composition', 31, 50, 'Hard', 'c9b2')] },
    { name: 'English 1st Paper', chapters: [mk('Prose & Fiction', 1, 26, 'Medium', 'c9e1'), mk('Poetry', 27, 42, 'Medium', 'c9e1'), mk('Drama', 43, 55, 'Hard', 'c9e1')] },
    { name: 'English 2nd Paper', chapters: [mk('Grammar Comprehensive', 1, 32, 'Medium', 'c9e2'), mk('Writing Skills', 33, 50, 'Hard', 'c9e2')] },
    { name: 'Mathematics', chapters: [mk('Algebra: Polynomials', 1, 22, 'Medium', 'c9mt'), mk('Algebra: Equations', 23, 42, 'Hard', 'c9mt'), mk('Geometry: Circles', 43, 58, 'Hard', 'c9mt'), mk('Trigonometry', 59, 72, 'Hard', 'c9mt'), mk('Statistics & Probability', 73, 85, 'Medium', 'c9mt')] },
    { name: 'Physics', chapters: [mk('Kinematics', 1, 24, 'Hard', 'c9ph'), mk('Dynamics & Newtons Laws', 25, 48, 'Hard', 'c9ph'), mk('Work, Energy & Power', 49, 65, 'Hard', 'c9ph'), mk('Waves & Sound', 66, 80, 'Medium', 'c9ph')] },
    { name: 'Chemistry', chapters: [mk('Atomic Structure', 1, 22, 'Medium', 'c9ch'), mk('Chemical Bonding', 23, 40, 'Hard', 'c9ch'), mk('Periodic Table', 41, 55, 'Medium', 'c9ch'), mk('Chemical Reactions', 56, 72, 'Hard', 'c9ch')] },
    { name: 'Biology', chapters: [mk('Cell Biology', 1, 22, 'Medium', 'c9bi'), mk('Plant Physiology', 23, 40, 'Medium', 'c9bi'), mk('Human Physiology', 41, 62, 'Hard', 'c9bi'), mk('Genetics & Evolution', 63, 78, 'Hard', 'c9bi')] },
    { name: 'Higher Mathematics', chapters: [mk('Matrix & Determinant', 1, 20, 'Hard', 'c9hm'), mk('Vectors', 21, 38, 'Hard', 'c9hm'), mk('Coordinate Geometry', 39, 55, 'Hard', 'c9hm'), mk('Calculus Intro', 56, 70, 'Hard', 'c9hm')] },
    { name: 'Bangladesh & Global Studies', chapters: [mk('Bangladesh Studies', 1, 28, 'Easy', 'c9bg'), mk('Global Issues', 29, 45, 'Medium', 'c9bg')] },
    { name: 'Religion', chapters: [mk('Aqeedah & Fiqh', 1, 24, 'Medium', 'c9rl'), mk('Islamic Culture', 25, 42, 'Medium', 'c9rl')] },
  ],
  'Class 10': [
    { name: 'Bangla 1st Paper', chapters: [mk('SSC Prose Prep', 1, 30, 'Medium', 'c0b1'), mk('SSC Poetry Prep', 31, 50, 'Medium', 'c0b1'), mk('Board Exam Practice', 51, 65, 'Hard', 'c0b1')] },
    { name: 'Bangla 2nd Paper', chapters: [mk('Supplementary Complete', 1, 32, 'Medium', 'c0b2'), mk('Grammar for SSC', 33, 52, 'Hard', 'c0b2')] },
    { name: 'English 1st Paper', chapters: [mk('SSC Prose Prep', 1, 28, 'Medium', 'c0e1'), mk('SSC Poetry Prep', 29, 44, 'Medium', 'c0e1'), mk('Board Practice', 45, 58, 'Hard', 'c0e1')] },
    { name: 'English 2nd Paper', chapters: [mk('SSC Grammar', 1, 34, 'Medium', 'c0e2'), mk('SSC Writing', 35, 52, 'Hard', 'c0e2')] },
    { name: 'Mathematics', chapters: [mk('SSC Algebra Review', 1, 25, 'Medium', 'c0mt'), mk('SSC Geometry Review', 26, 46, 'Hard', 'c0mt'), mk('SSC Trigonometry', 47, 60, 'Hard', 'c0mt'), mk('SSC Statistics', 61, 74, 'Medium', 'c0mt'), mk('Model Tests', 75, 88, 'Hard', 'c0mt')] },
    { name: 'Physics', chapters: [mk('SSC Physics Complete Review', 1, 35, 'Hard', 'c0ph'), mk('Practical & Numerical', 36, 55, 'Hard', 'c0ph'), mk('Board Model Tests', 56, 68, 'Hard', 'c0ph')] },
    { name: 'Chemistry', chapters: [mk('SSC Chemistry Complete', 1, 32, 'Hard', 'c0ch'), mk('Organic Chemistry Intro', 33, 48, 'Hard', 'c0ch'), mk('Board Model Tests', 49, 62, 'Hard', 'c0ch')] },
    { name: 'Biology', chapters: [mk('SSC Biology Complete', 1, 30, 'Medium', 'c0bi'), mk('Human Body Systems', 31, 50, 'Hard', 'c0bi'), mk('Board Model Tests', 51, 65, 'Hard', 'c0bi')] },
    { name: 'Higher Mathematics', chapters: [mk('SSC Higher Math Review', 1, 28, 'Hard', 'c0hm'), mk('Advanced Topics', 29, 48, 'Hard', 'c0hm'), mk('Model Tests', 49, 60, 'Hard', 'c0hm')] },
    { name: 'Bangladesh & Global Studies', chapters: [mk('SSC BGS Complete', 1, 30, 'Easy', 'c0bg'), mk('Board Practice', 31, 45, 'Medium', 'c0bg')] },
    { name: 'Religion', chapters: [mk('SSC Religion Complete', 1, 26, 'Medium', 'c0rl'), mk('Board Practice', 27, 40, 'Hard', 'c0rl')] },
  ],
};

// ─── Optional / Additional Subjects ─────────────────────────────────────────────

export const OPTIONAL_SUBJECTS = [
  'ICT', 'Arts & Crafts', 'Agriculture', 'Physical Education',
  'Home Science', 'Music', 'Work & Life Oriented Education',
] as const;

// ─── Public API ─────────────────────────────────────────────────────────────────

export function getDefaultSubjectsForClass(selectedClass: ClassLevel): SubjectItem[] {
  const entries = CLASS_SYLLABI[selectedClass];
  if (!entries) return makeFallbackSubjects();
  return entries.map((entry, idx) => {
    const slug = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    const chapters = entry.chapters.map((ch, ci) => ({
      ...ch,
      id: `ch-${idx + 1}-${ci + 1}-${slug}`,
    }));
    const totalPages = chapters.reduce((acc, c) => acc + c.totalPages, 0);
    return {
      id: `subj-${idx + 1}-${slug}`,
      name: entry.name, order: idx + 1, chapters,
      totalChapters: chapters.length, completedChapters: 0,
      totalPages, completedPages: 0, remainingPages: totalPages, progressPercent: 0,
    };
  });
}

function makeFallbackSubjects(): SubjectItem[] {
  return ['Bangla', 'English', 'Mathematics'].map((name, idx) => {
    const slug = name.toLowerCase();
    const chapters: Chapter[] = [
      { id: `ch-${idx + 1}-1-${slug}`, name: 'Part 1', startPage: 1, endPage: 12, totalPages: 12, difficulty: 'Easy', completed: false },
      { id: `ch-${idx + 1}-2-${slug}`, name: 'Part 2', startPage: 13, endPage: 28, totalPages: 16, difficulty: 'Medium', completed: false },
    ];
    const totalPages = chapters.reduce((acc, c) => acc + c.totalPages, 0);
    return {
      id: `subj-${idx + 1}-fb-${slug}`, name, order: idx + 1, chapters,
      totalChapters: chapters.length, completedChapters: 0,
      totalPages, completedPages: 0, remainingPages: totalPages, progressPercent: 0,
    };
  });
}

export function getDefaultSubjectNamesForClass(selectedClass: ClassLevel): string[] {
  const entries = CLASS_SYLLABI[selectedClass];
  if (!entries) return ['Bangla', 'English', 'Mathematics'];
  return entries.map(e => e.name);
}

export function getSyllabusForClass(selectedClass: ClassLevel): SubjectItem[] {
  return getDefaultSubjectsForClass(selectedClass);
}
