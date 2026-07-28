import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    // 60FPS Apple-grade animation timeline
    const timers = [
      setTimeout(() => setStage(1), 300),   // 1. Black AMOLED & tiny electric blue particle appears
      setTimeout(() => setStage(2), 1200),  // 2. Particle moves leaving liquid energy trail
      setTimeout(() => setStage(3), 2400),  // 3. Trail forms official Studex logo
      setTimeout(() => setStage(4), 3400),  // 4. Soft metallic light reflection passes across logo
      setTimeout(() => setStage(5), 4400),  // 5. Studex wordmark fades in smoothly
      setTimeout(() => setStage(6), 5600),  // 6. Transition to onboarding
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage === 6) {
      const finish = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(finish);
    }
  }, [stage, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Background Subtle Electric Blue Soft Glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: stage >= 1 ? [0.15, 0.35, 0.2] : 0,
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[450px] h-[450px] rounded-full bg-electric-500/10 blur-[120px] pointer-events-none"
      />

      <div className="relative flex flex-col items-center justify-center z-10 px-6">
        {/* Stages 1 & 2: Particle & Liquid Energy Trail */}
        <AnimatePresence>
          {stage >= 1 && stage < 3 && (
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              {/* Electric Blue Particle moving along logo vector trajectory */}
              <motion.div
                initial={{ opacity: 0, x: -40, y: 30, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  x: stage === 2 ? [ -40, 20, -20, 40, 0 ] : -40,
                  y: stage === 2 ? [ 30, -30, 0, 30, 0 ] : 30,
                  scale: stage === 2 ? [0.8, 1.3, 1, 1.4, 1] : 0.8,
                }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-4 h-4 rounded-full bg-electric-500 shadow-[0_0_25px_#00F0FF,0_0_50px_#00F0FF]"
              />

              {/* Liquid Energy Trail SVG line */}
              {stage >= 2 && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <motion.path
                    d="M 20,80 Q 50,10 80,40 T 30,70"
                    fill="none"
                    stroke="#00F0FF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 0.8, 0.4] }}
                    transition={{ duration: 1.1, ease: 'easeInOut' }}
                    style={{ filter: 'drop-shadow(0 0 8px #00F0FF)' }}
                  />
                </svg>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Stage 3 & 4: Official Studex Logo Mark & Metallic Light Sweep */}
        {stage >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-6 flex flex-col items-center"
          >
            <div className="relative overflow-hidden p-2 rounded-3xl">
              <img
                src="/logo-mark.png"
                alt="Official Studex Logo Mark"
                className="w-28 h-28 md:w-36 md:h-36 object-contain filter drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              />

              {/* Metallic Light Reflection Sweep (Stage 4) */}
              {stage >= 4 && (
                <motion.div
                  initial={{ x: '-160%' }}
                  animate={{ x: '160%' }}
                  transition={{ duration: 1.1, ease: 'easeInOut' }}
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[25deg] pointer-events-none"
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Stage 5: Official Studex Wordmark Fade-In */}
        {stage >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center"
          >
            <img
              src="/wordmark.png"
              alt="Official Studex Wordmark"
              className="h-9 md:h-11 object-contain filter drop-shadow-[0_0_12px_rgba(0,240,255,0.3)]"
            />
            <p className="text-[11px] tracking-[0.25em] text-neutral-500 font-light uppercase mt-2.5">
              Academic Planner
            </p>
          </motion.div>
        )}
      </div>

      {/* Skip Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        whileHover={{ opacity: 1 }}
        onClick={onComplete}
        className="absolute bottom-8 text-[11px] tracking-wider text-neutral-400 hover:text-white uppercase transition-all px-4 py-1.5 rounded-full border border-white/10 glass-panel"
      >
        Skip Intro
      </motion.button>
    </div>
  );
};
