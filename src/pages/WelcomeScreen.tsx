import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { APP_INFO } from '../utils/constants';

interface WelcomeScreenProps {
  onStartSetup: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartSetup }) => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between p-6 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-radial from-electric-500/15 via-electric-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md flex items-center justify-between pt-4 z-10"
      >
        <div className="flex items-center gap-2">
          <img src="/logo-mark.png" alt="Studex" className="w-8 h-8 object-contain filter drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]" />
          <img src="/wordmark.png" alt="Studex" className="h-5 object-contain" />
        </div>
        <span className="text-xs text-neutral-500 font-medium px-3 py-1 rounded-full glass-panel border border-white/10">
          v{APP_INFO.version}
        </span>
      </motion.div>

      {/* Center Welcome Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg glass-panel p-8 md:p-10 rounded-3xl border border-white/10 flex flex-col items-center text-center relative z-10 my-auto shadow-glass-card"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-500/20 to-electric-700/20 border border-electric-500/30 flex items-center justify-center mb-6 shadow-glow-sm">
          <Sparkles className="w-8 h-8 text-electric-400" />
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-electric-400 to-electric-500">Studex</span>
        </h1>

        <p className="text-neutral-400 text-base md:text-lg font-normal leading-relaxed max-w-sm mb-8">
          Plan smarter.<br />
          Study better.<br />
          Achieve more.
        </p>

        <div className="w-full space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<ArrowRight className="w-5 h-5 ml-1" />}
            onClick={onStartSetup}
          >
            Start Setup
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-electric-400" />
          <span>Local setup &bull; No account required</span>
        </div>
      </motion.div>

      {/* Footer copyright */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.8 }}
        className="pb-4 text-xs text-neutral-500 text-center z-10"
      >
        <p>{APP_INFO.copyright}</p>
        <p className="text-[10px] text-neutral-600 mt-1">
          Developed by {APP_INFO.developers.join(' & ')}
        </p>
      </motion.div>
    </div>
  );
};
