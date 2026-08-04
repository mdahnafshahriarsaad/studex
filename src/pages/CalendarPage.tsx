import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, Check, Calendar,
  Clock, BookOpen, Flag, FileText, Search, Filter,
  AlertTriangle, CalendarDays, BarChart2, Trash2, Edit3,
  CheckCircle2, Circle, MinusCircle, XCircle, Zap,
  TrendingUp, Target, Flame, Copy, GripVertical,
  ChevronDown, ArrowRight, Play, Pause, SkipForward,
  LayoutGrid, List, GitBranch, CalendarRange, Eye,
  Timer, BookMarked, Award, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useCalendarStore, getTodayStr, addDays, useDayData } from '../hooks/useCalendarStore';
import { StudyPlan, StudySession, StudyPriority, CalendarView, StudyStatus, TaskStatus } from '../types/calendar';
import { useUserStore } from '../hooks/useUserStore';
import { generateAutoStudyPlan } from '../services/calendarEngine';
import { HeatmapDay, MonthlySummary } from '../services/calendarEngine';
import { GlassCard } from '../components/ui/GlassCard';

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
  none: 'bg-white/10',
};
const STATUS_LABEL: Record<StudyStatus, string> = {
  planned: 'Planned',
  completed: 'Completed',
  partial: 'Partial',
  missed: 'Missed',
  none: 'No Study',
};
const TASK_STATUS_ICON: Record<string, React.ReactNode> = {
  'todo': <Circle className="w-4 h-4 text-blue-400" />,
  'in-progress': <Pause className="w-4 h-4 text-amber-400" />,
  'completed': <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  'missed': <XCircle className="w-4 h-4 text-rose-400" />,
  'cancelled': <XCircle className="w-4 h-4 text-neutral-500" />,
};
const HEATMAP_COLORS: Record<string, string> = {
  'dark-green': 'bg-emerald-500',
  'light-green': 'bg-emerald-400/70',
  'yellow': 'bg-amber-400/70',
  'red': 'bg-rose-500/70',
  'grey': 'bg-white/8',
};

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

// ─── Circular Progress Ring ─────────────────────────────────────────────
const CircularProgress: React.FC<{ percent: number; size?: number; strokeWidth?: number; color?: string }> = ({
  percent, size = 64, strokeWidth = 5, color = '#00F0FF'
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-white font-bold" style={{ fontSize: size * 0.28, transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {percent}%
      </text>
    </svg>
  );
};

// ─── Plan Form ────────────────────────────────────────────────────────────
interface PlanFormProps {
  initialDate: string;
  subjects: { id: string; name: string; chapters: { id: string; name: string; startPage: number; endPage: number; difficulty: string; completed: boolean; completedPages?: number }[] }[];
  onSave: (plan: Omit<StudyPlan, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  existing?: StudyPlan;
}

const PlanForm: React.FC<PlanFormProps> = ({ initialDate, subjects, onSave, onClose, existing }) => {
  const [subjectIdx, setSubjectIdx] = useState(-1);
  const [chapterIdx, setChapterIdx] = useState(-1);
  const [customSubject, setCustomSubject] = useState('');
  const [customChapter, setCustomChapter] = useState('');
  const [pageStart, setPageStart] = useState(existing?.pageStart?.toString() || '');
  const [pageEnd, setPageEnd] = useState(existing?.pageEnd?.toString() || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(existing?.estimatedMinutes?.toString() || '60');
  const [priority, setPriority] = useState<StudyPriority>(existing?.priority || 'Medium');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [date, setDate] = useState(existing?.date || initialDate);
  const [err, setErr] = useState('');

  const selectedSubject = subjectIdx >= 0 ? subjects[subjectIdx] : null;
  const chapters = selectedSubject?.chapters.filter(c => !c.completed) || [];

  useEffect(() => {
    if (existing?.subjectName) {
      const idx = subjects.findIndex(s => s.name === existing.subjectName);
      if (idx >= 0) setSubjectIdx(idx);
      else setSubjectIdx(-2);
    }
  }, [existing, subjects]);

  const handleSave = () => {
    const sName = subjectIdx >= 0 ? subjects[subjectIdx].name : subjectIdx === -2 ? customSubject : '';
    const sId = subjectIdx >= 0 ? subjects[subjectIdx].id : undefined;
    if (!sName.trim()) return setErr('Subject is required.');

    let cName = customChapter;
    let cId: string | undefined;
    if (subjectIdx >= 0 && chapterIdx >= 0 && chapters[chapterIdx]) {
      cName = chapters[chapterIdx].name;
      cId = chapters[chapterIdx].id;
      const ch = chapters[chapterIdx];
      if (!pageStart) setPageStart(String(ch.startPage + (ch.completedPages || 0)));
      if (!pageEnd) setPageEnd(String(ch.endPage));
    }
    if (!cName.trim()) return setErr('Chapter is required.');

    const ps = parseInt(pageStart) || 0;
    const pe = parseInt(pageEnd) || 0;
    const em = parseInt(estimatedMinutes) || 60;
    if (ps > pe && ps > 0 && pe > 0) return setErr('Start page must be ≤ end page.');

    setErr('');
    onSave({
      date, subjectName: sName.trim(), chapterName: cName.trim(),
      pageStart: ps, pageEnd: pe || ps, estimatedMinutes: em, priority,
      notes: notes.trim() || undefined, status: 'todo',
      subjectId: sId, chapterId: cId, isAutoGenerated: false,
    });
    onClose();
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:border-electric-400 focus:outline-none transition';
  const labelCls = 'block text-xs text-neutral-400 font-medium mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-md bg-black/95 border border-white/15 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{existing ? 'Edit Task' : 'Add Study Task'}</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition">
            <X className="w-4 h-4" /></button>
        </div>
        {err && <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{err}</div>}
        <div className="space-y-3.5">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subject *</label>
            <select value={subjectIdx} onChange={e => { setSubjectIdx(Number(e.target.value)); setChapterIdx(-1); }} className={`${inputCls} bg-neutral-900`}>
              <option value={-1}>Select a subject...</option>
              {subjects.map((s, i) => <option key={s.id} value={i}>{s.name}</option>)}
              <option value={-2}>+ Custom subject</option>
            </select>
            {subjectIdx === -2 && <input type="text" value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="Subject name..." className={`${inputCls} mt-2`} autoFocus />}
          </div>
          {subjectIdx >= 0 && chapters.length > 0 && (
            <div>
              <label className={labelCls}>Chapter *</label>
              <select value={chapterIdx} onChange={e => setChapterIdx(Number(e.target.value))} className={`${inputCls} bg-neutral-900`}>
                <option value={-1}>Select chapter...</option>
                {chapters.map((c, i) => <option key={c.id} value={i}>{c.name} (pp. {c.startPage + (c.completedPages||0)}–{c.endPage})</option>)}
                <option value={-2}>+ Custom chapter</option>
              </select>
              {chapterIdx === -2 && <input type="text" value={customChapter} onChange={e => setCustomChapter(e.target.value)} placeholder="Chapter name..." className={`${inputCls} mt-2`} />}
            </div>
          )}
          {(subjectIdx < 0 || chapterIdx === -2) && (
            <div>
              <label className={labelCls}>Chapter *</label>
              <input type="text" value={chapterIdx === -2 ? customChapter : customChapter} onChange={e => setCustomChapter(e.target.value)} placeholder="e.g. Motion" className={inputCls} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Page Start</label><input type="number" value={pageStart} onChange={e => setPageStart(e.target.value)} placeholder="20" className={inputCls} /></div>
            <div><label className={labelCls}>Page End</label><input type="number" value={pageEnd} onChange={e => setPageEnd(e.target.value)} placeholder="30" className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Estimated Time (min)</label><input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} className={inputCls} /></div>
          <div>
            <label className={labelCls}>Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low','Medium','High'] as StudyPriority[]).map(p => (
                <button key={p} onClick={() => setPriority(p)} className={`py-2 rounded-xl text-xs font-semibold border transition ${priority === p ? PRIORITY_COLORS[p] : 'border-white/10 text-neutral-400 hover:border-white/20'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div><label className={labelCls}>Notes (optional)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." rows={2} className={`${inputCls} resize-none`} /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white text-sm font-medium transition">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-electric-600 to-electric-500 text-black text-sm font-bold hover:brightness-110 transition">{existing ? 'Save' : 'Add Task'}</button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Session Form ───────────────────────────────────────────────────────
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

  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:border-emerald-400 focus:outline-none transition';
  const labelCls = 'block text-xs text-neutral-400 font-medium mb-1';

  const handleSave = () => {
    const ps = parseInt(pageStart) || 0;
    const pe = parseInt(pageEnd) || 0;
    const pc = parseInt(pagesCompleted) || (pe - ps + 1 > 0 ? pe - ps + 1 : 0);
    onSave({
      date: initialDate, planId: linkedPlanId, subjectName: subjectName.trim() || 'Study',
      chapterName: chapterName.trim() || 'Session', pagesCompleted: pc, pageStart: ps, pageEnd: pe || ps,
      minutesStudied: parseInt(minutesStudied) || 60, notes: notes.trim() || undefined,
      subjectId: prefill?.subjectId, chapterId: prefill?.chapterId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-md bg-black/95 border border-emerald-500/25 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div><h3 className="text-lg font-bold text-white">Log Study Session</h3><p className="text-xs text-emerald-400 mt-0.5">What did you complete?</p></div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3.5">
          <div><label className={labelCls}>Subject</label>{subjects.length > 0 ? (
            <select value={subjectName} onChange={e => setSubjectName(e.target.value)} className={`${inputCls} bg-neutral-900`}><option value="">Select...</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
          ) : <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Physics" className={inputCls} />}</div>
          <div><label className={labelCls}>Chapter</label><input type="text" value={chapterName} onChange={e => setChapterName(e.target.value)} placeholder="e.g. Motion" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Page Start</label><input type="number" value={pageStart} onChange={e => setPageStart(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Page End</label><input type="number" value={pageEnd} onChange={e => setPageEnd(e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Pages Completed</label><input type="number" value={pagesCompleted} onChange={e => setPagesCompleted(e.target.value)} placeholder="Auto from start–end" className={inputCls} /></div>
          <div><label className={labelCls}>Time Studied (min)</label><input type="number" value={minutesStudied} onChange={e => setMinutesStudied(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." rows={2} className={`${inputCls} resize-none`} /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-400 text-sm">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold hover:brightness-110 transition">Save Session</button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Missed Task Modal ────────────────────────────────────────────────────
interface MissedModalProps {
  plans: StudyPlan[];
  onAction: (planId: string, action: 'tomorrow' | 'reschedule' | 'cancel' | 'redistribute', newDate?: string) => void;
  onClose: () => void;
}
const MissedModal: React.FC<MissedModalProps> = ({ plans, onAction, onClose }) => {
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  if (plans.length === 0) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-md bg-black/95 border border-rose-500/30 rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30"><AlertTriangle className="w-5 h-5 text-rose-400" /></div>
          <div><h3 className="text-base font-bold text-white">Missed Study Tasks</h3><p className="text-xs text-neutral-400">{plans.length} task{plans.length>1?'s':''} need attention</p></div>
          <button onClick={onClose} className="ml-auto p-2 rounded-full bg-white/5 text-neutral-400 hover:text-white transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {plans.map(plan => (
            <div key={plan.id} className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <p className="text-sm font-semibold text-white">{plan.subjectName}</p>
              <p className="text-xs text-neutral-400">{plan.chapterName} · pp. {plan.pageStart}–{plan.pageEnd}</p>
              <p className="text-xs text-rose-400 mt-0.5">Missed: {new Date(plan.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
              {rescheduleId === plan.id ? (
                <div className="flex gap-2 mt-2">
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-electric-400 focus:outline-none" />
                  <button onClick={() => { if(newDate){onAction(plan.id,'reschedule',newDate);setRescheduleId(null);} }} className="px-3 py-2 rounded-xl bg-electric-500/20 border border-electric-500/30 text-electric-400 text-xs font-semibold">Go</button>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => onAction(plan.id,'tomorrow',addDays(getTodayStr(),1))} className="flex-1 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">Tomorrow</button>
                  <button onClick={() => { onAction(plan.id,'redistribute'); }} className="flex-1 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">Redistribute</button>
                  <button onClick={() => setRescheduleId(plan.id)} className="flex-1 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold">Reschedule</button>
                  <button onClick={() => onAction(plan.id,'cancel')} className="flex-1 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Status Icon ─────────────────────────────────────────────────────────
const StatusIcon: React.FC<{ status: StudyStatus; size?: number }> = ({ status, size = 16 }) => {
  if (status === 'completed') return <CheckCircle2 style={{width:size,height:size}} className="text-emerald-400" />;
  if (status === 'partial') return <MinusCircle style={{width:size,height:size}} className="text-amber-400" />;
  if (status === 'missed') return <XCircle style={{width:size,height:size}} className="text-rose-400" />;
  if (status === 'planned') return <Circle style={{width:size,height:size}} className="text-blue-400" />;
  return <Circle style={{width:size,height:size}} className="text-white/15" />;
};

// ─── Heatmap Component ────────────────────────────────────────────────────
interface HeatmapProps { data: HeatmapDay[]; onDayClick: (date: string) => void; }
const Heatmap: React.FC<HeatmapProps> = ({ data, onDayClick }) => {
  // Group into weeks (52 weeks)
  const weeks: HeatmapDay[][] = [];
  let week: HeatmapDay[] = [];
  for (const d of data) {
    week.push(d);
    if (new Date(d.date + 'T00:00:00').getDay() === 6 || week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push(week);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-[3px] min-w-max">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {w.map(day => (
              <button key={day.date} onClick={() => onDayClick(day.date)} title={`${day.date}: ${day.completionPercent}%`}
                className={`w-[13px] h-[13px] rounded-[3px] transition-all duration-200 hover:scale-150 hover:ring-1 hover:ring-white/30 ${HEATMAP_COLORS[day.color]}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Month View ───────────────────────────────────────────────────────────
interface MonthViewProps {
  year: number; month: number; selectedDate: string; onSelectDate: (d: string) => void;
  getStatus: (d: string) => StudyStatus; getPlans: (d: string) => StudyPlan[];
  dragOverDate: string | null; onDragOver: (d: string) => void;
  onDrop: (d: string) => void; onDragLeave: () => void; draggingPlanId: string | null;
}

const MonthView: React.FC<MonthViewProps> = ({ year, month, selectedDate, onSelectDate, getStatus, getPlans, dragOverDate, onDragOver, onDrop, onDragLeave, draggingPlanId }) => {
  const today = getTodayStr();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex-1">
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map(d => <div key={d} className="text-center text-[10px] font-semibold text-neutral-500 uppercase tracking-widest py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={i} />;
          const status = getStatus(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isPast = dateStr < today;
          const isDragTarget = dragOverDate === dateStr && draggingPlanId;
          const dayNum = parseInt(dateStr.split('-')[2]);
          const planCount = getPlans(dateStr).length;

          return (
            <motion.button key={dateStr} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => onSelectDate(dateStr)}
              onDragOver={e => { e.preventDefault(); onDragOver(dateStr); }}
              onDrop={() => onDrop(dateStr)} onDragLeave={onDragLeave}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-200 select-none
                ${isSelected ? 'bg-electric-500/25 border-2 border-electric-400 text-white shadow-[0_0_20px_rgba(0,240,255,0.3)]' : ''}
                ${!isSelected && isToday ? 'border-2 border-electric-500/60 text-electric-300' : ''}
                ${!isSelected && !isToday ? 'border border-white/5 hover:border-white/15 hover:bg-white/5' : ''}
                ${isPast && !isSelected && !isToday ? 'text-neutral-400' : !isPast && !isSelected ? 'text-white' : ''}
                ${isDragTarget ? 'border-2 border-blue-400 bg-blue-500/20 scale-105' : ''}
              `}>
              {isToday && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-electric-400 shadow-[0_0_8px_rgba(0,240,255,0.8)] border border-black" />}
              <span className={`text-xs md:text-sm ${isToday && !isSelected ? 'text-electric-300 font-bold' : ''}`}>{dayNum}</span>
              {planCount > 0 && <span className="text-[8px] text-neutral-500 leading-none">{planCount}</span>}
              {status !== 'none' && <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Week View ────────────────────────────────────────────────────────────
interface WeekViewProps {
  weekStart: string; selectedDate: string; onSelectDate: (d: string) => void;
  getStatus: (d: string) => StudyStatus; getPlans: (d: string) => StudyPlan[];
  getSessions: (d: string) => StudySession[];
}

const WeekView: React.FC<WeekViewProps> = ({ weekStart, selectedDate, onSelectDate, getStatus, getPlans, getSessions }) => {
  const today = getTodayStr();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-7 gap-2">
        {days.map(dateStr => {
          const status = getStatus(dateStr);
          const plans = getPlans(dateStr);
          const sessions = getSessions(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isPast = dateStr < today;
          const d = new Date(dateStr + 'T00:00:00');
          const plannedPages = plans.reduce((a, p) => a + Math.max(0, p.pageEnd - p.pageStart + 1), 0);
          const completedPages = sessions.reduce((a, s) => a + s.pagesCompleted, 0);
          const pct = plannedPages > 0 ? Math.round((completedPages / plannedPages) * 100) : 0;

          return (
            <button key={dateStr} onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col items-center p-2 rounded-2xl border transition-all min-h-[140px] text-left relative
                ${isSelected ? 'border-electric-400 bg-electric-500/15' : isToday ? 'border-electric-500/50 bg-electric-500/5' : 'border-white/8 hover:border-white/15'}
              `}>
              <span className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isToday ? 'text-electric-400' : 'text-neutral-400'}`}>{d.toLocaleDateString('en-US',{weekday:'short'})}</span>
              <span className={`text-lg font-bold mb-1 ${isToday ? 'text-electric-300' : 'text-white'}`}>{d.getDate()}
                {isToday && <span className="ml-1 w-1.5 h-1.5 inline-block rounded-full bg-electric-400 shadow-[0_0_8px_rgba(0,240,255,0.8)] align-middle" />}
              </span>
              <div className="w-full space-y-1 overflow-hidden flex-1">
                {isPast ? (
                  sessions.map(s => (
                    <div key={s.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 truncate">{s.subjectName} ✓</div>
                  ))
                ) : (
                  plans.slice(0, 3).map(p => (
                    <div key={p.id} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md truncate ${PRIORITY_COLORS[p.priority]}`}>{p.subjectName}</div>
                  ))
                )}
                {plans.length > 3 && <div className="text-[9px] text-neutral-500">+{plans.length-3}</div>}
              </div>
              {(isPast || isToday) && plannedPages > 0 && (
                <div className="mt-1 w-full">
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden"><div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-400' : pct > 0 ? 'bg-amber-400' : 'bg-blue-400'}`} style={{width:`${Math.min(100,pct)}%`}} /></div>
                </div>
              )}
              {status !== 'none' && <span className={`mt-1 w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Day View ─────────────────────────────────────────────────────────────
interface DayViewProps {
  dateStr: string; plans: StudyPlan[]; sessions: StudySession[];
  onDragStart: (planId: string) => void; onCompleteTask: (plan: StudyPlan) => void;
}

const DayViewComponent: React.FC<DayViewProps> = ({ dateStr, plans, sessions, onDragStart, onCompleteTask }) => {
  const today = getTodayStr();
  const isPast = dateStr < today;
  const isToday = dateStr === today;
  const dayPlans = plans.filter(p => p.date === dateStr);
  const daySessions = sessions.filter(s => s.date === dateStr);

  if (isPast) {
    return (
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <BookMarked className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Study History</h3>
          <span className="text-xs text-neutral-400">{formatDisplayDate(dateStr)}</span>
        </div>
        {daySessions.length === 0 ? (
          <div className="text-center py-12"><CalendarDays className="w-10 h-10 text-neutral-600 mx-auto mb-3" /><p className="text-sm text-neutral-500">No study recorded on this day.</p></div>
        ) : (
          <div className="space-y-2">
            {daySessions.map(sess => (
              <div key={sess.id} className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">{sess.subjectName}</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs text-neutral-300 mb-1">{sess.chapterName}</p>
                <div className="flex items-center gap-4 text-[10px] text-neutral-400">
                  <span>pp. {sess.pageStart}–{sess.pageEnd}</span>
                  <span>{sess.pagesCompleted} pages</span>
                  <span>{formatMinutes(sess.minutesStudied)}</span>
                </div>
                {sess.notes && <p className="text-[10px] text-neutral-500 mt-2 italic">"{sess.notes}"</p>}
              </div>
            ))}
            <div className="p-3 rounded-xl bg-white/5 border border-white/8 mt-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div><p className="text-lg font-bold text-white">{daySessions.reduce((a,s)=>a+s.pagesCompleted,0)}</p><p className="text-[10px] text-neutral-400">Pages</p></div>
                <div><p className="text-lg font-bold text-white">{formatMinutes(daySessions.reduce((a,s)=>a+s.minutesStudied,0))}</p><p className="text-[10px] text-neutral-400">Time</p></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5 text-electric-400" />
        <h3 className="text-base font-bold text-white">{isToday ? "Today's Plan" : 'Upcoming Study'}</h3>
      </div>
      {dayPlans.length === 0 && !isToday && (
        <div className="text-center py-12"><CalendarDays className="w-10 h-10 text-neutral-600 mx-auto mb-3" /><p className="text-sm text-neutral-500">Nothing planned for this day yet.</p></div>
      )}
      {dayPlans.map(plan => {
        const linked = daySessions.find(s => s.planId === plan.id);
        const isDone = plan.status === 'completed' || !!linked;
        return (
          <div key={plan.id} draggable onDragStart={() => onDragStart(plan.id)}
            className={`p-4 rounded-2xl border transition group cursor-grab active:cursor-grabbing ${isDone ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-white/3 hover:border-white/15'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${PRIORITY_COLORS[plan.priority]}`}>{plan.priority}</span>
                  <span className="text-sm font-bold text-white truncate">{plan.subjectName}</span>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                </div>
                <p className="text-xs text-neutral-300">{plan.chapterName}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-400">
                  <span>pp. {plan.pageStart}–{plan.pageEnd} ({plan.pageEnd - plan.pageStart + 1} pages)</span>
                  <span>·</span><span>{formatMinutes(plan.estimatedMinutes)}</span>
                </div>
                {plan.notes && <p className="text-[10px] text-neutral-500 mt-1 italic">"{plan.notes}"</p>}
              </div>
              {isToday && !isDone && (
                <button onClick={() => onCompleteTask(plan)} className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition opacity-0 group-hover:opacity-100">
                  <Play className="w-3 h-3 inline mr-1" />Done
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Day Detail Panel ─────────────────────────────────────────────────────
interface DayPanelProps {
  dateStr: string;
  subjects: { id: string; name: string; chapters: { id: string; name: string; startPage: number; endPage: number; difficulty: string; completed: boolean; completedPages?: number }[] }[];
  store: ReturnType<typeof useCalendarStore>;
  onAddPlan: () => void;
  onLogSession: () => void;
  onEditPlan: (plan: StudyPlan) => void;
}

const DayPanel: React.FC<DayPanelProps> = ({ dateStr, subjects, store, onAddPlan, onLogSession, onEditPlan }) => {
  const today = getTodayStr();
  const isPast = dateStr < today;
  const isToday = dateStr === today;
  const dayData = useDayData(store.plans, store.sessions, dateStr);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest mb-0.5">{isToday ? 'Today' : isPast ? 'History' : 'Upcoming'}</p>
            <h3 className="text-sm font-bold text-white leading-tight">{new Date(dateStr+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric'})}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusIcon status={dayData.status} size={16} />
            <span className={`text-[10px] font-semibold ${dayData.status==='completed'?'text-emerald-400':dayData.status==='partial'?'text-amber-400':dayData.status==='missed'?'text-rose-400':dayData.status==='planned'?'text-blue-400':'text-neutral-500'}`}>{STATUS_LABEL[dayData.status]}</span>
          </div>
        </div>

        {/* Summary stats with circular progress */}
        {(dayData.plans.length > 0 || dayData.sessions.length > 0) && (
          <div className="mt-3 flex items-center gap-3">
            <CircularProgress percent={dayData.completionPercent} size={56} strokeWidth={4} color={dayData.status === 'completed' ? '#34d399' : dayData.status === 'partial' ? '#fbbf24' : '#00F0FF'} />
            <div className="grid grid-cols-2 gap-1.5 flex-1">
              <div className="text-center p-1.5 rounded-xl bg-white/5"><p className="text-sm font-bold text-white">{dayData.totalPlannedPages}</p><p className="text-[9px] text-neutral-400">Pages</p></div>
              <div className="text-center p-1.5 rounded-xl bg-white/5"><p className="text-sm font-bold text-white">{formatMinutes(dayData.totalPlannedMinutes||dayData.totalStudiedMinutes)}</p><p className="text-[9px] text-neutral-400">Time</p></div>
              <div className="text-center p-1.5 rounded-xl bg-white/5"><p className="text-sm font-bold text-white">{dayData.plans.length}</p><p className="text-[9px] text-neutral-400">Tasks</p></div>
              <div className="text-center p-1.5 rounded-xl bg-white/5"><p className="text-sm font-bold text-emerald-400">{dayData.totalCompletedPages}</p><p className="text-[9px] text-neutral-400">Done</p></div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-3 flex-shrink-0">
        <button onClick={onAddPlan} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/25 transition"><Plus className="w-3.5 h-3.5" />Add</button>
        {(isToday || isPast) && (
          <button onClick={onLogSession} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition"><Check className="w-3.5 h-3.5" />Log</button>
        )}
      </div>

      {/* Plans / Sessions list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {dayData.plans.length > 0 && (
          <div>
            <p className="text-[9px] text-neutral-500 font-semibold uppercase tracking-widest mb-1.5">Study Tasks</p>
            <div className="space-y-1.5">
              {dayData.plans.map(plan => {
                const isDone = plan.status === 'completed';
                const linked = dayData.sessions.find(s => s.planId === plan.id);
                return (
                  <div key={plan.id} className={`p-2.5 rounded-xl border transition group ${isDone || linked ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/8 bg-white/3 hover:border-white/15'}`}>
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded border ${PRIORITY_COLORS[plan.priority]}`}>{plan.priority}</span>
                          <span className="text-xs font-bold text-white truncate">{plan.subjectName}</span>
                        </div>
                        <p className="text-[11px] text-neutral-300">{plan.chapterName}</p>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-neutral-400">
                          <span>pp. {plan.pageStart}–{plan.pageEnd}</span><span>·</span><span>{formatMinutes(plan.estimatedMinutes)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => onEditPlan(plan)} className="p-1 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition"><Edit3 className="w-3 h-3" /></button>
                        <button onClick={() => store.duplicatePlan(plan.id)} className="p-1 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition"><Copy className="w-3 h-3" /></button>
                        <button onClick={() => store.deletePlan(plan.id)} className="p-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {dayData.sessions.length > 0 && (
          <div>
            <p className="text-[9px] text-neutral-500 font-semibold uppercase tracking-widest mb-1.5">Completed</p>
            <div className="space-y-1.5">
              {dayData.sessions.map(sess => (
                <div key={sess.id} className="p-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 group">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-bold text-white truncate">{sess.subjectName}</span>
                      </div>
                      <p className="text-[11px] text-neutral-300">{sess.chapterName}</p>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-neutral-400">
                        <span>{sess.pagesCompleted} pages</span><span>·</span><span>{formatMinutes(sess.minutesStudied)}</span>
                      </div>
                      {sess.notes && <p className="text-[9px] text-neutral-500 mt-1 italic">"{sess.notes}"</p>}
                    </div>
                    <button onClick={() => store.deleteSession(sess.id)} className="p-1 rounded-lg bg-rose-500/15 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-500/25 transition"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {dayData.plans.length === 0 && dayData.sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="w-8 h-8 text-neutral-600 mb-2" />
            <p className="text-xs text-neutral-500">{isPast ? 'No study on this day' : isToday ? 'No study planned today' : 'Nothing planned yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Monthly Summary Card ─────────────────────────────────────────────────
interface MonthlySummaryCardProps { summary: MonthlySummary; }
const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({ summary }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {[{v:summary.studyDays,l:'Study Days'},{v:summary.completedTasks,l:'Completed'},{v:summary.missedTasks,l:'Missed'},{v:`${summary.totalStudyHours}h`,l:'Total Hours'},{v:summary.pagesStudied,l:'Pages'},{v:summary.avgPagesPerDay,l:'Avg Pages/Day'},{v:formatMinutes(summary.avgStudyTime),l:'Avg Time/Day'},{v:`${summary.completionPercent}%`,l:'Completion'}].map((item,i)=>(
      <div key={i} className="text-center p-2 rounded-xl bg-white/5 border border-white/8">
        <p className="text-base font-bold text-white">{item.v}</p>
        <p className="text-[9px] text-neutral-400">{item.l}</p>
      </div>
    ))}
  </div>
);

// ─── Main CalendarPage ────────────────────────────────────────────────────
export const CalendarPage: React.FC = () => {
  const { profile, settings } = useUserStore();
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
  const [showAutoPlan, setShowAutoPlan] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StudyStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);

  // Panel state: 'detail' | 'heatmap' | 'future' | 'summary'
  const [rightPanel, setRightPanel] = useState<'detail' | 'heatmap' | 'future' | 'summary'>('detail');

  // Drag state
  const [draggingPlanId, setDraggingPlanId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Subjects for forms
  const subjectsForForm = useMemo(() => profile.subjects.map(s => ({ id: s.id, name: s.name, chapters: s.chapters })), [profile.subjects]);
  const subjectNames = useMemo(() => profile.subjects.map(s => s.name), [profile.subjects]);

  // Week start
  const weekStart = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - d.getDay());
    const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }, [selectedDate]);

  // Missed plans
  const missedPlans = useMemo(() => store.getMissedPlans(), [store.plans, store.sessions]);

  // Monthly summary
  const monthlySummary = useMemo(() => store.getMonthlySummary(currentYear, currentMonth), [currentYear, currentMonth, store.plans, store.sessions]);

  // Future days
  const futureDays = useMemo(() => store.getFutureDays(7), [store.plans, store.sessions]);

  // Exam prediction
  const totalRemaining = useMemo(() => profile.subjects.reduce((s,sub)=>s+sub.remainingPages,0), [profile.subjects]);
  const examPrediction = useMemo(() => store.getExamPrediction(profile.examInfo?.date || '', totalRemaining), [store.plans, store.sessions, profile.examInfo, totalRemaining]);

  // Navigation
  const navigate = useCallback((dir: 1 | -1) => {
    setSlideDir(dir);
    if (view === 'month') {
      let m = currentMonth + dir; let y = currentYear;
      if (m > 11) { m = 0; y++; } if (m < 0) { m = 11; y--; }
      setCurrentMonth(m); setCurrentYear(y);
    } else if (view === 'week') {
      setSelectedDate(prev => addDays(prev, dir * 7));
    } else {
      setSelectedDate(prev => addDays(prev, dir));
    }
  }, [view, currentMonth, currentYear]);

  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    const d = new Date(dateStr + 'T00:00:00');
    setCurrentYear(d.getFullYear()); setCurrentMonth(d.getMonth());
    setRightPanel('detail');
  }, []);

  // Drag & drop
  const handleDragStart = useCallback((planId: string) => setDraggingPlanId(planId), []);
  const handleDragOver = useCallback((dateStr: string) => setDragOverDate(dateStr), []);
  const handleDragLeave = useCallback(() => setDragOverDate(null), []);
  const handleDrop = useCallback((dateStr: string) => {
    if (draggingPlanId && dateStr) store.movePlan(draggingPlanId, dateStr);
    setDraggingPlanId(null); setDragOverDate(null);
  }, [draggingPlanId, store]);

  // Complete a task (opens session form with prefill)
  const handleCompleteTask = useCallback((plan: StudyPlan) => {
    setEditPlan(plan);
    setShowSessionForm(true);
  }, []);

  // Missed task action
  const handleMissedAction = useCallback((planId: string, action: 'tomorrow' | 'reschedule' | 'cancel' | 'redistribute', newDate?: string) => {
    if (action === 'cancel') { store.deletePlan(planId); }
    else if (action === 'tomorrow') { store.movePlan(planId, addDays(getTodayStr(), 1)); }
    else if (newDate) { store.movePlan(planId, newDate); }
    else if (action === 'redistribute') {
      // Mark as missed and trigger redistribution
      store.updatePlanStatus(planId, 'missed');
      store.adaptToday();
    }
  }, [store]);

  // Auto generate plan
  const handleAutoGenerate = useCallback(() => {
 if (profile.examInfo?.date && profile.subjects.length > 0) {
      const dailyMinutes = parseInt((profile.dailyStudyTime as string) || '120') || 120;
      const result = store.generateAutoPlan(profile.subjects, profile.examInfo.date, dailyMinutes);
      setShowAutoPlan(false);
    }
  }, [store, profile]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return store.search(searchQuery);
  }, [searchQuery, store.plans, store.sessions]);

  // Header title
  const headerTitle = useMemo(() => {
    if (view === 'month') return `${MONTHS[currentMonth]} ${currentYear}`;
    if (view === 'week') {
      const ws = new Date(weekStart + 'T00:00:00');
      const we = new Date(addDays(weekStart, 6) + 'T00:00:00');
      return `${ws.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${we.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
    }
    return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  }, [view, currentMonth, currentYear, weekStart, selectedDate]);

  // Adapt message
  useEffect(() => {
    if (store.adaptMessage) {
      const t = setTimeout(() => {}, 5000);
      return () => clearTimeout(t);
    }
  }, [store.adaptMessage]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-screen select-none">
      {/* ── Left: Calendar ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition"><ChevronLeft className="w-4 h-4" /></button>
            <AnimatePresence mode="wait">
              <motion.h2 key={headerTitle} initial={{opacity:0,x:slideDir*20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-slideDir*20}} transition={{duration:0.2}} className="text-lg font-bold text-white min-w-[180px] text-center">{headerTitle}</motion.h2>
            </AnimatePresence>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => { setSelectedDate(today); setCurrentYear(todayDate.getFullYear()); setCurrentMonth(todayDate.getMonth()); }} className="px-3 py-1.5 rounded-lg bg-electric-500/15 border border-electric-500/30 text-electric-400 text-xs font-semibold hover:bg-electric-500/25 transition">Today</button>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs">
              {(['month','week','day'] as CalendarView[]).map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition ${view === v ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30' : 'text-neutral-400 hover:text-white'}`}>{v}</button>
              ))}
            </div>
            <button onClick={() => setShowPlanForm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-electric-600 to-electric-500 text-black text-xs font-bold hover:brightness-110 transition shadow-[0_0_16px_rgba(0,240,255,0.3)]"><Plus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Add Task</span></button>
            <button onClick={() => setShowAutoPlan(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-xs font-semibold hover:bg-white/10 transition"><Zap className="w-3.5 h-3.5" /><span className="hidden sm:inline">Auto Plan</span></button>
            {missedPlans.length > 0 && (
              <button onClick={() => setShowMissed(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/25 transition"><AlertTriangle className="w-3.5 h-3.5" /><span>{missedPlans.length}</span></button>
            )}
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search subjects, chapters, dates..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-neutral-600 focus:border-electric-400 focus:outline-none transition" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"><X className="w-4 h-4" /></button>}
          </div>
          <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${showFilters ? 'bg-electric-500/15 border-electric-500/30 text-electric-400' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'}`}><Filter className="w-3.5 h-3.5" /></button>
          <button onClick={() => setShowMonthlySummary(v => !v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${showMonthlySummary ? 'bg-electric-500/15 border-electric-500/30 text-electric-400' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'}`}><BarChart2 className="w-3.5 h-3.5" /></button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden">
              <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white/3 border border-white/8">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 font-medium">Status:</span>
                  {(['all','planned','completed','partial','missed'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition border ${filterStatus===s?'bg-electric-500/20 border-electric-500/30 text-electric-400':'border-white/10 text-neutral-400 hover:border-white/20'}`}>{s==='all'?'All':STATUS_LABEL[s as StudyStatus]}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Monthly Summary (collapsible) */}
        <AnimatePresence>
          {showMonthlySummary && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden">
              <div className="glass-panel rounded-2xl border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-3"><BarChart2 className="w-4 h-4 text-electric-400" /><h4 className="text-sm font-bold text-white">{MONTHS[currentMonth]} {currentYear} Summary</h4></div>
                <MonthlySummaryCard summary={monthlySummary} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Adapt message */}
        <AnimatePresence>
          {store.adaptMessage && (
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" /><p className="text-xs text-blue-300">{store.adaptMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search results */}
        {searchQuery && searchResults && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <p className="text-xs text-neutral-400 mb-3 font-medium">{searchResults.plans.length + searchResults.sessions.length} results for "{searchQuery}"</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.plans.map(p => (
                <div key={p.id} onClick={() => { handleSelectDate(p.date); setSearchQuery(''); }} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition border border-white/5">
                  <div className="p-1.5 rounded-lg bg-blue-500/15"><BookOpen className="w-3 h-3 text-blue-400" /></div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-white truncate">{p.subjectName} — {p.chapterName}</p><p className="text-[10px] text-neutral-500">{p.date}</p></div>
                </div>
              ))}
              {searchResults.sessions.map(s => (
                <div key={s.id} onClick={() => { handleSelectDate(s.date); setSearchQuery(''); }} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition border border-white/5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15"><CheckCircle2 className="w-3 h-3 text-emerald-400" /></div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-white truncate">{s.subjectName} — {s.chapterName}</p><p className="text-[10px] text-neutral-500">{s.date} · {s.pagesCompleted}pg · {formatMinutes(s.minutesStudied)}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar body */}
        <div className="flex-1 glass-panel rounded-3xl border border-white/10 p-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={`${view}-${currentMonth}-${currentYear}-${weekStart}-${selectedDate}`} initial={{opacity:0,x:slideDir*30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-slideDir*30}} transition={{duration:0.25,ease:[0.4,0,0.2,1]}} className="h-full flex flex-col">
              {view === 'month' && <MonthView year={currentYear} month={currentMonth} selectedDate={selectedDate} onSelectDate={handleSelectDate} getStatus={store.getStatusForDate} getPlans={store.getPlansForDate} dragOverDate={dragOverDate} draggingPlanId={draggingPlanId} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave} />}
              {view === 'week' && <WeekView weekStart={weekStart} selectedDate={selectedDate} onSelectDate={handleSelectDate} getStatus={store.getStatusForDate} getPlans={store.getPlansForDate} getSessions={store.getSessionsForDate} />}
              {view === 'day' && <DayViewComponent dateStr={selectedDate} plans={store.plans} sessions={store.sessions} onDragStart={handleDragStart} onCompleteTask={handleCompleteTask} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-neutral-400">
          {(Object.entries(STATUS_DOT) as [StudyStatus, string][]).filter(([k]) => k !== 'none').map(([status, dot]) => (
            <div key={status} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${dot}`} /><span>{STATUS_LABEL[status]}</span></div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ──────────────────────────────────────── */}
      <div className="lg:w-80 xl:w-96 flex-shrink-0 space-y-3">
        {/* Panel tabs */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 text-[10px] font-semibold">
          {([['detail','Day'],['heatmap','Heatmap'],['future','Upcoming'],['summary','Stats']] as const).map(([key,label]) => (
            <button key={key} onClick={() => setRightPanel(key)} className={`flex-1 py-1.5 rounded-lg transition ${rightPanel===key?'bg-electric-500/20 text-electric-400':'text-neutral-400 hover:text-white'}`}>{label}</button>
          ))}
        </div>

        {/* Today's quick summary (always on top when not viewing today) */}
        {selectedDate !== today && (
          <div className="glass-panel rounded-2xl border border-electric-500/20 p-3">
            <div className="flex items-center gap-2 mb-2"><Zap className="w-3.5 h-3.5 text-electric-400" /><span className="text-[10px] font-bold text-electric-400 uppercase tracking-widest">Today</span>
            <button onClick={() => { setSelectedDate(today); }} className="ml-auto text-[10px] text-electric-400 hover:underline">View →</button>
          </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="text-center p-1.5 rounded-lg bg-white/5"><p className="text-sm font-bold text-white">{store.todayData.plans.length}</p><p className="text-[8px] text-neutral-400">Tasks</p></div>
              <div className="text-center p-1.5 rounded-lg bg-white/5"><p className="text-sm font-bold text-emerald-400">{store.todayData.completionPercent}%</p><p className="text-[8px] text-neutral-400">Done</p></div>
              <div className="text-center p-1.5 rounded-lg bg-white/5"><p className="text-sm font-bold text-white">{formatMinutes(store.todayData.totalPlannedMinutes)}</p><p className="text-[8px] text-neutral-400">Planned</p></div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${store.todayData.completionPercent >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-electric-600 to-electric-400'}`} style={{width:`${Math.min(100,store.todayData.completionPercent)}%`}} /></div>
          </div>
        )}

        {/* Panel content */}
        <div className="glass-panel rounded-2xl border border-white/10 p-4 lg:h-[calc(100vh-260px)] flex flex-col overflow-hidden">
          {rightPanel === 'detail' && (
            <DayPanel dateStr={selectedDate} subjects={subjectsForForm} store={store} onAddPlan={() => setShowPlanForm(true)} onLogSession={() => setShowSessionForm(true)} onEditPlan={(p) => { setEditPlan(p); setShowPlanForm(true); }} />
          )}

          {rightPanel === 'heatmap' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0"><GitBranch className="w-4 h-4 text-electric-400" /><h4 className="text-sm font-bold text-white">Study Heatmap</h4></div>
              <div className="flex items-center gap-3 mb-3 text-[9px] text-neutral-400 flex-shrink-0">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />100%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/70" />75-99%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400/70" />25-74%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500/70" />Missed</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-white/8" />None</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Heatmap data={store.heatmapData} onDayClick={(d) => { handleSelectDate(d); setRightPanel('detail'); }} />
              </div>
              <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-white/5 flex-shrink-0">
                <div><p className="text-lg font-bold text-white">{store.streak.currentStreak}</p><p className="text-[9px] text-neutral-400">Day Streak</p></div>
                <div className="text-right"><p className="text-lg font-bold text-white">{store.streak.longestStreak}</p><p className="text-[9px] text-neutral-400">Longest</p></div>
              </div>
            </div>
          )}

          {rightPanel === 'future' && (
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0"><ArrowRight className="w-4 h-4 text-blue-400" /><h4 className="text-sm font-bold text-white">What's Coming Up</h4></div>
              {examPrediction && totalRemaining > 0 && (
                <div className={`p-3 rounded-xl border mb-3 flex-shrink-0 ${examPrediction.willFinishOnTime ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {examPrediction.willFinishOnTime ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                    <span className={`text-xs font-bold ${examPrediction.willFinishOnTime ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {examPrediction.willFinishOnTime ? 'On Track' : 'Behind Schedule'}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Need {examPrediction.requiredPagesPerDay} pages/day. You average {examPrediction.avgPagesPerDay}.
                    {examPrediction.daysAheadOrBehind !== 0 && ` ${examPrediction.daysAheadOrBehind > 0 ? `${examPrediction.daysAheadOrBehind}d behind` : `${Math.abs(examPrediction.daysAheadOrBehind)}d ahead`}.`}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                {futureDays.map(day => (
                  <div key={day.date} onClick={() => { handleSelectDate(day.date); setRightPanel('detail'); }} className="p-3 rounded-xl border border-white/8 bg-white/3 hover:border-white/15 cursor-pointer transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{new Date(day.date+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>
                        {day.date === addDays(today, 1) && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold">Tomorrow</span>}
                      </div>
                      <CircularProgress percent={day.completionPercent} size={28} strokeWidth={3} />
                    </div>
                    {day.plans.length > 0 && (
                      <div className="space-y-1">
                        {day.plans.slice(0, 3).map(p => (
                          <div key={p.id} className="flex items-center gap-2 text-[10px]">
                            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[p.priority].split(' ')[0].replace('text-','bg-')}`.replace('bg-emerald','bg-emerald-400').replace('bg-amber','bg-amber-400').replace('bg-rose','bg-rose-400')} />
                            <span className="text-neutral-300 truncate flex-1">{p.subjectName}: {p.chapterName}</span>
                            <span className="text-neutral-500">pp. {p.pageStart}–{p.pageEnd}</span>
                          </div>
                        ))}
                        {day.plans.length > 3 && <p className="text-[9px] text-neutral-500">+{day.plans.length - 3} more tasks</p>}
                      </div>
                    )}
                    {day.plans.length === 0 && <p className="text-[10px] text-neutral-500">Nothing planned</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rightPanel === 'summary' && (
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0"><BarChart2 className="w-4 h-4 text-electric-400" /><h4 className="text-sm font-bold text-white">Statistics</h4></div>
              {/* Streak */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/8 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /><span className="text-xs font-semibold text-white">Study Streak</span></div>
                <div className="flex items-center gap-3"><div><p className="text-lg font-bold text-orange-400">{store.streak.currentStreak}</p><p className="text-[8px] text-neutral-400">Current</p></div><div><p className="text-lg font-bold text-white">{store.streak.longestStreak}</p><p className="text-[8px] text-neutral-400">Best</p></div></div>
              </div>
              {/* Today */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/8 mb-3">
                <p className="text-xs font-semibold text-white mb-2">Today's Progress</p>
                <div className="flex items-center gap-3 mb-2">
                  <CircularProgress percent={store.todayData.completionPercent} size={48} strokeWidth={4} />
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between"><span className="text-neutral-400">Tasks</span><span className="text-white font-semibold">{store.todayData.sessions.length}/{store.todayData.plans.length}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-400">Pages</span><span className="text-white font-semibold">{store.todayData.totalCompletedPages}/{store.todayData.totalPlannedPages}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-400">Time</span><span className="text-white font-semibold">{formatMinutes(store.todayData.totalStudiedMinutes)}/{formatMinutes(store.todayData.totalPlannedMinutes)}</span></div>
                  </div>
                </div>
              </div>
              {/* Exam Prediction */}
              {examPrediction && totalRemaining > 0 && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/8 mb-3">
                  <p className="text-xs font-semibold text-white mb-2">Exam Readiness</p>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between"><span className="text-neutral-400">Status</span><span className={examPrediction.willFinishOnTime?'text-emerald-400 font-semibold':'text-rose-400 font-semibold'}>{examPrediction.willFinishOnTime?'On Track':'Behind'}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-400">Pages Remaining</span><span className="text-white font-semibold">{totalRemaining}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-400">Required/Day</span><span className="text-white font-semibold">{examPrediction.requiredPagesPerDay}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-400">Your Average</span><span className="text-white font-semibold">{examPrediction.avgPagesPerDay}</span></div>
                  </div>
                </div>
              )}
              {/* Monthly Summary */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/8">
                <p className="text-xs font-semibold text-white mb-2">{MONTHS[currentMonth]} {currentYear}</p>
                <MonthlySummaryCard summary={monthlySummary} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showPlanForm && <PlanForm initialDate={selectedDate} subjects={subjectsForForm} onSave={store.addPlan} onClose={() => { setShowPlanForm(false); setEditPlan(undefined); }} existing={editPlan} />}
        {showSessionForm && <SessionForm initialDate={selectedDate} subjects={subjectNames} onSave={store.addSession} onClose={() => { setShowSessionForm(false); setEditPlan(undefined); }} linkedPlanId={editPlan?.id} prefill={editPlan} />}
        {showMissed && <MissedModal plans={missedPlans} onAction={handleMissedAction} onClose={() => setShowMissed(false)} />}
        {showAutoPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl" onClick={() => setShowAutoPlan(false)}>
            <motion.div initial={{opacity:0,scale:0.94}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.94}} className="w-full max-w-sm bg-black/95 border border-electric-500/30 rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4"><div className="p-2 rounded-xl bg-electric-500/15 border border-electric-500/30"><Zap className="w-5 h-5 text-electric-400" /></div><div><h3 className="text-base font-bold text-white">Auto-Generate Study Plan</h3><p className="text-xs text-neutral-400">Algorithm will distribute all pages evenly</p></div></div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/8 mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-neutral-400">Subjects</span><span className="text-white font-semibold">{profile.subjects.length}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Total Pages</span><span className="text-white font-semibold">{totalRemaining}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Exam Date</span><span className="text-white font-semibold">{profile.examInfo?.date || 'Not set'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Pages/Day</span><span className="text-electric-400 font-bold">{Math.ceil(totalRemaining / Math.max(1, Math.ceil((new Date(profile.examInfo?.date||'').getTime() - Date.now()) / 86400000)))}</span></div>
              </div>
              <p className="text-[10px] text-amber-400 mb-4">This will replace all existing auto-generated plans. Manual tasks are kept.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowAutoPlan(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-400 text-sm">Cancel</button>
                <button onClick={handleAutoGenerate} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-electric-600 to-electric-500 text-black text-sm font-bold hover:brightness-110 transition">Generate Plan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;
