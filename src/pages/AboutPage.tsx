import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { APP_INFO } from '../utils/constants';
import { t, getCurrentLanguage, formatNumber } from '../utils/i18n';
import { Code, Award, ArrowLeft, Users, Mail, UserX, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserCounts } from '../services/statsService';

// ── Animated counter hook ──────────────────────────────────────────
function useAnimatedCount(target: number, duration: number = 2000) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration, bounce: 0 });
  const rounded = useTransform(spring, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    motionVal.set(target);
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return unsub;
  }, [target, motionVal, rounded, duration]);

  return display;
}

// ── Stat card component ────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  count: number;
  accentColor: string;
  delay: number;
  lang: 'English' | 'Bengali';
}> = ({ icon, label, count, accentColor, delay, lang }) => {
  const display = useAnimatedCount(count, 1800 + delay * 400);
  return (
    <motion.div
      className="flex-1 min-w-[140px] flex flex-col items-center gap-3 py-5 px-4 rounded-2xl border"
      style={{
        background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 60%)`,
        borderColor: `${accentColor}30`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + delay * 0.15, duration: 0.5 }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
        {icon}
        <span>{label}</span>
      </div>
      <motion.span
        className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent"
        style={{ backgroundImage: `linear-gradient(to right, ${accentColor}, ${accentColor}99, ${accentColor})` }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 + delay * 0.15 }}
      >
        {formatNumber(display, lang)}
      </motion.span>
    </motion.div>
  );
};

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const lang = getCurrentLanguage();
  const [counts, setCounts] = useState<{ emailSignups: number; guestSignups: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchCounts = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    try {
      const data = await getUserCounts();
      setCounts(data);
    } catch {
      setCounts({ emailSignups: 0, guestSignups: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const total = (counts?.emailSignups ?? 0) + (counts?.guestSignups ?? 0);
  const displayTotal = useAnimatedCount(total, 2400);
  const countReady = !loading && counts !== null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 select-none">
      <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/settings')}>
        {t('about.backToSettings', lang)}
      </Button>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <GlassCard className="p-8 md:p-10 flex flex-col items-center text-center space-y-6 border-electric-500/30">
          {/* Logo */}
          <div className="relative">
            <img src="/logo-mark.png" alt="Studex Logo" className="w-48 h-48 object-contain filter drop-shadow-[0_0_35px_rgba(0,240,255,0.75)]" />
            <div className="absolute -bottom-2 -right-2"><Badge variant="electric">v{APP_INFO.version}</Badge></div>
          </div>

          {/* Wordmark + Tagline */}
          <div>
            <img src="/wordmark.png" alt="Studex Wordmark" className="h-28 sm:h-30 md:h-32 object-contain mx-auto" />
            <p className="text-base text-neutral-300 font-semibold mt-3">{APP_INFO.tagline}</p>
          </div>

          <div className="w-full h-[1px] bg-white/10 my-4" />

          {/* ── Real User Counts ── */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {/* Total */}
            <div className="flex flex-col items-center gap-2 mb-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-electric-400 uppercase tracking-widest">
                <Users className="w-4 h-4" />
                <span>{t('about.totalUsers', lang)}</span>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-neutral-500 text-sm py-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-electric-500/30 border-t-electric-400 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>{t('about.loadingStats', lang)}</span>
                </div>
              ) : (
                <motion.span
                  className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-electric-400 via-cyan-300 to-electric-400 bg-clip-text text-transparent"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  {formatNumber(displayTotal, lang)}
                </motion.span>
              )}
              <span className="text-sm text-neutral-400">{t('about.joinedStudex', lang)}</span>
            </div>

            {/* Two stat cards */}
            {!loading && (
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <StatCard
                  icon={<Mail className="w-4 h-4" />}
                  label={t('about.emailSignups', lang)}
                  count={counts?.emailSignups ?? 0}
                  accentColor="#00f0ff"
                  delay={0}
                  lang={lang}
                />
                <StatCard
                  icon={<UserX className="w-4 h-4" />}
                  label={t('about.guestSignups', lang)}
                  count={counts?.guestSignups ?? 0}
                  accentColor="#a78bfa"
                  delay={1}
                  lang={lang}
                />
              </div>
            )}

            {countReady && total > 0 && (
              <motion.div
                className="flex items-center justify-center gap-1.5 text-xs text-electric-400/60 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2, duration: 0.5 }}
              >
                <TrendingUp className="w-3 h-3" />
                <span>{t('about.growingCommunity', lang)}</span>
              </motion.div>
            )}
          </motion.div>

          <div className="w-full h-[1px] bg-white/10 my-2" />

          {/* Developers */}
          <div className="w-full space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-electric-400 uppercase tracking-widest">
              <Code className="w-4 h-4" />
              <span>{t('about.developers', lang)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {APP_INFO.developers.map((dev) => (
                <div key={dev} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-electric-500/20 border border-electric-500/40 flex items-center justify-center text-electric-400 text-sm font-bold">{dev.charAt(0)}</div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-white">{dev}</h4>
                    </div>
                  </div>
                  <Award className="w-4 h-4 text-electric-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/10 my-4" />
          <div className="text-xs text-neutral-400 space-y-1">
            <p className="font-semibold text-white">{APP_INFO.copyright}</p>
            <p className="text-[11px] text-neutral-500">{t('about.allRightsReserved', lang)}</p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
