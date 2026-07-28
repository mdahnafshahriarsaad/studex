import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Button } from './Button';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || isInstalled || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 animate-bounce-once">
      <div className="glass-panel p-4 rounded-2xl border border-electric-500/40 bg-black/90 backdrop-blur-xl shadow-glow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-electric-500/20 flex items-center justify-center border border-electric-500/40 text-electric-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Install Studex App</h4>
            <p className="text-xs text-neutral-400">Fast offline study access on mobile & desktop</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" icon={<Download className="w-3.5 h-3.5" />} onClick={triggerInstall}>
            Install
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
