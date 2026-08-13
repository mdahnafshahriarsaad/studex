import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Tiny wrapper: one splash animation cell ─── */
interface CellProps {
  variant: number;
  playing: boolean;
  onRestart: () => void;
}

const LOGO_MARK = '/logo-mark.png';
const WORD_MARK = '/wordmark.png';
const DURATION = 4200; // ms per loop

/* ═══════════════════════════════════════════════════════
   Variant 1 — Orbit Reveal
   Logo spins in from orbit, wordmark fades up, particles trail
   ═══════════════════════════════════════════════════════ */
const Variant1: React.FC<{ playing: boolean }> = ({ playing }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!playing) return;
    setPhase(0);
    const t = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 3000),
    ];
    return () => t.forEach(clearTimeout);
  }, [playing]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl overflow-hidden">
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: phase >= 1 ? [0.1, 0.25, 0.1] : 0 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-48 h-48 rounded-full bg-cyan-500/15 blur-[60px]"
      />

      {/* Orbit ring */}
      {phase >= 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.3, rotate: -90 }}
          animate={{ opacity: phase >= 2 ? [0.6, 0.2, 0.6] : 0.6, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute w-44 h-44 rounded-full border border-cyan-400/30"
        />
      )}

      {/* Logo from orbit */}
      <div className="relative z-10 flex flex-col items-center">
        {phase >= 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.2, rotate: 180, y: -60 }}
            animate={{
              opacity: 1,
              scale: phase >= 2 ? 1 : 0.9,
              rotate: phase >= 2 ? 0 : 180,
              y: 0,
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-4"
          >
            <img src={LOGO_MARK} alt="Logo" className="w-28 h-28 object-contain drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]" />
            {/* Light sweep */}
            {phase >= 2 && (
              <motion.div
                initial={{ x: '-160%' }}
                animate={{ x: '160%' }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] pointer-events-none"
              />
            )}
          </motion.div>
        )}

        {/* Wordmark */}
        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <img src={WORD_MARK} alt="Wordmark" className="h-10 object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[9px] tracking-[0.3em] text-neutral-400 font-bold uppercase mt-2"
            >
              Academic Planner
            </motion.p>
          </motion.div>
        )}
      </div>

      {/* Particles */}
      {phase >= 2 && phase < 4 && [0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.8, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: Math.cos((i * 72 * Math.PI) / 180) * 80,
            y: Math.sin((i * 72 * Math.PI) / 180) * 80,
            scale: 0,
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400"
          style={{ left: '50%', top: '40%' }}
        />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Variant 2 — Liquid Morph
   Blob morphs behind logo, logo scales up with elastic, wordmark slides in
   ═══════════════════════════════════════════════════════ */
const Variant2: React.FC<{ playing: boolean }> = ({ playing }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!playing) return;
    setPhase(0);
    const t = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 3000),
    ];
    return () => t.forEach(clearTimeout);
  }, [playing]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl overflow-hidden">
      {/* Morphing blob */}
      <motion.div
        animate={{
          borderRadius: phase >= 1
            ? ['30% 70% 70% 30% / 30% 30% 70% 70%', '70% 30% 30% 70% / 70% 70% 30% 30%', '50% 50% 50% 50% / 50% 50% 50% 50%']
            : '50%',
          scale: phase >= 1 ? [0.5, 0.8, 1] : 0,
          opacity: phase >= 1 ? [0.15, 0.3, 0.15] : 0,
        }}
        transition={{ duration: 2, repeat: phase >= 1 ? Infinity : 0, ease: 'easeInOut' }}
        className="absolute w-40 h-40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-[30px]"
      />

      <div className="relative z-10 flex flex-col items-center">
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
            animate={{
              opacity: 1,
              scale: phase >= 3 ? [1, 1.08, 1] : 1,
              rotate: 0,
            }}
            transition={{
              scale: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.5 },
              rotate: { duration: 0.8, ease: 'easeOut' },
            }}
            className="relative mb-4"
          >
            <img src={LOGO_MARK} alt="Logo" className="w-28 h-28 object-contain drop-shadow-[0_0_24px_rgba(0,240,255,0.6)]" />
            {/* Glow pulse */}
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-cyan-400/20 blur-[20px] -z-10"
            />
          </motion.div>
        )}

        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <img src={WORD_MARK} alt="Wordmark" className="h-10 object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]" />
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[9px] tracking-[0.3em] text-neutral-400 font-bold uppercase mt-2"
            >
              Academic Planner
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Variant 3 — Particle Assembly
   Dots converge to center forming logo, then logo appears, wordmark types in
   ═══════════════════════════════════════════════════════ */
const Variant3: React.FC<{ playing: boolean }> = ({ playing }) => {
  const [phase, setPhase] = useState(0);
  const particles = useRef(
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        startX: (Math.random() - 0.5) * 200,
        startY: (Math.random() - 0.5) * 200,
      }))
    ).current;

  useEffect(() => {
    if (!playing) return;
    setPhase(0);
    const t = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3400),
    ];
    return () => t.forEach(clearTimeout);
  }, [playing]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl overflow-hidden">
      {/* Converging particles */}
      {phase >= 1 && phase < 3 && particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            opacity: 0.8,
            x: p.startX,
            y: p.startY,
            scale: 1.5,
          }}
          animate={{
            opacity: phase >= 2 ? 0 : 0.9,
            x: 0,
            y: 0,
            scale: phase >= 2 ? 0 : 0.5,
          }}
          transition={{
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1],
            delay: p.id * 0.04,
          }}
          className="absolute w-2 h-2 rounded-full bg-cyan-400"
          style={{
            boxShadow: '0 0 8px #00F0FF, 0 0 16px #00F0FF',
          }}
        />
      ))}

      {/* Flash on converge */}
      <AnimatePresence>
        {phase >= 2 && phase < 3 && (
          <motion.div
            initial={{ opacity: 0.6, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute w-32 h-32 rounded-full bg-cyan-400/30 blur-[30px]"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center">
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-4"
          >
            <img src={LOGO_MARK} alt="Logo" className="w-28 h-28 object-contain drop-shadow-[0_0_24px_rgba(0,240,255,0.7)]" />
          </motion.div>
        )}

        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <img src={WORD_MARK} alt="Wordmark" className="h-10 object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]" />
            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.1em' }}
              animate={{ opacity: 1, letterSpacing: '0.3em' }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-[9px] tracking-[0.3em] text-neutral-400 font-bold uppercase mt-2"
            >
              Academic Planner
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Variant 4 — Cinematic Fade
   Film-grain feel: vertical wipe reveal, slow zoom, wordmark fades
   ═══════════════════════════════════════════════════════ */
const Variant4: React.FC<{ playing: boolean }> = ({ playing }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!playing) return;
    setPhase(0);
    const t = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2400),
      setTimeout(() => setPhase(4), 3400),
    ];
    return () => t.forEach(clearTimeout);
  }, [playing]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl overflow-hidden">
      {/* Top / bottom curtain */}
      <motion.div
        animate={{ y: phase >= 1 ? '-100%' : '0%' }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-x-0 top-0 h-1/2 bg-black z-20"
      />
      <motion.div
        animate={{ y: phase >= 1 ? '100%' : '0%' }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-black z-20"
      />

      {/* Content behind curtain */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={{
            scale: phase >= 1 ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 3, ease: 'easeInOut' }}
          className="relative mb-4"
        >
          <img
            src={LOGO_MARK}
            alt="Logo"
            className="w-28 h-28 object-contain drop-shadow-[0_0_30px_rgba(0,240,255,0.5)]"
          />
          {/* Vignette glow */}
          <motion.div
            animate={{ opacity: phase >= 2 ? [0.1, 0.3, 0.1] : 0.1 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-8 rounded-full bg-cyan-500/10 blur-[40px]"
          />
        </motion.div>

        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="flex flex-col items-center"
          >
            <img src={WORD_MARK} alt="Wordmark" className="h-10 object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-[9px] tracking-[0.3em] text-neutral-400 font-bold uppercase mt-2"
            >
              Academic Planner
            </motion.p>
          </motion.div>
        )}
      </div>

      {/* Film grain overlay */}
      {phase >= 1 && (
        <div
          className="absolute inset-0 z-30 pointer-events-none opacity-[0.03] rounded-2xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Variant 5 — Bounce & Glow
   Logo bounces in with spring physics, glow rings expand, wordmark pops
   ═══════════════════════════════════════════════════════ */
const Variant5: React.FC<{ playing: boolean }> = ({ playing }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!playing) return;
    setPhase(0);
    const t = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2600),
    ];
    return () => t.forEach(clearTimeout);
  }, [playing]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl overflow-hidden">
      {/* Expanding glow rings */}
      {phase >= 1 && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4, scale: 0.3 }}
          animate={{
            opacity: 0,
            scale: 2.5 + i * 0.5,
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.15,
            ease: 'easeOut',
          }}
          className="absolute w-28 h-28 rounded-full border-2 border-cyan-400/40"
        />
      ))}

      <div className="relative z-10 flex flex-col items-center">
        {phase >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.4 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: phase >= 2 ? 1 : 1.1,
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 12,
              mass: 0.8,
            }}
            className="relative mb-4"
          >
            <img src={LOGO_MARK} alt="Logo" className="w-28 h-28 object-contain drop-shadow-[0_0_24px_rgba(0,240,255,0.7)]" />
            {/* Breathing glow */}
            {phase >= 2 && (
              <motion.div
                animate={{
                  opacity: [0.15, 0.35, 0.15],
                  scale: [1, 1.08, 1],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-4 rounded-full bg-cyan-400/20 blur-[20px] -z-10"
              />
            )}
          </motion.div>
        )}

        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 15,
            }}
            className="flex flex-col items-center"
          >
            <img src={WORD_MARK} alt="Wordmark" className="h-10 object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]" />
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 20 }}
              className="text-[9px] tracking-[0.3em] text-neutral-400 font-bold uppercase mt-2"
            >
              Academic Planner
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN PREVIEW PAGE
   ═══════════════════════════════════════════════════════ */

const VARIANTS = [
  { id: 1, name: 'Orbit Reveal', desc: 'Logo spins in from orbit with particles', Component: Variant1 },
  { id: 2, name: 'Liquid Morph', desc: 'Blob morphs behind, elastic scale-in', Component: Variant2 },
  { id: 3, name: 'Particle Assembly', desc: 'Dots converge to center, flash reveal', Component: Variant3 },
  { id: 4, name: 'Cinematic Fade', desc: 'Curtain wipe, slow zoom, film grain', Component: Variant4 },
  { id: 5, name: 'Bounce & Glow', desc: 'Spring bounce, expanding glow rings', Component: Variant5 },
];

export const SplashPreviewPage: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [keys, setKeys] = useState<number[]>([0, 1, 2, 3, 4]);

  const restartVariant = useCallback((idx: number) => {
    setKeys((prev) => {
      const next = [...prev];
      next[idx] = next[idx] + 1;
      return next;
    });
  }, []);

  // Auto-loop: restart each variant after DURATION ms
  useEffect(() => {
    const timers = VARIANTS.map((_, idx) =>
      setInterval(() => restartVariant(idx), DURATION)
    );
    return () => timers.forEach(clearInterval);
  }, []);

  const handleSelect = (idx: number) => {
    setActiveIdx(idx);
    // Just highlight for now — user picks, then we apply
    setTimeout(() => setActiveIdx(null), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Splash Screen Animations</h1>
        <p className="text-neutral-400 text-sm">Each animation loops automatically. Click to select your favorite.</p>
      </div>

      {/* Grid of 5 variants */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {VARIANTS.map((v, idx) => (
          <div
            key={v.id}
            className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
              activeIdx === idx
                ? 'ring-2 ring-cyan-400 rounded-2xl'
                : 'hover:ring-1 hover:ring-white/20 rounded-2xl'
            }`}
            onClick={() => handleSelect(idx)}
          >
            {/* Animation cell — phone-like aspect ratio */}
            <div className="w-full aspect-[9/14] bg-black rounded-2xl overflow-hidden border border-white/10">
              <v.Component key={keys[idx]} playing={true} />
            </div>

            {/* Label */}
            <div className="mt-3 text-center">
              <h3 className={`text-sm font-semibold ${activeIdx === idx ? 'text-cyan-400' : 'text-white'}`}>
                {v.id}. {v.name}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Selected indicator */}
      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-cyan-500 text-black font-bold px-6 py-3 rounded-full shadow-lg shadow-cyan-500/30 z-50"
          >
            You selected: {VARIANTS[activeIdx].name} (tell me the number!)
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
