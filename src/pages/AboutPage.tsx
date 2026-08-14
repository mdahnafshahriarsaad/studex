import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { APP_INFO } from '../utils/constants';
import { t, getCurrentLanguage, formatNumber } from '../utils/i18n';
import { Code, Award, ArrowLeft, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserCount } from '../services/statsService';
import { isConfigured } from '../lib/firebase';

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

// ── Sparkle pulse for the number ───────────────────────────────────
const SparkleRing: React.FC<{ active: boolean }> = ({ active }) => (
  <motion.div
    className="absolute inset-0 rounded-full"
    initial={false}
    animate={active ? {
      boxShadow: [
        '0 0 20px rgba(0,240,255,0.1), 0 0 60px rgba(0,240,255,0.05)',
        '0 0 40px rgba(0,240,255,0.25), 0 0 100px rgba(0,240,255,0.1)',
        '0 0 20px rgba(0,240,255,0.1), 0 0 60px rgba(0,240,255,0.05)',
      ],
    } : {}}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  />
);

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const lang = getCurrentLanguage();
  const [realCount, setRealCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  // Fetch real count from Firestore once
  const fetchCount = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    try {
      const count = await getUserCount();
      setRealCount(count);
    } catch {
      setRealCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConfigured) {
      fetchCount();
    } else {
      setLoading(false);
      setRealCount(0);
    }
  }, [fetchCount]);

  // Animated counter
  const displayCount = useAnimatedCount(realCount ?? 0, 2200);
  const countReady = !loading && realCount !== null;

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

          {/* ── Real User Count ── */}
          {isConfigured && (
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="relative mx-auto w-fit">
                <div className="relative flex flex-col items-center gap-3 py-6 px-10 rounded-2xl bg-gradient-to-br from-electric-500/10 via-transparent to-cyan-500/10 border border-electric-500/20">
                  <SparkleRing active={countReady && (realCount ?? 0) > 0} />
                  <div className="flex items-center gap-2 text-xs font-semibold text-electric-400 uppercase tracking-widest">
                    <Users className="w-4 h-4" />
                    <span>{t('about.totalUsers', lang)}</span>
                  </div>

                  {loading ? (
                    <div className="flex items-center gap-2 text-neutral-500 text-sm">
                      <motion.div
                        className="w-4 h-4 border-2 border-electric-500/30 border-t-electric-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>{t('about.loadingStats', lang)}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <motion.span
                        key="count-value"
                        className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-electric-400 via-cyan-300 to-electric-400 bg-clip-text text-transparent"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      >
                        {formatNumber(displayCount, lang)}
                      </motion.span>
                      <motion.span
                        className="text-lg text-neutral-400 font-medium"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5, duration: 0.4 }}
                      >
                        {t('about.joinedStudex', lang)}
                      </motion.span>
                    </div>
                  )}

                  {countReady && (realCount ?? 0) > 0 && (
                    <motion.div
                      className="flex items-center gap-1.5 text-xs text-electric-400/60"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2, duration: 0.5 }}
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>{t('about.growingCommunity', lang)}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {isConfigured && <div className="w-full h-[1px] bg-white/10 my-2" />}

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
