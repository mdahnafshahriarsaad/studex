import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, ChapterDifficulty, SubjectItem, Chapter } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { calculateTotalPages } from '../services/plannerEngine';
import {
  BookOpen, Plus, Trash2, Edit3, ArrowUp, ArrowDown, Layers, ChevronDown, ChevronUp, CheckSquare, Square, Save, X, AlertTriangle, GripVertical, RotateCcw
} from 'lucide-react';

interface SubjectsPageProps {
  profile: UserProfile;
  onAddSubject: (name: string) => void;
  onEditSubject: (subjectId: string, newName: string) => void;
  onRemoveSubject: (id: string) => void;
  onReorderSubjects: (subjectId: string, direction: 'up' | 'down') => void;
  onAddChapter: (subjectId: string, name: string, startPage: number, endPage: number, difficulty: ChapterDifficulty) => void;
  onRemoveChapter: (subjectId: string, chapterId: string) => void;
  onEditChapter: (subjectId: string, chapterId: string, updates: { name?: string; startPage?: number; endPage?: number; difficulty?: ChapterDifficulty }) => void;
  onReorderChapters: (subjectId: string, chapterId: string, direction: 'up' | 'down') => void;
  onToggleChapterComplete: (subjectId: string, chapterId: string) => void;
}

// ─── Delete Confirmation Modal ──────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-panel p-6 rounded-2xl border border-white/10 max-w-sm w-full shadow-glass-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-base font-bold text-white">Confirm Delete</h3>
        </div>
        <p className="text-sm text-neutral-300 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm text-neutral-300 bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 transition"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Custom Subject Modal ──────────────────────────────────────────────────

function CustomSubjectModal({ onSave, onCancel }: { onSave: (name: string, desc: string, chapterCount: number) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [chapterCount, setChapterCount] = useState(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-panel p-6 rounded-2xl border border-white/10 max-w-md w-full shadow-glass-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-electric-400" />
          Add Custom Subject
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">Subject Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ICT, Accounting"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-neutral-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">Number of Chapters</label>
            <input
              type="number"
              min={0}
              max={50}
              value={chapterCount}
              onChange={(e) => setChapterCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">Description (Optional)</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Brief description of this subject..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-neutral-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm text-neutral-300 bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              if (!name.trim()) return;
              onSave(name.trim(), desc.trim(), chapterCount);
            }}
          >
            Save
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Chapter Inline ───────────────────────────────────────────────────

function EditChapterForm({
  chapter,
  onSave,
  onCancel,
}: {
  chapter: Chapter;
  onSave: (updates: { name?: string; startPage?: number; endPage?: number; difficulty?: ChapterDifficulty }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(chapter.name);
  const [startPage, setStartPage] = useState(chapter.startPage);
  const [endPage, setEndPage] = useState(chapter.endPage);
  const [difficulty, setDifficulty] = useState<ChapterDifficulty>(chapter.difficulty);
  const [error, setError] = useState('');

  const pages = calculateTotalPages(startPage, endPage);

  return (
    <div className="p-3 rounded-xl bg-white/5 border border-electric-500/30 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sm:col-span-5 px-3 py-2 rounded-xl glass-input text-xs"
          autoFocus
        />
        <div className="sm:col-span-3 flex items-center gap-1">
          <input
            type="number"
            min={1}
            value={startPage}
            onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
            className="w-full px-2 py-2 rounded-xl glass-input text-xs text-center"
          />
          <span className="text-neutral-500 text-xs">-</span>
          <input
            type="number"
            min={1}
            value={endPage}
            onChange={(e) => setEndPage(parseInt(e.target.value) || 1)}
            className="w-full px-2 py-2 rounded-xl glass-input text-xs text-center"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as ChapterDifficulty)}
          className="sm:col-span-2 px-2 py-2 rounded-xl glass-input text-xs bg-black text-white"
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <button
          onClick={() => {
            if (!name.trim()) { setError('Enter chapter name'); return; }
            if (endPage < startPage) { setError('End page must be >= start page'); return; }
            onSave({ name: name.trim(), startPage, endPage, difficulty });
          }}
          className="sm:col-span-2 px-3 py-2 rounded-xl bg-electric-500 text-black font-semibold text-xs hover:bg-electric-400 transition"
        >
          Save
        </button>
      </div>
      <div className="flex items-center justify-between px-1">
        {error && <span className="text-xs text-red-400">{error}</span>}
        {!error && <span />}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-neutral-400">Total Pages: {pages}</span>
          <button onClick={onCancel} className="text-neutral-500 hover:text-white transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main SubjectsPage ─────────────────────────────────────────────────────

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  profile,
  onAddSubject,
  onEditSubject,
  onRemoveSubject,
  onReorderSubjects,
  onAddChapter,
  onRemoveChapter,
  onEditChapter,
  onReorderChapters,
  onToggleChapterComplete,
}) => {
  const [expandedSubjectId, setExpandedSubjectId] = useState<string>(profile.subjects[0]?.id || '');

  // Edit Subject Inline State
  const [editingSubjId, setEditingSubjId] = useState<string | null>(null);
  const [editingSubjName, setEditingSubjName] = useState<string>('');

  // Add chapter form state
  const [chName, setChName] = useState('');
  const [chStart, setChStart] = useState(1);
  const [chEnd, setChEnd] = useState(10);
  const [chDiff, setChDiff] = useState<ChapterDifficulty>('Medium');
  const [chError, setChError] = useState('');
  const [chFormSubjectId, setChFormSubjectId] = useState<string>(profile.subjects[0]?.id || '');

  // Edit chapter state
  const [editingChapterKey, setEditingChapterKey] = useState<string | null>(null); // "subjectId:chapterId"

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'subject' | 'chapter'; id: string; parentId?: string; name: string } | null>(null);

  // Custom subject modal
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Page calculation display
  const [showPageCalc, setShowPageCalc] = useState(false);

  const handleAddSubj = (name: string) => {
    if (!name.trim()) return;
    onAddSubject(name.trim());
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

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'subject') {
      onRemoveSubject(deleteConfirm.id);
      if (expandedSubjectId === deleteConfirm.id) {
        const remaining = profile.subjects.filter(s => s.id !== deleteConfirm.id);
        setExpandedSubjectId(remaining[0]?.id || '');
      }
    } else if (deleteConfirm.type === 'chapter' && deleteConfirm.parentId) {
      onRemoveChapter(deleteConfirm.parentId, deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            message={`Are you sure you want to delete ${deleteConfirm.type === 'subject' ? 'the subject' : 'this chapter'} "${deleteConfirm.name}"? This action cannot be undone.`}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Custom Subject Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <CustomSubjectModal
            onSave={(name, _desc, _count) => {
              handleAddSubj(name);
              setShowCustomModal(false);
            }}
            onCancel={() => setShowCustomModal(false)}
          />
        )}
      </AnimatePresence>

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
            defaultValue=""
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if (val.trim()) {
                  handleAddSubj(val);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
            placeholder="Quick add subject name (e.g. ICT, Accounting)"
            className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-neutral-500"
          />
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCustomModal(true)}>
            + Custom Subject
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
                    onClick={() => setDeleteConfirm({ type: 'subject', id: subj.id, name: subj.name })}
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
                      value={chFormSubjectId === subj.id ? chName : ''}
                      onChange={(e) => {
                        setChFormSubjectId(subj.id);
                        setChName(e.target.value);
                      }}
                      onFocus={() => setChFormSubjectId(subj.id)}
                      placeholder="Chapter Name"
                      className="sm:col-span-5 px-3 py-2 rounded-xl glass-input text-xs"
                    />

                    <div className="sm:col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={chFormSubjectId === subj.id ? chStart : 1}
                        onChange={(e) => {
                          setChFormSubjectId(subj.id);
                          setChStart(parseInt(e.target.value) || 1);
                        }}
                        onFocus={() => setChFormSubjectId(subj.id)}
                        className="w-full px-2 py-2 rounded-xl glass-input text-xs text-center"
                        title="Start Page"
                      />
                      <span className="text-neutral-500 text-xs">-</span>
                      <input
                        type="number"
                        min={1}
                        value={chFormSubjectId === subj.id ? chEnd : 10}
                        onChange={(e) => {
                          setChFormSubjectId(subj.id);
                          setChEnd(parseInt(e.target.value) || 1);
                        }}
                        onFocus={() => setChFormSubjectId(subj.id)}
                        className="w-full px-2 py-2 rounded-xl glass-input text-xs text-center"
                        title="End Page"
                      />
                    </div>

                    <select
                      value={chFormSubjectId === subj.id ? chDiff : 'Medium'}
                      onChange={(e) => {
                        setChFormSubjectId(subj.id);
                        setChDiff(e.target.value as ChapterDifficulty);
                      }}
                      onFocus={() => setChFormSubjectId(subj.id)}
                      className="sm:col-span-2 px-2 py-2 rounded-xl glass-input text-xs bg-black text-white"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setChFormSubjectId(subj.id);
                        handleAddCh(subj.id);
                      }}
                      className="sm:col-span-2 px-3 py-2 rounded-xl bg-electric-500 text-black font-semibold text-xs hover:bg-electric-400 transition"
                    >
                      Add Chapter
                    </button>
                  </div>

                  {/* Page Calculation Display */}
                  {chFormSubjectId === subj.id && (chStart || chEnd) && (
                    <div className="text-[11px] text-neutral-400 flex items-center justify-between px-1">
                      <span>Formula: End Page - Start Page + 1</span>
                      <span className="text-electric-400 font-semibold">
                        {chEnd >= chStart ? `Total Pages: ${chEnd - chStart + 1}` : 'Invalid range'}
                      </span>
                    </div>
                  )}

                  {/* Chapter List */}
                  <div className="space-y-2">
                    {subj.chapters?.length === 0 ? (
                      <p className="text-xs text-neutral-500 text-center py-2">No chapters added yet.</p>
                    ) : (
                      subj.chapters?.map((ch, chIdx) => {
                        const editKey = `${subj.id}:${ch.id}`;
                        const isEditingChapter = editingChapterKey === editKey;

                        return (
                          <div key={ch.id}>
                            {/* Edit Chapter Form */}
                            {isEditingChapter && (
                              <EditChapterForm
                                chapter={ch}
                                onSave={(updates) => {
                                  onEditChapter(subj.id, ch.id, updates);
                                  setEditingChapterKey(null);
                                }}
                                onCancel={() => setEditingChapterKey(null)}
                              />
                            )}

                            {/* Chapter Row */}
                            {!isEditingChapter && (
                              <div
                                className={`flex items-center justify-between p-3 rounded-xl border transition text-xs ${
                                  ch.completed
                                    ? 'bg-electric-500/10 border-electric-500/30'
                                    : 'bg-black/50 border-white/10'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Chapter Reorder */}
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      disabled={chIdx === 0}
                                      onClick={() => onReorderChapters(subj.id, ch.id, 'up')}
                                      className="p-0.5 text-neutral-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      disabled={chIdx === (subj.chapters?.length || 1) - 1}
                                      onClick={() => onReorderChapters(subj.id, ch.id, 'down')}
                                      className="p-0.5 text-neutral-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>

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

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setEditingChapterKey(editKey)}
                                    className="p-1 text-neutral-500 hover:text-white transition"
                                    title="Edit Chapter"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ type: 'chapter', id: ch.id, parentId: subj.id, name: ch.name })}
                                    className="p-1 text-neutral-500 hover:text-red-400 transition"
                                    title="Delete Chapter"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
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
