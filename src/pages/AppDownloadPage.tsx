import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Download, Smartphone, Globe, ShieldCheck, CheckCircle2, Sparkles, ArrowDownToLine, Zap } from 'lucide-react';

export const AppDownloadPage: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [downloadingApk, setDownloadingApk] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('PWA installation is supported directly via your browser menu (Add to Home Screen).');
    }
  };

  const handleDownloadApk = () => {
    setDownloadingApk(true);
    const link = document.createElement('a');
    link.href = '/Studex.apk';
    link.download = 'Studex.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingApk(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 select-none">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <GlassCard className="border-electric-500/40 bg-gradient-to-r from-electric-700/10 via-black to-black p-6 md:p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-electric-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-electric-400">Mobile Ecosystem</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Download Studex App <span className="inline-block text-electric-400">📲</span>
              </h1>
              <p className="text-neutral-400 text-sm mt-1">
                Install Studex natively on Android or as a Progressive Web App (PWA) with full offline support.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <img
                src="/logo-mark.png"
                alt="Studex Official Icon"
                className="w-40 h-40 object-contain filter drop-shadow-[0_0_40px_rgba(0,240,255,0.85)]"
              />
              <img src="/wordmark.png" alt="Studex" className="h-20 object-contain" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Main Download Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Android APK Download Option */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <GlassCard className="h-full flex flex-col justify-between border-electric-500/30 hover:border-electric-500/60 transition shadow-glow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-electric-500/20 text-electric-400 border border-electric-500/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <Badge variant="electric">Android Native</Badge>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">Android APK Download</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Download the official Studex standalone APK file directly to your Android device for high-performance offline studying.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Official Studex App Icon included</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>AMOLED Dark UI & Liquid Glass support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Fast offline data sync</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={downloadingApk}
                icon={<ArrowDownToLine className="w-4 h-4" />}
                onClick={handleDownloadApk}
              >
                {downloadingApk ? 'Starting Download...' : 'Download Android APK'}
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* PWA Install Option */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <GlassCard className="h-full flex flex-col justify-between border-white/10 hover:border-electric-500/40 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-white/10 text-white border border-white/10">
                  <Globe className="w-6 h-6" />
                </div>
                <Badge variant="glass">Universal PWA</Badge>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">PWA Web App Installation</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Install Studex directly to your Home Screen on iOS, Android, macOS, or Windows without downloading an APK.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant installation without app stores</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Standalone app window experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Automatic background sync</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                variant="glass"
                size="lg"
                fullWidth
                disabled={isInstalled}
                icon={<Sparkles className="w-4 h-4 text-electric-400" />}
                onClick={handlePWAInstall}
              >
                {isInstalled ? 'App Already Installed' : 'Install PWA App'}
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Security & Icon Guarantee */}
      <GlassCard className="p-4 border-white/10 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-electric-400 flex-shrink-0" />
          <span>All packages use official 3D Studex branding & pass end-to-end security verification.</span>
        </div>
        <Badge variant="glass">v1.0.0 Stable</Badge>
      </GlassCard>
    </div>
  );
};
