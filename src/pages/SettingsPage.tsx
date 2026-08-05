import React from 'react';
import { motion } from 'framer-motion';
import { AppSettings, AnimationMode, ThemeMode } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { requestNotificationPermission } from '../services/notificationService';
import { getCurrentFirebaseUser, logoutAccount } from '../services/authService';
import { t, getCurrentLanguage } from '../utils/i18n';
import {
  Settings, Sliders, Globe, Info, RotateCcw, Smartphone, Moon, Cpu, Bell, ShieldCheck, Check, Sparkles, Zap, Mail, Lock, LogOut
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onResetSetup: () => void;
  onReplaySplash: () => void;
}

const THEME_OPTIONS: { id: ThemeMode; label: string; desc: string }[] = [
  { id: 'AMOLED Dark', label: 'AMOLED Dark', desc: 'Pure Apple AMOLED black (Default)' },
  { id: 'Ocean Blue', label: 'Ocean Blue', desc: 'Deep sapphire navy glass' },
  { id: 'Light Mode', label: 'Light Mode', desc: 'Clean light card UI with Apple-level minimalism' },
  { id: 'Neo Green', label: 'Neo Green', desc: 'Dark premium with bright green accent' },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetSetup,
  onReplaySplash,
}) => {
  const lang = settings?.language || 'English';
  const navigate = useNavigate();
  const animationModes: AnimationMode[] = ['OFF', 'Balanced', 'Full'];

  const handleNotificationToggle = async (key: 'studyReminder' | 'examReminder' | 'guardianReport') => {
    const granted = await requestNotificationPermission();
    if (granted || !settings.notifications[key]) {
      onUpdateSettings({ notifications: { ...settings.notifications, [key]: !settings.notifications[key] } });
    } else {
      alert(t('settings.notificationRequired', lang));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 select-none">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">{t('settings.title', lang)}</h1>
        <p className="text-neutral-400 text-sm mt-1">{t('settings.subheading', lang)}</p>
      </div>

      {/* 1. THEME SELECTOR */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400"><Moon className="w-5 h-5" /></div>
              <div><h3 className="font-bold text-white text-base">{t('settings.themeTitle', lang)}</h3><p className="text-xs text-neutral-400">{t('settings.themeDesc', lang)}</p></div>
            </div>
            <Badge variant="electric">{settings.theme || 'AMOLED Dark'}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {THEME_OPTIONS.map((t_opt) => (
              <button key={t_opt.id} onClick={() => onUpdateSettings({ theme: t_opt.id })}
                className={`p-4 rounded-xl text-left transition border ${settings.theme === t_opt.id ? 'bg-electric-500/20 border-electric-400 text-white shadow-glow-sm scale-[1.02]' : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'}`}>
                <div className="flex items-center justify-between"><span className="font-bold text-sm">{t_opt.label}</span>{settings.theme === t_opt.id && <Check className="w-4 h-4 text-electric-400" />}</div>
                <p className="text-xs text-neutral-400 mt-1">{t_opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 2. PERFORMANCE ENGINE */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400"><Cpu className="w-5 h-5" /></div>
              <div><h3 className="font-bold text-white text-base">{t('settings.performanceTitle', lang)}</h3><p className="text-xs text-neutral-400">{t('settings.performanceDesc', lang)}</p></div>
            </div>
            <Badge variant="electric">{settings.performanceMode || 'High Quality'}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button onClick={() => onUpdateSettings({ performanceMode: 'High Quality' })}
              className={`p-4 rounded-xl text-left transition border ${settings.performanceMode === 'High Quality' ? 'bg-electric-500/20 border-electric-400 text-white shadow-glow-sm scale-[1.02]' : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'}`}>
              <div className="flex items-center justify-between"><span className="font-bold text-sm flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-electric-400" />{t('settings.highQuality', lang)}</span>{settings.performanceMode === 'High Quality' && <Check className="w-4 h-4 text-electric-400" />}</div>
              <p className="text-xs text-neutral-400 mt-1">{t('settings.fullBlur', lang)}</p>
            </button>
            <button onClick={() => onUpdateSettings({ performanceMode: 'Performance Mode' })}
              className={`p-4 rounded-xl text-left transition border ${settings.performanceMode === 'Performance Mode' ? 'bg-electric-500/20 border-electric-400 text-white shadow-glow-sm scale-[1.02]' : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'}`}>
              <div className="flex items-center justify-between"><span className="font-bold text-sm flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-400" />{t('settings.performanceMode', lang)}</span>{settings.performanceMode === 'Performance Mode' && <Check className="w-4 h-4 text-electric-400" />}</div>
              <p className="text-xs text-neutral-400 mt-1">{t('settings.lightweight', lang)}</p>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 3. Animation System */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400"><Sliders className="w-5 h-5" /></div>
              <div><h3 className="font-bold text-white text-base">{t('settings.animationTitle', lang)}</h3><p className="text-xs text-neutral-400">{t('settings.animationDesc', lang)}</p></div>
            </div>
            <Badge variant="electric">{settings.animationMode}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            {animationModes.map((mode) => (
              <button key={mode} onClick={() => onUpdateSettings({ animationMode: mode })}
                className={`p-3.5 rounded-xl font-semibold text-sm transition border text-center ${settings.animationMode === mode ? 'bg-electric-500/20 border-electric-500 text-electric-400 shadow-glow-sm scale-105' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'}`}>
                {mode}
                {mode === 'Balanced' && <span className="block text-[10px] font-normal text-neutral-400 mt-0.5">{t('settings.default', lang)}</span>}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 4. Smart Notifications */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400"><Bell className="w-5 h-5" /></div>
              <div><h3 className="font-bold text-white text-base">{t('settings.notificationsTitle', lang)}</h3><p className="text-xs text-neutral-400">{t('settings.notificationsDesc', lang)}</p></div>
            </div>
            <Button size="sm" variant="glass" onClick={requestNotificationPermission}>{t('settings.enablePermissions', lang)}</Button>
          </div>
          <div className="space-y-2 pt-1">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div><span className="font-semibold text-white block">{t('settings.studyReminders', lang)}</span><span className="text-neutral-400">{t('settings.studyRemindersDesc', lang)}</span></div>
              <button onClick={() => handleNotificationToggle('studyReminder')} className={`w-11 h-6 rounded-full transition p-1 flex items-center ${settings.notifications?.studyReminder ? 'bg-electric-500 justify-end' : 'bg-neutral-800 justify-start'}`}><div className="w-4 h-4 rounded-full bg-black shadow-md" /></button>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div><span className="font-semibold text-white block">{t('settings.examAlerts', lang)}</span><span className="text-neutral-400">{t('settings.examAlertsDesc', lang)}</span></div>
              <button onClick={() => handleNotificationToggle('examReminder')} className={`w-11 h-6 rounded-full transition p-1 flex items-center ${settings.notifications?.examReminder ? 'bg-electric-500 justify-end' : 'bg-neutral-800 justify-start'}`}><div className="w-4 h-4 rounded-full bg-black shadow-md" /></button>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div><span className="font-semibold text-white block">{t('settings.guardianReport', lang)}</span><span className="text-neutral-400">{t('settings.guardianReportDesc', lang)}</span></div>
              <button onClick={() => handleNotificationToggle('guardianReport')} className={`w-11 h-6 rounded-full transition p-1 flex items-center ${settings.notifications?.guardianReport ? 'bg-electric-500 justify-end' : 'bg-neutral-800 justify-start'}`}><div className="w-4 h-4 rounded-full bg-black shadow-md" /></button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 5. Language Setting */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400"><Globe className="w-5 h-5" /></div>
            <div><h3 className="font-bold text-white text-base">{t('settings.languageTitle', lang)}</h3><p className="text-xs text-neutral-400">{t('settings.languageDesc', lang)}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onUpdateSettings({ language: 'English' })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${settings.language === 'English' ? 'bg-electric-500/20 border-electric-500 text-electric-400' : 'bg-white/5 border-white/10 text-neutral-400'}`}>English</button>
            <button onClick={() => onUpdateSettings({ language: 'Bengali' })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${settings.language === 'Bengali' ? 'bg-electric-500/20 border-electric-500 text-electric-400' : 'bg-white/5 border-white/10 text-neutral-400'}`}>বাংলা (Bengali)</button>
          </div>
        </div>
      </GlassCard>

      {/* Bangla Numbers Toggle */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400"><ShieldCheck className="w-5 h-5" /></div>
            <div><h3 className="font-bold text-white text-base">{t('settings.banglaNumbers', lang)}</h3><p className="text-xs text-neutral-400">{t('settings.banglaNumbersDesc', lang)}</p></div>
          </div>
          <button onClick={() => onUpdateSettings({ useBanglaNumbers: !settings.useBanglaNumbers })} className={`w-11 h-6 rounded-full transition p-1 flex items-center ${settings.useBanglaNumbers ? 'bg-electric-500 justify-end' : 'bg-neutral-800 justify-start'}`}><div className="w-4 h-4 rounded-full bg-black shadow-md" /></button>
        </div>
      </GlassCard>

      {/* 6. Email Account & Cloud Sync */}
      {(() => {
        const firebaseUser = getCurrentFirebaseUser();
        const { onOpenAuthModal } = (useOutletContext() || {}) as { onOpenAuthModal?: () => void };
        return (
          <GlassCard className="border-electric-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Email Account & Cloud Sync</h3>
                  <p className="text-xs text-neutral-400">
                    {firebaseUser
                      ? `Signed in as ${firebaseUser.email}`
                      : 'Sign in to automatically back up and sync syllabus progress'}
                  </p>
                </div>
              </div>
              <div>
                {firebaseUser ? (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<LogOut className="w-4 h-4" />}
                    onClick={() => {
                      if (confirm('Sign out of your email account?')) {
                        logoutAccount();
                        window.location.reload();
                      }
                    }}
                  >
                    Sign Out ({firebaseUser.email?.split('@')[0] || 'User'})
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" icon={<Lock className="w-4 h-4" />} onClick={() => onOpenAuthModal && onOpenAuthModal()}>{t('settings.emailLogin', lang)}</Button>
                )}
              </div>
            </div>
          </GlassCard>
        );
      })()}

      {/* 7. App & Developer Info */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400"><Info className="w-5 h-5" /></div>
            <div><h3 className="font-bold text-white text-base">{t('settings.aboutTitle', lang)}</h3><p className="text-xs text-neutral-400">{t('settings.aboutVersion', lang)}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="glass" size="sm" onClick={onReplaySplash}>{t('settings.replaySplash', lang)}</Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/about')}>{t('settings.viewAbout', lang)}</Button>
          </div>
        </div>
      </GlassCard>

      {/* Reset Setup */}
      <GlassCard className="border-red-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h3 className="font-bold text-red-400 text-base">{t('settings.resetSetup', lang)}</h3><p className="text-xs text-neutral-400">{t('settings.resetDesc', lang)}</p></div>
          <Button variant="danger" size="sm" icon={<RotateCcw className="w-4 h-4" />} onClick={onResetSetup}>{t('settings.resetSetup', lang)}</Button>
        </div>
      </GlassCard>
    </div>
  );
};
