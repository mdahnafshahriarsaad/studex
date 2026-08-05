import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile, AppSettings } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { t, formatNumber, translateSubjectName } from '../utils/i18n';
import { generateCompleteSyllabusRoadmap } from '../services/plannerEngine';
import { BookOpen, Calendar, CheckCircle2, TrendingUp, Layers, Compass, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompleteSyllabusPageProps {
  profile: UserProfile;
  settings?: AppSettings;
}

export const CompleteSyllabusPage: React.FC<CompleteSyllabusPageProps> = ({ profile, settings }) => {
  const navigate = useNavigate();
  const lang = settings?.language || 'English';
  const roadmap = generateCompleteSyllabusRoadmap(profile.subjects, profile.examInfo);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <GlassCard className="border-electric-500/40 bg-gradient-to-r from-electric-700/10 via-black to-black p-6 md:p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2"><Compass className="w-5 h-5 text-electric-400" /><span className="text-xs font-semibold uppercase tracking-widest text-electric-400">{t('syllabus.roadmap', lang)}</span></div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">{t('syllabus.title', lang)} <span className="inline-block text-electric-400">📊</span></h1>
              <p className="text-neutral-400 text-sm mt-1">{t('syllabus.description', lang)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[90px]">
                <span className="block text-2xl font-extrabold text-white">{formatNumber(roadmap.overallProgressPercent, lang)}%</span>
                <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">{t('syllabus.completion', lang)}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-electric-500/15 border border-electric-500/30 text-center min-w-[100px]">
                <span className="block text-2xl font-extrabold text-electric-400">{formatNumber(roadmap.overallDailyPageTarget, lang)}</span>
                <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">{t('syllabus.pagesDay', lang)}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center"><span className="text-2xl font-extrabold text-white">{formatNumber(roadmap.totalSubjects, lang)}</span><span className="block text-xs text-neutral-400 font-medium uppercase mt-1">{t('syllabus.totalSubjects', lang)}</span></GlassCard>
        <GlassCard className="p-4 text-center"><span className="text-2xl font-extrabold text-electric-400">{formatNumber(roadmap.completedChapters, lang)} / {formatNumber(roadmap.totalChapters, lang)}</span><span className="block text-xs text-neutral-400 font-medium uppercase mt-1">{t('syllabus.chaptersDone', lang)}</span></GlassCard>
        <GlassCard className="p-4 text-center"><span className="text-2xl font-extrabold text-amber-400">{formatNumber(roadmap.remainingPages, lang)}</span><span className="block text-xs text-neutral-400 font-medium uppercase mt-1">{t('syllabus.pagesRemaining', lang)}</span></GlassCard>
        <GlassCard className="p-4 text-center"><span className="text-2xl font-extrabold text-emerald-400">{formatNumber(roadmap.daysRemaining, lang)}</span><span className="block text-xs text-neutral-400 font-medium uppercase mt-1">{t('syllabus.daysToExam', lang)}</span></GlassCard>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Layers className="w-5 h-5 text-electric-400" />{t('syllabus.subjectPlan', lang)}</h3>
        {roadmap.subjectRoadmaps.map((subj, idx) => (
          <motion.div key={subj.subjectId} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.08 }}>
            <GlassCard className="space-y-4 border-white/10 hover:border-electric-500/30 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-extrabold text-white">{translateSubjectName(subj.subjectName, lang)}</h4>
                    <Badge variant={subj.progressPercent === 100 ? 'glass' : 'electric'}>{formatNumber(subj.progressPercent, lang)}% {t('syllabus.completed', lang)}</Badge>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{formatNumber(subj.completedChapters, lang)} {t('common.of', lang)} {formatNumber(subj.totalChapters, lang)} {t('syllabus.ofChaptersCompleted', lang)} &bull; {formatNumber(subj.remainingPages, lang)} {t('syllabus.pagesRemainingShort', lang)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-electric-500/10 border border-electric-500/20 text-right">
                    <span className="text-xs text-neutral-400 block font-medium">{t('syllabus.subjectDailyTarget', lang)}</span>
                    <span className="text-lg font-extrabold text-electric-400">{formatNumber(subj.dailyPageTarget, lang)} {t('syllabus.pagesDay', lang)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-neutral-400"><span>{t('syllabus.syllabusCompletion', lang)}</span><span>{formatNumber(subj.completedPages, lang)} / {formatNumber(subj.totalPages, lang)} {t('dashboard.pages', lang)}</span></div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-electric-600 to-electric-400 rounded-full transition-all duration-500" style={{ width: `${subj.progressPercent}%` }} />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">{t('syllabus.chaptersRoadmap', lang)}</h5>
                {subj.chapters.length === 0 ? (
                  <p className="text-xs text-neutral-500">{t('syllabus.noChaptersYet', lang)}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subj.chapters.map((ch) => (
                      <div key={ch.id} className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${ch.completed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-white'}`}>
                        <div>
                          <span className="font-semibold block">{ch.name}</span>
                          <span className="text-[11px] text-neutral-400">{t('dashboard.pages', lang)} {formatNumber(ch.startPage, lang)} – {formatNumber(ch.endPage, lang)} ({formatNumber(ch.totalPages, lang)} {t('dashboard.pages', lang)}) &bull; {ch.difficulty}</span>
                        </div>
                        {ch.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">{t('syllabus.pending', lang)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
