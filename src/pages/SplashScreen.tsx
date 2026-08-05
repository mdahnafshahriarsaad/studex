import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t, getCurrentLanguage } from '../utils/i18n';

interface SplashScreenProps {
  onComplete: () => void;
}

// ─── Floating Particles ────────────────────────────────────────────────
function Particles() {
  const dots = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
      opacity: 0.15 + Math.random() * 0.35,
    })),
  []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-electric-500"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, d.opacity, 0],
            y: [0, -40 - Math.random() * 60],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated Graduation Cap Icon (pure SVG) ──────────────────────────
function GradCapIcon({ size = 80, color = '#00F0FF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Cap body */}
      <motion.path
        d="M32 12L4 28l28 16 28-16L32 12z"
        fill={`${color}20`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {/* Tassel string */}
      <motion.line
        x1="56" y1="28" x2="56" y2="48"
        stroke={color}
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
      />
      {/* Tassel end */}
      <motion.circle
        cx="56" cy="50" r="3"
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.2, type: 'spring', stiffness: 200 }}
      />
      {/* Left side of cap */}
      <motion.path
        d="M12 30v14c0 0 8 8 20 8s20-8 20-8V30"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
      />
    </svg>
  );
}

// ─── Letter-by-letter STUDEX text ─────────────────────────────────────
function AnimatedWordmark() {
  const letters = 'STUDEX'.split('');
  return (
    <div className="flex items-center justify-center gap-[2px]">
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="text-5xl md:text-7xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #fff 0%, #00F0FF 50%, #0A84FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(0, 240, 255, 0.4))',
          }}
          initial={{ opacity: 0, y: 30, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.5,
            delay: i * 0.08,
            type: 'spring',
            stiffness: 120,
            damping: 12,
          }}
        >
          {letter}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Main SplashScreen ─────────────────────────────────────────────────
export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 200),
      setTimeout(() => setStage(2), 800),
      setTimeout(() => setStage(3), 1600),
      setTimeout(() => setStage(4), 2600),
      setTimeout(() => setStage(5), 3400),
      setTimeout(() => setStage(6), 4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage === 6) {
      const finish = setTimeout(() => { onComplete(); }, 600);
      return () => clearTimeout(finish);
    }
  }, [stage, onComplete]);

  const lang = getCurrentLanguage();

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#050508] flex flex-col items-center justify-center overflow-hidden select-none"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {/* ── Ambient glow blobs ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          opacity: [0.12, 0.25, 0.15],
          scale: [0.8, 1.1, 0.9],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[500px] h-[500px] rounded-full bg-electric-500/15 blur-[140px] pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: [0.08, 0.15, 0.08],
          scale: [0.7, 1, 0.8],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute w-[350px] h-[350px] rounded-full bg-electric-700/10 blur-[100px] pointer-events-none"
        style={{ top: '20%', left: '15%' }}
      />

      {/* ── Floating particles ── */}
      <AnimatePresence>
        {stage >= 1 && <Particles />}
      </AnimatePresence>

      {/* ── Ring pulse behind icon ── */}
      <AnimatePresence>
        {stage >= 2 && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.6, 2] }}
              transition={{ duration: 2.5, ease: 'easeOut' }}
              className="absolute w-48 h-48 rounded-full border border-electric-500/30"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.2, 0], scale: [0.8, 1.8, 2.2] }}
              transition={{ duration: 3, ease: 'easeOut', delay: 0.4 }}
              className="absolute w-48 h-48 rounded-full border border-electric-400/20"
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Glass card container ── */}
      <div className="relative z-10 flex flex-col items-center">
        <AnimatePresence>
          {stage >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, filter: 'blur(12px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-8 md:p-10 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-glass-card"
            >
              {/* Glass reflection beam */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              {/* Graduation cap icon */}
              <div className="flex justify-center mb-6">
                <GradCapIcon size={90} color="#00F0FF" />
              </div>

              {/* Light sweep effect */}
              <AnimatePresence>
                {stage >= 3 && (
                  <motion.div
                    initial={{ x: '-200%' }}
                    animate={{ x: '200%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg] rounded-[2rem] pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Wordmark: STUDEX ── */}
        <AnimatePresence>
          {stage >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 mb-4"
            >
              <AnimatedWordmark />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tagline ── */}
        <AnimatePresence>
          {stage >= 5 && (
            <motion.p
              initial={{ opacity: 0, y: 10, letterSpacing: '0.5em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.35em' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-[11px] md:text-[13px] text-neutral-400 font-bold uppercase"
            >
              {t('splash.academicPlanner', lang)}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Loading bar ── */}
        <AnimatePresence>
          {stage >= 3 && stage < 6 && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-10 h-[2px] bg-white/[0.06] rounded-full overflow-hidden w-48"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-electric-700 via-electric-500 to-electric-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.4, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Skip button ── */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.4)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
        className="absolute bottom-10 text-xs tracking-wider text-white/60 hover:text-white font-medium uppercase transition-colors px-6 py-2.5 rounded-full border border-white/10 hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-sm"
      >
        {t('splash.skipIntro', lang)}
      </motion.button>
    </motion.div>
  );
};
