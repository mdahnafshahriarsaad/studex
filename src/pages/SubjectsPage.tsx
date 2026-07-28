import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, ChapterDifficulty, SubjectItem } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { calculateTotalPages } from '../services/plannerEngine';
import {
  BookOpen, Plus, Trash2, Edit3, ArrowUp, ArrowDown, Layers, ChevronDown, ChevronUp, CheckSquare, Square, Save, X
} from 'lucide-react';

interface SubjectsPageProps {
  profile: UserProfile;
  onAddSubject: (name: string) => void;
  onEditSubject: (subjectId: string, newName: string) => void;
  onRemoveSubject: (id: string) => void;
  onReorderSubjects: (subjectId: string, direction: 'up' | 'down') => void;
  onAddChapter: (subjectId: string, name: string, startPage: number, endPage: number, difficulty: ChapterDifficulty) => void;
  onRemoveChapter: (subjectId: string, chapterId: string) => void;
  onToggleChapterComplete: (subjectId: string, chapterId: string) => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  profile,
  onAddSubject,
  onEditSubject,
  onRemoveSubject,
  onReorderSubjects,
  onAddChapter,
  onRemoveChapter,
  onToggleChapterComplete,
}) => {
  const [newSubject, setNewSubject] = useState('');
  const [expandedSubjectId, setExpandedSubjectId] = useState<string>(profile.subjects[0]?.id || '');

  // Edit Subject Modal State
  const [editingSubjId, setEditingSubjId] = useState<string | null>(null);
  const [editingSubjName, setEditingSubjName] = useState<string>('');

  // Add chapter form state
  const [chName, setChName] = useState('');
  const [chStart, setChStart] = useState(1);
  const [chEnd, setChEnd] = useState(10);
  const [chDiff, setChDiff] = useState<ChapterDifficulty>('Medium');
  const [chError, setChError] = useState('');

  const handleAddSubj = () => {
    if (!newSubject.trim()) return;
    onAddSubject(newSubject.trim());
    setNewSubject('');
  };

  const handleStartEdit = (subj: SubjectItem) => {
    setEditingSubjId(subj.id);
    setEditingSubjName(subj.name);
  };

  const handleSaveEdit = (subjId: string) => {
    if (editingSubjName.trim()) {
      onEditSubject(subjId, editingSubjName.trim());
    }
    setEditingSubjId(null);
  };

  const handleAddCh = (subjectId: string) => {
    if (!chName.trim()) {
      setChError('Please enter chapter name');
      return;
    }
    if (chEnd < chStart) {
      setChError('End page must be >= start page');
      return;
    }
    setChError('');
    onAddChapter(subjectId, chName.trim(), chStart, chEnd, chDiff);
    setChName('');
    setChStart(chEnd + 1);
    setChEnd(chEnd + 10);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Subject & Syllabus Management</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Manage chapters, reorder priorities, and track completion progress for <span className="text-electric-400 font-semibold">{profile.selectedClass}</span>.
          </p>
        </div>
        <Badge variant="electric">{profile.subjects.length} Enrolled Subjects</Badge>
      </div>

      {/* Add New Subject Bar */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubj()}
            placeholder="Add new subject name (e.g. ICT, Accounting, Higher Math)"
            className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-neutral-500"
          />
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={handleAddSubj}>
            Add Subject
          </Button>
        </div>
      </GlassCard>

      {/* Subjects List with Reordering & Chapters Accordion */}
      <div className="space-y-4">
        {profile.subjects.map((subj, idx) => {
          const isExpanded = expandedSubjectId === subj.id;
          const isEditing = editingSubjId === subj.id;

          return (
            <GlassCard key={subj.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                {/* Reorder Up/Down Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => onReorderSubjects(subj.id, 'up')}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-neutral-400 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === profile.subjects.length - 1}
                    onClick={() => onReorderSubjects(subj.id, 'down')}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-neutral-400 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subject Info or Edit Input */}
                <div className="flex-1 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400 cursor-pointer"
                    onClick={() => setExpandedSubjectId(isExpanded ? '' : subj.id)}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingSubjName}
                        onChange={(e) => setEditingSubjName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(subj.id)}
                        className="px-3 py-1.5 rounded-xl glass-input text-base text-white flex-1"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(subj.id)} className="p-2 text-emerald-400 hover:bg-white/10 rounded-lg">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingSubjId(null)} className="p-2 text-neutral-400 hover:bg-white/10 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="cursor-pointer" onClick={() => setExpandedSubjectId(isExpanded ? '' : subj.id)}>
                      <h3 className="font-bold text-lg text-white hover:text-electric-400 transition">{subj.name}</h3>
                      <span className="text-xs text-neutral-400">
                        {subj.completedChapters}/{subj.chapters?.length || 0} Chapters Completed &bull; {subj.completedPages}/{subj.totalPages} Pages (<strong className="text-electric-400">{subj.progressPercent}%</strong>)
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartEdit(subj)}
                    className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                    title="Edit Subject Name"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpandedSubjectId(isExpanded ? '' : subj.id)}
                    className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => onRemoveSubject(subj.id)}
                    className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-white/10 transition"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subject Progress Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-electric-600 to-electric-400 rounded-full transition-all duration-500"
                  style={{ width: `${subj.progressPercent}%` }}
                />
              </div>

              {/* Expanded Chapter Management */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="pt-4 border-t border-white/10 space-y-4"
                >
                  <h4 className="font-bold text-sm text-electric-400 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Chapters & Syllabus ({subj.chapters?.length || 0})
                  </h4>

                  {chError && <p className="text-xs text-red-400 font-medium">{chError}</p>}

                  {/* Add Chapter Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                    <input
                      type="text"
                      value={chName}
                      onChange={(e) => setChName(e.target.value)}
                      placeholder="Chapter Name"
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
                      onClick={() => handleAddCh(subj.id)}
                      className="sm:col-span-2 px-3 py-2 rounded-xl bg-electric-500 text-black font-semibold text-xs hover:bg-electric-400 transition"
                    >
                      Add Chapter
                    </button>
                  </div>

                  {/* Chapter List with Interactive Completion Checkboxes */}
                  <div className="space-y-2">
                    {subj.chapters?.length === 0 ? (
                      <p className="text-xs text-neutral-500 text-center py-2">No chapters added yet.</p>
                    ) : (
                      subj.chapters?.map((ch) => (
                        <div
                          key={ch.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition text-xs ${
                            ch.completed
                              ? 'bg-electric-500/10 border-electric-500/30'
                              : 'bg-black/50 border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => onToggleChapterComplete(subj.id, ch.id)}
                              className="text-electric-400 hover:text-white transition"
                              title={ch.completed ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {ch.completed ? <CheckSquare className="w-5 h-5 fill-electric-500/20" /> : <Square className="w-5 h-5 text-neutral-500" />}
                            </button>
                            <div>
                              <span className={`font-semibold block ${ch.completed ? 'line-through text-neutral-400' : 'text-white'}`}>
                                {ch.name}
                              </span>
                              <span className="text-neutral-400 text-[11px]">
                                Pages {ch.startPage}–{ch.endPage} &bull; ({ch.totalPages} Pages)
                              </span>
                            </div>
                            <Badge variant={ch.difficulty === 'Easy' ? 'glass' : ch.difficulty === 'Medium' ? 'electric' : 'neutral'} size="sm">
                              {ch.difficulty}
                            </Badge>
                          </div>

                          <button
                            onClick={() => onRemoveChapter(subj.id, ch.id)}
                            className="p-1 text-neutral-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
