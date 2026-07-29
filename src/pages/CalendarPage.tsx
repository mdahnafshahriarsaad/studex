import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, Check, Calendar,
  Clock, BookOpen, Flag, FileText, Search, Filter,
  ChevronDown, Grip, AlertTriangle, CalendarDays,
  BarChart2, Trash2, Edit3, MoveRight, CheckCircle2,
  Circle, MinusCircle, XCircle, Zap
} from 'lucide-react';
import { useCalendarStore, getTodayStr, formatDate, useDayData } from '../hooks/useCalendarStore';
import { StudyPlan, StudySession, StudyPriority, CalendarView, StudyStatus } from '../types/calendar';
import { useUserStore } from '../hooks/useUserStore';

// ─── helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const PRIORITY_COLORS: Record<StudyPriority, string> = {
  Low: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  Medium: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  High: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
};
const STATUS_DOT: Record<StudyStatus, string> = {
  planned: 'bg-blue-400',
  completed: 'bg-emerald-400',
  partial: 'bg-amber-400',
  missed: 'bg-rose-400',
  none: 'bg-neutral-700',
};
const STATUS_LABEL: Record<StudyStatus, string> = {
  planned: 'Planned',
  completed: 'Completed',
  partial: 'Partial',
  missed: 'Missed',
  none: 'No Study',
};
const STATUS_BG: Record<StudyStatus, string> = {
  planned: 'border-blue-500/30 bg-blue-500/8',
  completed: 'border-emerald-500/30 bg-emerald-500/8',
  partial: 'border-amber-500/30 bg-amber-500/8',
  missed: 'border-rose-500/30 bg-rose-500/8',
  none: 'border-white/5 bg-white/2',
};

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Plan Form ────────────────────────────────────────────────────────────────
interface PlanFormProps {
  initialDate: string;
  subjects: string[];
  onSave: (plan: Omit<StudyPlan, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  existing?: StudyPlan;
}

const PlanForm: React.FC<PlanFormProps> = ({ initialDate, subjects, onSave, onClose, existing }) => {
  const [subjectName, setSubjectName] = useState(existing?.subjectName || '');
  const [chapterName, setChapterName] = useState(existing?.chapterName || '');
  const [pageStart, setPageStart] = useState(existing?.pageStart?.toString() || '');
  const [pageEnd, setPageEnd] = useState(existing?.pageEnd?.toString() || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(existing?.estimatedMinutes?.toString() || '60');
  const [priority, setPriority] = useState<StudyPriority>(existing?.priority || 'Medium');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [date, setDate] = useState(existing?.date || initialDate);
  const [err, setErr] = useState('');

  const handleSave = () => {
    if (!subjectName.trim()) return setErr('Subject is required.');
    if (!chapterName.trim()) return setErr('Chapter is required.');
    const ps = parseInt(pageStart) || 0;
    const pe = parseInt(pageEnd) || 0;
    const em = parseInt(estimatedMinutes) || 60;
    if (ps > pe && ps > 0 && pe > 0) return setErr('Start page must be ≤ end page.');
    setErr('');
    onSave({ date, subjectName: subjectName.trim(), chapterName: chapterName.trim(), pageStart: ps, pageEnd: pe || ps, estimatedMinutes: em, priority, notes: notes.trim() || undefined });
    onClose();
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none transition";
  const labelCls = "block text-xs text-neutral-400 font-medium mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-xl" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-md bg-black/95 border border-white/15 rounded-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{existing ? 'Edit Plan' : 'Add Study Plan'}</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {err && <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{err}</div>}

        <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subject *</label>
            {subjects.length > 0 ? (
              <select value={subjectName} onChange={e => setSubjectName(e.target.value)} className={`${inputCls} bg-neutral-900`}>
                <option value="">Select a subject...</option>
                {subjects.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                <option value="__custom__">Custom subject...</option>
              </select>
            ) : (
              <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Physics" className={inputCls} />
            )}
            {subjectName === '__custom__' && (
              <input type="text" onChange={e => setSubjectName(e.target.value)} placeholder="Enter subject name..." className={`${inputCls} mt-2`} autoFocus />
            )}
          </div>
          <div>
            <label className={labelCls}>Chapter *</label>
            <input type="text" value={chapterName} onChange={e => setChapterName(e.target.value)} placeholder="e.g. Motion" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Page Start</label>
              <input type="number" value={pageStart} onChange={e => setPageStart(e.target.value)} placeholder="20" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Page End</label>
              <input type="number" value={pageEnd} onChange={e => setPageEnd(e.target.value)} placeholder="30" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Estimated Time (minutes)</label>
            <input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} placeholder="60" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as StudyPriority[]).map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${priority === p ? PRIORITY_COLORS[p] : 'border-white/10 text-neutral-400 hover:border-white/20'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this session..." rows={2}
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 text-sm font-medium transition">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-electric-600 to-electric-500 text-black text-sm font-bold hover:brightness-110 transition">
            {existing ? 'Save Changes' : 'Add Plan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Session Form ─────────────────────────────────────────────────────────────
interface SessionFormProps {
  initialDate: string;
  subjects: string[];
  onSave: (s: Omit<StudySession, 'id' | 'completedAt'>) => void;
  onClose: () => void;
  linkedPlanId?: string;
  prefill?: Partial<StudyPlan>;
}

const SessionForm: React.FC<SessionFormProps> = ({ initialDate, subjects, onSave, onClose, linkedPlanId, prefill }) => {
  const [subjectName, setSubjectName] = useState(prefill?.subjectName || '');
  const [chapterName, setChapterName] = useState(prefill?.chapterName || '');
  const [pageStart, setPageStart] = useState(prefill?.pageStart?.toString() || '');
  const [pageEnd, setPageEnd] = useState(prefill?.pageEnd?.toString() || '');
  const [pagesCompleted, setPagesCompleted] = useState('');
  const [minutesStudied, setMinutesStudied] = useState(prefill?.estimatedMinutes?.toString() || '60');
  const [notes, setNotes] = useState('');

  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:border-emerald-400 focus:outline-none transition";
  const labelCls = "block text-xs text-neutral-400 font-medium mb-1";

  const handleSave = () => {
    const ps = parseInt(pageStart) || 0;
    const pe = parseInt(pageEnd) || 0;
    const pc = parseInt(pagesCompleted) || (pe - ps + 1 > 0 ? pe - ps + 1 : 0);
    onSave({ date: initialDate, planId: linkedPlanId, subjectName: subjectName.trim() || 'Study Session', chapterName: chapterName.trim() || 'Session', pagesCompleted: pc, pageStart: ps, pageEnd: pe || ps, minutesStudied: parseInt(minutesStudied) || 60, notes: notes.trim() || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-xl" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-md bg-black/95 border border-emerald-500/25 rounded-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">Log Study Session</h3>
            <p className="text-xs text-emerald-400 mt-0.5">What did you complete today?</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className={labelCls}>Subject</label>
            {subjects.length > 0 ? (
              <select value={subjectName} onChange={e => setSubjectName(e.target.value)} className={`${inputCls} bg-neutral-900`}>
                <option value="">Select subject...</option>
                {subjects.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
              </select>
            ) : (
              <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Physics" className={inputCls} />
            )}
          </div>
          <div>
            <label className={labelCls}>Chapter</label>
            <input type="text" value={chapterName} onChange={e => setChapterName(e.target.value)} placeholder="e.g. Motion" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Page Start</label>
              <input type="number" value={pageStart} onChange={e => setPageStart(e.target.value)} placeholder="20" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Page End</label>
              <input type="number" value={pageEnd} onChange={e => setPageEnd(e.target.value)} placeholder="27" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Pages Completed</label>
            <input type="number" value={pagesCompleted} onChange={e => setPagesCompleted(e.target.value)} placeholder="Auto from start–end" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Time Studied (minutes)</label>
            <input type="number" value={minutesStudied} onChange={e => setMinutesStudied(e.target.value)} placeholder="55" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Need revision tomorrow" rows={2}
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white text-sm font-medium transition">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold hover:brightness-110 transition">
            Save Session
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Missed Task Modal ────────────────────────────────────────────────────────
interface MissedModalProps {
  plans: StudyPlan[];
  onAction: (planId: string, action: 'tomorrow' | 'reschedule' | 'cancel', newDate?: string) => void;
  onClose: () => void;
}
const MissedModal: React.FC<MissedModalProps> = ({ plans, onAction, onClose }) => {
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  if (plans.length === 0) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-md bg-black/95 border border-rose-500/30 rounded-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Missed Study Tasks</h3>
            <p className="text-xs text-neutral-400">{plans.length} task{plans.length > 1 ? 's' : ''} need your attention</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 rounded-full bg-white/5 text-neutral-400 hover:text-white transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {plans.map(plan => (
            <div key={plan.id} className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">{plan.subjectName}</p>
                  <p className="text-xs text-neutral-400">{plan.chapterName} · Pages {plan.pageStart}–{plan.pageEnd}</p>
                  <p className="text-xs text-rose-400 mt-0.5">Missed on {new Date(plan.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              {rescheduleId === plan.id ? (
                <div className="flex gap-2 mt-2">
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-electric-400 focus:outline-none" />
                  <button onClick={() => { if (newDate) { onAction(plan.id, 'reschedule', newDate); setRescheduleId(null); setNewDate(''); }}}
                    className="px-3 py-2 rounded-xl bg-electric-500/20 border border-electric-500/30 text-electric-400 text-xs font-semibold hover:bg-electric-500/30 transition">Go</button>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => onAction(plan.id, 'tomorrow', addDays(getTodayStr(), 1))}
                    className="flex-1 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/25 transition">Tomorrow</button>
                  <button onClick={() => setRescheduleId(plan.id)}
                    className="flex-1 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition">Reschedule</button>
                  <button onClick={() => onAction(plan.id, 'cancel')}
                    className="flex-1 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/25 transition">Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Status Icon ─────────────────────────────────────────────────────────────
const StatusIcon: React.FC<{ status: StudyStatus; size?: number }> = ({ status, size = 16 }) => {
  const s = size;
  if (status === 'completed') return <CheckCircle2 style={{ width: s, height: s }} className="text-emerald-400" />;
  if (status === 'partial') return <MinusCircle style={{ width: s, height: s }} className="text-amber-400" />;
  if (status === 'missed') return <XCircle style={{ width: s, height: s }} className="text-rose-400" />;
  if (status === 'planned') return <Circle style={{ width: s, height: s }} className="text-blue-400" />;
  return <Circle style={{ width: s, height: s }} className="text-neutral-600" />;
};

// ─── Day Detail Panel ─────────────────────────────────────────────────────────
interface DayPanelProps {
  dateStr: string;
  subjects: string[];
  store: ReturnType<typeof useCalendarStore>;
  onAddPlan: () => void;
  onLogSession: () => void;
}

const DayPanel: React.FC<DayPanelProps> = ({ dateStr, subjects, store, onAddPlan, onLogSession }) => {
  const today = getTodayStr();
  const isPast = dateStr < today;
  const isToday = dateStr === today;
  const isFuture = dateStr > today;
  const dayData = useDayData(store.plans, store.sessions, dateStr);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest mb-0.5">
              {isToday ? 'Today' : isPast ? 'Study History' : 'Upcoming Study'}
            </p>
            <h3 className="text-base font-bold text-white leading-tight">
              {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusIcon status={dayData.status} size={18} />
            <span className={`text-xs font-semibold ${
              dayData.status === 'completed' ? 'text-emerald-400' :
              dayData.status === 'partial' ? 'text-amber-400' :
              dayData.status === 'missed' ? 'text-rose-400' :
              dayData.status === 'planned' ? 'text-blue-400' : 'text-neutral-500'
            }`}>{STATUS_LABEL[dayData.status]}</span>
          </div>
        </div>
        {/* Summary bar */}
        {(dayData.plans.length > 0 || dayData.sessions.length > 0) && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/8">
              <p className="text-lg font-bold text-white">{dayData.plans.length}</p>
              <p className="text-[10px] text-neutral-400">Plans</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/8">
              <p className="text-lg font-bold text-white">{formatMinutes(dayData.totalPlannedMinutes || dayData.totalStudiedMinutes)}</p>
              <p className="text-[10px] text-neutral-400">Target</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/8">
              <p className="text-lg font-bold text-white">{dayData.completionPercent}%</p>
              <p className="text-[10px] text-neutral-400">Done</p>
            </div>
          </div>
        )}
        {dayData.totalPlannedMinutes > 0 && (
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${dayData.status === 'completed' ? 'bg-emerald-400' : dayData.status === 'partial' ? 'bg-amber-400' : 'bg-blue-400'}`}
              style={{ width: `${Math.min(100, dayData.completionPercent)}%` }} />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4 flex-shrink-0">
        <button onClick={onAddPlan}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/25 transition">
          <Plus className="w-3.5 h-3.5" /> Add Plan
        </button>
        <button onClick={onLogSession}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition">
          <Check className="w-3.5 h-3.5" /> Log Session
        </button>
      </div>

      {/* Plans */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {dayData.plans.length > 0 && (
          <div>
            <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-2">Study Plans</p>
            <div className="space-y-2">
              {dayData.plans.map(plan => (
                <div key={plan.id} className={`p-3 rounded-2xl border transition group ${STATUS_BG['planned']}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${PRIORITY_COLORS[plan.priority]}`}>{plan.priority}</span>
                        <span className="text-xs font-bold text-white truncate">{plan.subjectName}</span>
                      </div>
                      <p className="text-xs text-neutral-300">{plan.chapterName}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-400">
                        <span>pp. {plan.pageStart}–{plan.pageEnd}</span>
                        <span>·</span>
                        <span>{formatMinutes(plan.estimatedMinutes)}</span>
                      </div>
                      {plan.notes && <p className="text-[10px] text-neutral-500 mt-1 italic">"{plan.notes}"</p>}
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => store.deletePlan(plan.id)} className="p-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dayData.sessions.length > 0 && (
          <div>
            <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-2">Completed Sessions</p>
            <div className="space-y-2">
              {dayData.sessions.map(sess => (
                <div key={sess.id} className={`p-3 rounded-2xl border ${STATUS_BG['completed']} group`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-white truncate">{sess.subjectName}</span>
                      </div>
                      <p className="text-xs text-neutral-300">{sess.chapterName}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-400">
                        <span>{sess.pagesCompleted} pages done</span>
                        <span>·</span>
                        <span>{formatMinutes(sess.minutesStudied)}</span>
                      </div>
                      {sess.notes && <p className="text-[10px] text-neutral-500 mt-1 italic">"{sess.notes}"</p>}
                    </div>
                    <button onClick={() => store.deleteSession(sess.id)} className="p-1 rounded-lg bg-rose-500/15 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-500/25 transition">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dayData.plans.length === 0 && dayData.sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <CalendarDays className="w-6 h-6 text-neutral-500" />
            </div>
            <p className="text-sm text-neutral-400 font-medium">
              {isFuture ? 'Nothing planned yet' : isToday ? 'No study planned today' : 'No study on this day'}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              {isFuture || isToday ? 'Tap "Add Plan" to schedule study' : 'Tap "Log Session" to record past study'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Month View ───────────────────────────────────────────────────────────────
interface MonthViewProps {
  year: number;
  month: number;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  getStatus: (d: string) => StudyStatus;
  dragOverDate: string | null;
  onDragOver: (d: string) => void;
  onDrop: (d: string) => void;
  onDragLeave: () => void;
  draggingPlanId: string | null;
}

const MonthView: React.FC<MonthViewProps> = ({ year, month, selectedDate, onSelectDate, getStatus, dragOverDate, onDragOver, onDrop, onDragLeave, draggingPlanId }) => {
  const today = getTodayStr();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex-1">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-neutral-500 uppercase tracking-widest py-2">{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={i} />;
          const status = getStatus(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isPast = dateStr < today;
          const isDragTarget = dragOverDate === dateStr && draggingPlanId;
          const dayNum = parseInt(dateStr.split('-')[2]);

          return (
            <motion.button
              key={dateStr}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectDate(dateStr)}
              onDragOver={e => { e.preventDefault(); onDragOver(dateStr); }}
              onDrop={() => onDrop(dateStr)}
              onDragLeave={onDragLeave}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-200 select-none
                ${isSelected ? 'bg-electric-500/25 border-2 border-electric-400 text-white shadow-[0_0_20px_rgba(0,240,255,0.3)]' : ''}
                ${!isSelected && isToday ? 'border-2 border-electric-500/60 text-electric-300' : ''}
                ${!isSelected && !isToday ? 'border border-white/5 hover:border-white/15 hover:bg-white/5' : ''}
                ${isPast && !isSelected && !isToday ? 'text-neutral-400' : !isPast && !isSelected ? 'text-white' : ''}
                ${isDragTarget ? 'border-2 border-blue-400 bg-blue-500/20 scale-105' : ''}
              `}
            >
              {isToday && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-electric-400 shadow-[0_0_8px_rgba(0,240,255,0.8)] border border-black" />
              )}
              <span className={`text-xs md:text-sm ${isToday && !isSelected ? 'text-electric-300 font-bold' : ''}`}>{dayNum}</span>
              {status !== 'none' && (
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Week View ────────────────────────────────────────────────────────────────
interface WeekViewProps {
  weekStart: string;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  getStatus: (d: string) => StudyStatus;
  getPlans: (d: string) => StudyPlan[];
}

const WeekView: React.FC<WeekViewProps> = ({ weekStart, selectedDate, onSelectDate, getStatus, getPlans }) => {
  const today = getTodayStr();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-7 gap-2">
        {days.map(dateStr => {
          const status = getStatus(dateStr);
          const plans = getPlans(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const d = new Date(dateStr + 'T00:00:00');
          return (
            <button key={dateStr} onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col items-center p-2 rounded-2xl border transition-all min-h-[120px] text-left
                ${isSelected ? 'border-electric-400 bg-electric-500/15' : isToday ? 'border-electric-500/50 bg-electric-500/5' : 'border-white/8 hover:border-white/15 hover:bg-white/3'}
              `}>
              <span className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isToday ? 'text-electric-400' : 'text-neutral-400'}`}>
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-lg font-bold mb-2 ${isToday ? 'text-electric-300' : 'text-white'}`}>
                {d.getDate()}
                {isToday && <span className="ml-1 w-1.5 h-1.5 inline-block rounded-full bg-electric-400 shadow-[0_0_8px_rgba(0,240,255,0.8)] align-middle" />}
              </span>
              <div className="w-full space-y-1 overflow-hidden">
                {plans.slice(0, 3).map(p => (
                  <div key={p.id} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate ${PRIORITY_COLORS[p.priority]}`}>
                    {p.subjectName}
                  </div>
                ))}
                {plans.length > 3 && <div className="text-[10px] text-neutral-500 px-1">+{plans.length - 3} more</div>}
              </div>
              {status !== 'none' && <span className={`mt-auto pt-1 w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Day View ─────────────────────────────────────────────────────────────────
interface DayViewProps {
  dateStr: string;
  plans: StudyPlan[];
  sessions: StudySession[];
  onDragStart: (planId: string) => void;
}

const DayViewComponent: React.FC<DayViewProps> = ({ dateStr, plans, sessions, onDragStart }) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6am–midnight
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative">
        {hours.map(h => (
          <div key={h} className="flex gap-3 min-h-[56px] border-b border-white/5">
            <span className="text-[10px] text-neutral-600 w-10 flex-shrink-0 pt-1 text-right font-mono">
              {h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}
            </span>
            <div className="flex-1 relative">
              {plans.filter(p => p.date === dateStr).map((plan, idx) => (
                <div key={plan.id}
                  draggable
                  onDragStart={() => onDragStart(plan.id)}
                  style={{ top: idx * 4 }}
                  className={`absolute left-0 right-0 mx-1 px-2 py-1 rounded-lg border text-[10px] font-semibold cursor-grab active:cursor-grabbing ${PRIORITY_COLORS[plan.priority]}`}>
                  {plan.subjectName} — {plan.chapterName}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main CalendarPage ────────────────────────────────────────────────────────
export const CalendarPage: React.FC = () => {
  const { profile } = useUserStore();
  const store = useCalendarStore();
  const today = getTodayStr();
  const todayDate = new Date();

  // View state
  const [view, setView] = useState<CalendarView>('month');
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);

  // Modal state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editPlan, setEditPlan] = useState<StudyPlan | undefined>();
  const [showMissed, setShowMissed] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | StudyStatus>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | StudyPriority>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Drag state
  const [draggingPlanId, setDraggingPlanId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Subjects from existing profile
  const subjects = useMemo(() => profile.subjects.map(s => s.name), [profile.subjects]);

  // Week start for week view
  const weekStart = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - d.getDay());
    return formatDate(d);
  }, [selectedDate]);

  // Missed plans
  const missedPlans = useMemo(() => store.getMissedPlans(), [store.plans, store.sessions]);

  // Navigation
  const navigate = useCallback((dir: 1 | -1) => {
    setSlideDir(dir);
    if (view === 'month') {
      let m = currentMonth + dir;
      let y = currentYear;
      if (m > 11) { m = 0; y++; }
      if (m < 0) { m = 11; y--; }
      setCurrentMonth(m);
      setCurrentYear(y);
    } else if (view === 'week') {
      setSelectedDate(prev => addDays(prev, dir * 7));
    } else {
      setSelectedDate(prev => addDays(prev, dir));
    }
  }, [view, currentMonth, currentYear]);

  // When selecting a date in month view, also update current month
  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    const d = new Date(dateStr + 'T00:00:00');
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  }, []);

  // Drag & drop handlers
  const handleDragStart = useCallback((planId: string) => setDraggingPlanId(planId), []);
  const handleDragOver = useCallback((dateStr: string) => setDragOverDate(dateStr), []);
  const handleDragLeave = useCallback(() => setDragOverDate(null), []);
  const handleDrop = useCallback((dateStr: string) => {
    if (draggingPlanId && dateStr) {
      store.movePlan(draggingPlanId, dateStr);
    }
    setDraggingPlanId(null);
    setDragOverDate(null);
  }, [draggingPlanId, store]);

  // Missed task action
  const handleMissedAction = useCallback((planId: string, action: 'tomorrow' | 'reschedule' | 'cancel', newDate?: string) => {
    if (action === 'cancel') {
      store.deletePlan(planId);
    } else if (newDate) {
      store.movePlan(planId, newDate);
    }
  }, [store]);

  // Today panel data
  const todayData = useDayData(store.plans, store.sessions, today);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const matchedPlans = store.plans.filter(p =>
      p.subjectName.toLowerCase().includes(q) ||
      p.chapterName.toLowerCase().includes(q) ||
      p.date.includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
    const matchedSessions = store.sessions.filter(s =>
      s.subjectName.toLowerCase().includes(q) ||
      s.chapterName.toLowerCase().includes(q) ||
      s.date.includes(q) ||
      s.notes?.toLowerCase().includes(q)
    );
    return { plans: matchedPlans, sessions: matchedSessions };
  }, [searchQuery, store.plans, store.sessions]);

  // Header title
  const headerTitle = useMemo(() => {
    if (view === 'month') return `${MONTHS[currentMonth]} ${currentYear}`;
    if (view === 'week') {
      const ws = new Date(weekStart + 'T00:00:00');
      const we = new Date(addDays(weekStart, 6) + 'T00:00:00');
      return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [view, currentMonth, currentYear, weekStart, selectedDate]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-screen select-none">
      {/* ── Left: Calendar ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Title + nav */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <AnimatePresence mode="wait">
              <motion.h2
                key={headerTitle}
                initial={{ opacity: 0, x: slideDir * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -slideDir * 20 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold text-white min-w-[180px] text-center"
              >
                {headerTitle}
              </motion.h2>
            </AnimatePresence>
            <button onClick={() => navigate(1)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => { setSelectedDate(today); setCurrentYear(todayDate.getFullYear()); setCurrentMonth(todayDate.getMonth()); }}
              className="px-3 py-1.5 rounded-lg bg-electric-500/15 border border-electric-500/30 text-electric-400 text-xs font-semibold hover:bg-electric-500/25 transition">
              Today
            </button>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            {/* View toggle */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs">
              {(['month', 'week', 'day'] as CalendarView[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition ${view === v ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30' : 'text-neutral-400 hover:text-white'}`}>
                  {v}
                </button>
              ))}
            </div>

            {/* Add plan */}
            <button onClick={() => setShowPlanForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-electric-600 to-electric-500 text-black text-xs font-bold hover:brightness-110 transition shadow-[0_0_16px_rgba(0,240,255,0.3)]">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Plan</span>
            </button>

            {/* Missed badge */}
            {missedPlans.length > 0 && (
              <button onClick={() => setShowMissed(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/25 transition">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{missedPlans.length}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search subjects, chapters, dates..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-neutral-600 focus:border-electric-400 focus:outline-none transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${showFilters ? 'bg-electric-500/15 border-electric-500/30 text-electric-400' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'}`}>
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white/3 border border-white/8">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 font-medium">Status:</span>
                  {(['all', 'planned', 'completed', 'partial', 'missed'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition border ${filterStatus === s ? 'bg-electric-500/20 border-electric-500/30 text-electric-400' : 'border-white/10 text-neutral-400 hover:border-white/20'}`}>
                      {s === 'all' ? 'All' : STATUS_LABEL[s as StudyStatus]}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 font-medium">Priority:</span>
                  {(['all', 'Low', 'Medium', 'High'] as const).map(p => (
                    <button key={p} onClick={() => setFilterPriority(p)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition border ${filterPriority === p ? (p === 'all' ? 'bg-electric-500/20 border-electric-500/30 text-electric-400' : PRIORITY_COLORS[p as StudyPriority]) : 'border-white/10 text-neutral-400 hover:border-white/20'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search results */}
        {searchQuery && !Array.isArray(searchResults) && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <p className="text-xs text-neutral-400 mb-3 font-medium">
              {(searchResults.plans.length + searchResults.sessions.length)} result{searchResults.plans.length + searchResults.sessions.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.plans.map(p => (
                <div key={p.id} onClick={() => { handleSelectDate(p.date); setSearchQuery(''); }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition border border-white/5">
                  <div className="p-1.5 rounded-lg bg-blue-500/15"><BookOpen className="w-3 h-3 text-blue-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{p.subjectName} — {p.chapterName}</p>
                    <p className="text-[10px] text-neutral-500">{new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[p.priority]}`}>{p.priority}</span>
                </div>
              ))}
              {searchResults.sessions.map(s => (
                <div key={s.id} onClick={() => { handleSelectDate(s.date); setSearchQuery(''); }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition border border-white/5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15"><CheckCircle2 className="w-3 h-3 text-emerald-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{s.subjectName} — {s.chapterName}</p>
                    <p className="text-[10px] text-neutral-500">{new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {s.pagesCompleted} pages · {formatMinutes(s.minutesStudied)}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                </div>
              ))}
              {searchResults.plans.length === 0 && searchResults.sessions.length === 0 && (
                <p className="text-xs text-neutral-500 text-center py-4">No matching study data found.</p>
              )}
            </div>
          </div>
        )}

        {/* Calendar body */}
        <div className="flex-1 glass-panel rounded-3xl border border-white/10 p-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${view}-${currentMonth}-${currentYear}-${weekStart}-${selectedDate}`}
              initial={{ opacity: 0, x: slideDir * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -slideDir * 30 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="h-full flex flex-col"
            >
              {view === 'month' && (
                <MonthView
                  year={currentYear} month={currentMonth}
                  selectedDate={selectedDate} onSelectDate={handleSelectDate}
                  getStatus={store.getStatusForDate}
                  dragOverDate={dragOverDate} draggingPlanId={draggingPlanId}
                  onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}
                />
              )}
              {view === 'week' && (
                <WeekView weekStart={weekStart} selectedDate={selectedDate} onSelectDate={handleSelectDate}
                  getStatus={store.getStatusForDate} getPlans={store.getPlansForDate} />
              )}
              {view === 'day' && (
                <DayViewComponent dateStr={selectedDate} plans={store.getPlansForDate(selectedDate)} sessions={store.getSessionsForDate(selectedDate)} onDragStart={handleDragStart} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-neutral-400">
          {(Object.entries(STATUS_DOT) as [StudyStatus, string][]).filter(([k]) => k !== 'none').map(([status, dot]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span>{STATUS_LABEL[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Day Detail Panel ─────────────────────────────── */}
      <div className="lg:w-80 xl:w-96 flex-shrink-0">
        {/* Today's Study Summary (always shown on desktop top) */}
        {selectedDate !== today && (
          <div className="glass-panel rounded-3xl border border-electric-500/20 p-4 mb-4 hidden lg:block">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-electric-400" />
              <span className="text-xs font-bold text-electric-400 uppercase tracking-widest">Today's Study</span>
            </div>
            {todayData.plans.length > 0 || todayData.sessions.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-center p-2 rounded-xl bg-white/5">
                    <p className="text-base font-bold text-white">{todayData.plans.length}</p>
                    <p className="text-[10px] text-neutral-400">Planned</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white/5">
                    <p className="text-base font-bold text-emerald-400">{todayData.completionPercent}%</p>
                    <p className="text-[10px] text-neutral-400">Complete</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-electric-600 to-electric-400 transition-all duration-700"
                    style={{ width: `${todayData.completionPercent}%` }} />
                </div>
                {formatMinutes(todayData.totalPlannedMinutes) && (
                  <p className="text-[11px] text-neutral-400 mt-2 text-center">{formatMinutes(todayData.totalPlannedMinutes)} planned · {formatMinutes(todayData.totalStudiedMinutes)} done</p>
                )}
              </>
            ) : (
              <p className="text-xs text-neutral-500 text-center py-2">No study planned for today. <button onClick={() => { setSelectedDate(today); setShowPlanForm(true); }} className="text-electric-400 underline">Add one?</button></p>
            )}
          </div>
        )}

        {/* Selected day panel */}
        <div className="glass-panel rounded-3xl border border-white/10 p-4 lg:h-[calc(100vh-200px)] flex flex-col overflow-hidden">
          <DayPanel
            dateStr={selectedDate}
            subjects={subjects}
            store={store}
            onAddPlan={() => setShowPlanForm(true)}
            onLogSession={() => setShowSessionForm(true)}
          />
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPlanForm && (
          <PlanForm
            initialDate={selectedDate}
            subjects={subjects}
            onSave={store.addPlan}
            onClose={() => { setShowPlanForm(false); setEditPlan(undefined); }}
            existing={editPlan}
          />
        )}
        {showSessionForm && (
          <SessionForm
            initialDate={selectedDate}
            subjects={subjects}
            onSave={store.addSession}
            onClose={() => setShowSessionForm(false)}
            prefill={store.getPlansForDate(selectedDate)[0]}
          />
        )}
        {showMissed && (
          <MissedModal
            plans={missedPlans}
            onAction={handleMissedAction}
            onClose={() => setShowMissed(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;
