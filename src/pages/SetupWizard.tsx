import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, ClassLevel, DailyStudyHours, PreferredTime, Chapter, ChapterDifficulty, SubjectItem } from '../types';
import { CLASS_LEVELS, DAILY_TIME_OPTIONS, PREFERRED_TIME_OPTIONS, AVATAR_PRESETS } from '../utils/constants';
import { getDefaultSubjectsForClass, calculateTotalPages } from '../utils/subjectGenerator';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import {
  ArrowRight, ArrowLeft, Plus, Trash2, CheckCircle2, BookOpen, Clock, Sun, SunMedium, Sunset, Moon,
  User, Calendar, Layers, PlusCircle, AlertCircle
} from 'lucide-react';

interface SetupWizardProps {
  initialProfile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ initialProfile, onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(initialProfile.name || '');
  const [avatar, setAvatar] = useState<string>(initialProfile.avatar || '🎓');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(initialProfile.selectedClass || 'Class 9');
  const [dailyTime, setDailyTime] = useState<DailyStudyHours>(initialProfile.dailyStudyTime || '2 Hours');
  const [customTime, setCustomTime] = useState<string>('4 Hours');
  const [preferredTime, setPreferredTime] = useState<PreferredTime>(initialProfile.preferredStudyTime || 'Evening');

  // Step 5: Exam Info (Required)
  const [examName, setExamName] = useState<string>(initialProfile.examInfo?.name || 'Half Yearly Examination');
  const [examDate, setExamDate] = useState<string>(initialProfile.examInfo?.date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [examError, setExamError] = useState<string>('');

  // Step 6 & 7: Subjects & Syllabus
  const [subjects, setSubjects] = useState(
    initialProfile.subjects.length > 0 ? initialProfile.subjects : getDefaultSubjectsForClass('Class 9')
  );
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  const [newSubjectInput, setNewSubjectInput] = useState<string>('');

  // Chapter Form State for Syllabus Setup
  const [chName, setChName] = useState<string>('');
  const [chStart, setChStart] = useState<number>(1);
  const [chEnd, setChEnd] = useState<number>(10);
  const [chDiff, setChDiff] = useState<ChapterDifficulty>('Medium');
  const [chFormError, setChFormError] = useState<string>('');

  // Handle class selection change & auto generate subjects
  const handleClassChange = (cls: ClassLevel) => {
    setSelectedClass(cls);
    const generated = getDefaultSubjectsForClass(cls);
    setSubjects(generated);
    if (generated.length > 0) {
      setActiveSubjectId(generated[0].id);
    }
  };

  const handleAddSubject = () => {
    if (!newSubjectInput.trim()) return;
    const newSubj: SubjectItem = {
      id: `subj-${Date.now()}`,
      name: newSubjectInput.trim(),
      order: subjects.length + 1,
      chapters: [],
      totalChapters: 0,
      completedChapters: 0,
      totalPages: 0,
      completedPages: 0,
      remainingPages: 0,
      progressPercent: 0,
    };
    setSubjects([...subjects, newSubj]);
    setActiveSubjectId(newSubj.id);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (id: string) => {
    const filtered = subjects.filter((s) => s.id !== id);
    setSubjects(filtered);
    if (activeSubjectId === id && filtered.length > 0) {
      setActiveSubjectId(filtered[0].id);
    }
  };

  // Add Chapter to active subject
  const handleAddChapter = () => {
    if (!chName.trim()) {
      setChFormError('Please enter a chapter name');
      return;
    }
    if (chEnd < chStart) {
      setChFormError('End page must be greater than or equal to start page');
      return;
    }

    setChFormError('');
    const totalPages = calculateTotalPages(chStart, chEnd);
    const newCh: Chapter = {
      id: `ch-${Date.now()}`,
      name: chName.trim(),
      startPage: chStart,
      endPage: chEnd,
      totalPages,
      difficulty: chDiff,
      completed: false,
    };

    setSubjects(subjects.map((s) => {
      if (s.id === activeSubjectId) {
        const updatedChapters = [...s.chapters, newCh];
        return {
          ...s,
          chapters: updatedChapters,
          totalChapters: updatedChapters.length,
        };
      }
      return s;
    }));

    // Reset chapter inputs
    setChName('');
    setChStart(chEnd + 1);
    setChEnd(chEnd + 10);
  };

  const handleRemoveChapter = (subjectId: string, chapterId: string) => {
    setSubjects(subjects.map((s) => {
      if (s.id === subjectId) {
        const updatedChapters = s.chapters.filter((c) => c.id !== chapterId);
        return {
          ...s,
          chapters: updatedChapters,
          totalChapters: updatedChapters.length,
        };
      }
      return s;
    }));
  };

  const validateStep5 = (): boolean => {
    if (!examName.trim()) {
      setExamError('Exam Name is required');
      return false;
    }
    if (!examDate) {
      setExamError('Exam Date is required');
      return false;
    }
    setExamError('');
    return true;
  };

  const handleNextStep = () => {
    if (step === 5) {
      if (!validateStep5()) return;
      if (!activeSubjectId && subjects.length > 0) {
        setActiveSubjectId(subjects[0].id);
      }
    }
    setStep(step + 1);
  };

  const handleFinishSetup = () => {
    const finalProfile: UserProfile = {
      ...initialProfile,
      name: name.trim() || 'Student',
      avatar,
      selectedClass,
      dailyStudyTime: dailyTime === 'Custom' ? customTime : dailyTime,
      preferredStudyTime: preferredTime,
      examInfo: {
        name: examName.trim() || 'Upcoming Exam',
        date: examDate,
      },
      subjects,
      setupCompleted: true,
    };
    onComplete(finalProfile);
  };

  const getTimeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun': return <Sun className="w-5 h-5 text-amber-400" />;
      case 'SunMedium': return <SunMedium className="w-5 h-5 text-orange-400" />;
      case 'Sunset': return <Sunset className="w-5 h-5 text-electric-400" />;
      case 'Moon': return <Moon className="w-5 h-5 text-indigo-400" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 md:p-6 relative select-none">
      {/* Background soft ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-electric-500/10 blur-[120px] pointer-events-none" />

      {/* Setup Top Progress Bar */}
      <div className="w-full max-w-2xl mb-6 flex flex-col gap-2 z-10">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-medium px-1">
          <span className="flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="Studex" className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]" />
            <img src="/wordmark.png" alt="Studex" className="h-6 object-contain" />
            <span className="ml-1 text-neutral-400 font-bold">Step {step} of 7</span>
          </span>
          <span className="text-electric-400 font-semibold">
            {step === 1 && 'Personal Profile'}
            {step === 2 && 'Class Selection'}
            {step === 3 && 'Daily Study Target'}
            {step === 4 && 'Preferred Schedule'}
            {step === 5 && 'Upcoming Exam (Required)'}
            {step === 6 && 'Class Subjects'}
            {step === 7 && 'Syllabus Chapter Setup'}
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-electric-600 to-electric-400 rounded-full shadow-glow-sm"
            animate={{ width: `${(step / 7) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Main Wizard Container */}
      <div className="w-full max-w-2xl glass-panel p-6 md:p-8 rounded-3xl border border-white/10 relative z-10 shadow-glass-card">
        <AnimatePresence mode="wait">
          {/* STEP 1: Name & Avatar */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">What's your name?</h2>
                <p className="text-sm text-neutral-400">Let's personalize your academic workspace.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-2">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Saad"
                      className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-white text-base placeholder-neutral-600 focus:border-electric-500 transition"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-2">Avatar Icon</label>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_PRESETS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setAvatar(item)}
                        className={`p-3 text-2xl rounded-xl transition flex items-center justify-center border ${
                          avatar === item
                            ? 'bg-electric-500/20 border-electric-500 shadow-glow-sm scale-105'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Select Class */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Select your class level</h2>
                <p className="text-sm text-neutral-400">Studex will auto-configure your core academic subjects.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-1">
                {CLASS_LEVELS.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleClassChange(cls)}
                    className={`p-4 rounded-xl font-semibold text-sm transition text-center border ${
                      selectedClass === cls
                        ? 'bg-electric-500/20 border-electric-500 text-electric-400 shadow-glow-sm'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Daily Study Time */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Daily Study Target</h2>
                <p className="text-sm text-neutral-400">How many hours do you plan to study each day?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DAILY_TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDailyTime(opt)}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition ${
                      dailyTime === opt
                        ? 'bg-electric-500/20 border-electric-500 text-electric-400 shadow-glow-sm'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <Clock className="w-6 h-6" />
                    <span className="font-semibold text-sm">{opt}</span>
                  </button>
                ))}
              </div>

              {dailyTime === 'Custom' && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-2">Custom Hours</label>
                  <input
                    type="text"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="e.g. 4 Hours"
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: Preferred Study Time */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Preferred Study Time</h2>
                <p className="text-sm text-neutral-400">Select when your mind is most focused.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PREFERRED_TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreferredTime(opt.id as PreferredTime)}
                    className={`p-4 rounded-2xl flex flex-col items-start gap-2 border text-left transition ${
                      preferredTime === opt.id
                        ? 'bg-electric-500/20 border-electric-500 shadow-glow-sm'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      {getTimeIcon(opt.icon)}
                      {preferredTime === opt.id && <Badge variant="electric">Selected</Badge>}
                    </div>
                    <span className="font-semibold text-base text-white">{opt.label}</span>
                    <span className="text-xs text-neutral-400">{opt.timeRange}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 5: Upcoming Exam (Required) */}
          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Upcoming Exam (Required)</h2>
                <p className="text-sm text-neutral-400">Studex uses exam date to schedule target priorities.</p>
              </div>

              {examError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{examError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-2">Exam Name *</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. Half Yearly Examination, SSC Board Exam"
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-2">Exam Target Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: Class Subjects */}
          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Class Subjects</h2>
                  <Badge variant="electric">{selectedClass}</Badge>
                </div>
                <p className="text-sm text-neutral-400 mt-1">Auto-generated for {selectedClass}. Add or remove subjects.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                  placeholder="Add custom subject (e.g. ICT, Statistics)"
                  className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm"
                />
                <Button size="sm" variant="glass" icon={<Plus className="w-4 h-4" />} onClick={handleAddSubject}>
                  Add
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {subjects.map((subj) => (
                  <div key={subj.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm text-white">{subj.name}</span>
                    </div>

                    <button
                      onClick={() => handleRemoveSubject(subj.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-white/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 7: Mandatory Syllabus Setup */}
          {step === 7 && (
            <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Syllabus Chapter Setup</h2>
                <p className="text-sm text-neutral-400">Add chapters and page ranges for every subject to calculate daily targets.</p>
              </div>

              {/* Subject Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {subjects.map((subj) => (
                  <button
                    key={subj.id}
                    onClick={() => setActiveSubjectId(subj.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                      activeSubject?.id === subj.id
                        ? 'bg-electric-500/20 border-electric-500 text-electric-400 shadow-glow-sm'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                    }`}
                  >
                    {subj.name} ({subj.chapters?.length || 0})
                  </button>
                ))}
              </div>

              {/* Active Subject Chapter Manager */}
              {activeSubject && (
                <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-electric-400 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {activeSubject.name} Syllabus
                    </h3>
                    <span className="text-xs text-neutral-400">
                      Total Pages: {activeSubject.chapters?.reduce((acc, c) => acc + c.totalPages, 0) || 0}
                    </span>
                  </div>

                  {chFormError && (
                    <p className="text-xs text-red-400 font-medium">{chFormError}</p>
                  )}

                  {/* Add Chapter Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={chName}
                      onChange={(e) => setChName(e.target.value)}
                      placeholder="Chapter Name (e.g. Vectors)"
                      className="sm:col-span-5 px-3 py-2 rounded-xl glass-input text-xs"
                    />

                    <div className="sm:col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={chStart}
                        onChange={(e) => setChStart(parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-2 rounded-xl glass-input text-xs text-center"
                        title="Start Page"
                      />
                      <span className="text-neutral-500 text-xs">-</span>
                      <input
                        type="number"
                        min="1"
                        value={chEnd}
                        onChange={(e) => setChEnd(parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-2 rounded-xl glass-input text-xs text-center"
                        title="End Page"
                      />
                    </div>

                    <select
                      value={chDiff}
                      onChange={(e) => setChDiff(e.target.value as ChapterDifficulty)}
                      className="sm:col-span-2 px-2 py-2 rounded-xl glass-input text-xs bg-black text-white"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAddChapter}
                      className="sm:col-span-2 px-3 py-2 rounded-xl bg-electric-500 text-black font-semibold text-xs hover:bg-electric-400 transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* Calculated Formula Info */}
                  <div className="text-[11px] text-neutral-400 flex items-center justify-between px-1">
                    <span>Formula: End Page - Start Page + 1</span>
                    <span className="text-electric-400 font-semibold">
                      New Chapter: {calculateTotalPages(chStart, chEnd)} Pages
                    </span>
                  </div>

                  {/* Chapter List */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pt-2 border-t border-white/10">
                    {activeSubject.chapters?.length === 0 ? (
                      <p className="text-xs text-neutral-500 text-center py-3">No chapters added yet. Add a chapter above.</p>
                    ) : (
                      activeSubject.chapters?.map((ch) => (
                        <div key={ch.id} className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-electric-400" />
                            <span className="font-semibold text-white">{ch.name}</span>
                            <span className="text-neutral-400">Pages {ch.startPage}–{ch.endPage}</span>
                            <Badge variant={ch.difficulty === 'Easy' ? 'glass' : ch.difficulty === 'Medium' ? 'electric' : 'neutral'} size="sm">
                              {ch.totalPages} Pages &bull; {ch.difficulty}
                            </Badge>
                          </div>
                          <button
                            onClick={() => handleRemoveChapter(activeSubject.id, ch.id)}
                            className="p-1 text-neutral-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/10">
          {step > 1 ? (
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : <div />}

          {step < 7 ? (
            <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />} onClick={handleNextStep}>
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              icon={<CheckCircle2 className="w-5 h-5" />}
              onClick={handleFinishSetup}
            >
              Complete Setup & Enter Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
