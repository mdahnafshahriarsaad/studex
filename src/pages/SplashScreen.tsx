import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t, getCurrentLanguage } from '../utils/i18n';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 1200),
      setTimeout(() => setStage(3), 2400),
      setTimeout(() => setStage(4), 3400),
      setTimeout(() => setStage(5), 4400),
      setTimeout(() => setStage(6), 5600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage === 6) {
      const finish = setTimeout(() => { onComplete(); }, 500);
      return () => clearTimeout(finish);
    }
  }, [stage, onComplete]);

  const lang = getCurrentLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden select-none">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: stage >= 1 ? [0.15, 0.35, 0.2] : 0 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[450px] h-[450px] rounded-full bg-electric-500/10 blur-[120px] pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center z-10 px-6">
        <AnimatePresence>
          {stage >= 1 && stage < 3 && (
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              <motion.div initial={{ opacity: 0, x: -40, y: 30, scale: 0.5 }}
                animate={{ opacity: 1, x: stage === 2 ? [ -40, 20, -20, 40, 0 ] : -40, y: stage === 2 ? [ 30, -30, 0, 30, 0 ] : 30, scale: stage === 2 ? [0.8, 1.3, 1, 1.4, 1] : 0.8 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-4 h-4 rounded-full bg-electric-500 shadow-[0_0_25px_#00F0FF,0_0_50px_#00F0FF]" />
              {stage >= 2 && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <motion.path d="M 20,80 Q 50,10 80,40 T 30,70" fill="none" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [0, 0.8, 0.4] }}
                    transition={{ duration: 1.1, ease: 'easeInOut' }} style={{ filter: 'drop-shadow(0 0 8px #00F0FF)' }} />
                </svg>
              )}
            </div>
          )}
        </AnimatePresence>

        {stage >= 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.88, filter: 'blur(8px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="relative mb-8 flex flex-col items-center">
            <div className="relative overflow-hidden p-4 rounded-3xl">
              <img src="/logo-mark.png" alt="Official Studex Logo Mark" className="w-56 h-56 md:w-72 md:h-72 object-contain filter drop-shadow-[0_0_40px_rgba(0,240,255,0.75)]" />
              {stage >= 4 && (
                <motion.div initial={{ x: '-160%' }} animate={{ x: '160%' }} transition={{ duration: 1.1, ease: 'easeInOut' }}
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[25deg] pointer-events-none" />
              )}
            </div>
          </motion.div>
        )}

        {stage >= 5 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="relative flex flex-col items-center">
            <img src="/wordmark.png" alt="Official Studex Wordmark" className="h-20 md:h-28 object-contain filter drop-shadow-[0_0_24px_rgba(0,240,255,0.5)]" />
            <p className="text-[13px] tracking-[0.35em] text-neutral-300 font-extrabold uppercase mt-4">{t('splash.academicPlanner', lang)}</p>
          </motion.div>
        )}
      </div>

      <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onComplete}
        className="absolute bottom-10 text-xs tracking-wider text-white/80 hover:text-white font-medium uppercase transition-colors px-6 py-2.5 rounded-full border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 backdrop-blur-sm">
        {t('splash.skipIntro', lang)}
      </motion.button>
    </div>
  );
};
