import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { APP_INFO } from '../utils/constants';
import { t, getCurrentLanguage } from '../utils/i18n';
import { ShieldCheck, Code, Award, ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const lang = getCurrentLanguage();

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 select-none">
      <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/settings')}>
        {t('about.backToSettings', lang)}
      </Button>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <GlassCard className="p-8 md:p-10 flex flex-col items-center text-center space-y-6 border-electric-500/30">
          <div className="relative">
            <img src="/logo-mark.png" alt="Studex Logo" className="w-48 h-48 object-contain filter drop-shadow-[0_0_35px_rgba(0,240,255,0.75)]" />
            <div className="absolute -bottom-2 -right-2"><Badge variant="electric">v{APP_INFO.version}</Badge></div>
          </div>

          <div>
            <img src="/wordmark.png" alt="Studex Wordmark" className="h-28 sm:h-30 md:h-32 object-contain mx-auto" />
            <p className="text-base text-neutral-300 font-semibold mt-3">{APP_INFO.tagline}</p>
          </div>

          <div className="w-full h-[1px] bg-white/10 my-4" />

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
