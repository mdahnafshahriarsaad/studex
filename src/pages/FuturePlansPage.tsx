import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { t, getCurrentLanguage } from '../utils/i18n';
import { Search, X, Rocket } from 'lucide-react';

interface FutureFeature {
  nameKey: string;
  descKey: string;
  icon: React.ReactNode;
}

const FUTURE_FEATURES: FutureFeature[] = [
  { nameKey: 'future.aiStudyAssistant', descKey: 'future.aiStudyAssistantDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.ocrSyllabusScanner', descKey: 'future.ocrSyllabusScannerDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.smartRevisionPlanner', descKey: 'future.smartRevisionPlannerDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.studyAnalytics', descKey: 'future.studyAnalyticsDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.groupStudy', descKey: 'future.groupStudyDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.liveStudyRooms', descKey: 'future.liveStudyRoomsDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.achievementRewards', descKey: 'future.achievementRewardsDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.notesFlashcards', descKey: 'future.notesFlashcardsDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.cloudBackup', descKey: 'future.cloudBackupDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.desktopApp', descKey: 'future.desktopAppDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.iosApp', descKey: 'future.iosAppDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.aiDoubtSolver', descKey: 'future.aiDoubtSolverDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.pomodoroInsights', descKey: 'future.pomodoroInsightsDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.offlineMode', descKey: 'future.offlineModeDesc', icon: <Rocket className="w-5 h-5" /> },
  { nameKey: 'future.teacherDashboard', descKey: 'future.teacherDashboardDesc', icon: <Rocket className="w-5 h-5" /> },
];

export const FuturePlansPage: React.FC = () => {
  const lang = getCurrentLanguage();
  const [search, setSearch] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<FutureFeature | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return FUTURE_FEATURES;
    const q = search.toLowerCase();
    return FUTURE_FEATURES.filter((f) => {
      const name = t(f.nameKey, lang).toLowerCase();
      const desc = t(f.descKey, lang).toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [search, lang]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Rocket className="w-6 h-6 text-electric-400" />
          {t('future.title', lang)}
        </h1>
        <p className="text-sm text-neutral-400 mt-1">{t('future.subtitle', lang)}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('future.searchPlaceholder', lang)}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-neutral-500 outline-none focus:border-electric-500/50 focus:shadow-glow-sm transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Feature Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-500 text-sm">
          {t('future.noResults', lang)}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {filtered.map((feature, i) => (
            <motion.div
              key={feature.nameKey}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <GlassCard
                interactive
                className="p-5 flex flex-col gap-3"
                onClick={() => setSelectedFeature(feature)}
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/25 flex items-center justify-center text-electric-400">
                    {feature.icon}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-gradient-to-r from-electric-500/20 to-purple-500/20 text-electric-300 border border-electric-500/20 animate-pulse">
                    {t('future.comingSoon', lang)}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-white">{t(feature.nameKey, lang)}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{t(feature.descKey, lang)}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Feature Detail Dialog */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedFeature(null)}
            />

            {/* Dialog */}
            <motion.div
              className="relative glass-panel rounded-2xl p-6 sm:p-8 max-w-md w-full border border-white/10 shadow-2xl"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Top beam */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-electric-500/15 border border-electric-500/25 flex items-center justify-center text-electric-400">
                  <Rocket className="w-7 h-7" />
                </div>

                <h2 className="text-lg font-bold text-white">{t(selectedFeature.nameKey, lang)}</h2>
                <p className="text-sm text-neutral-400 leading-relaxed">{t(selectedFeature.descKey, lang)}</p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-gradient-to-r from-electric-500/20 to-purple-500/20 text-electric-300 border border-electric-500/20">
                  <Rocket className="w-3.5 h-3.5" />
                  {t('future.comingSoon', lang)}
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed pt-1">
                  {t('future.dialogMessage', lang)}
                </p>

                <Button variant="primary" size="sm" onClick={() => setSelectedFeature(null)} className="mt-2">
                  {t('future.gotIt', lang)}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
