import React from 'react';
import { motion } from 'framer-motion';
import { AppSettings, AnimationMode, PerformanceMode, ThemeMode } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { requestNotificationPermission } from '../services/notificationService';
import { getCurrentUserAccount, logoutAccount } from '../services/authService';
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
  { id: 'Soft Sage Glass', label: 'Soft Sage Glass', desc: 'Apple-inspired soft green frosted glass' },
  { id: 'Neo Green', label: 'Neo Green', desc: 'Dark premium with bright green accent' },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetSetup,
  onReplaySplash,
}) => {
  const navigate = useNavigate();

  const animationModes: AnimationMode[] = ['OFF', 'Balanced', 'Full'];

  const handleNotificationToggle = async (key: 'studyReminder' | 'examReminder' | 'guardianReport') => {
    const granted = await requestNotificationPermission();
    if (granted || !settings.notifications[key]) {
      onUpdateSettings({
        notifications: {
          ...settings.notifications,
          [key]: !settings.notifications[key],
        },
      });
    } else {
      alert('Notification permissions are required to enable smart alerts.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 select-none">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">App Settings</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Configure theme styles, Liquid Glass performance mode, notifications, and language.
        </p>
      </div>

      {/* 1. THEME SELECTOR (4 THEMES REQUIREMENT) */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Theme System</h3>
                <p className="text-xs text-neutral-400">Select your preferred Apple Liquid Glass appearance</p>
              </div>
            </div>
            <Badge variant="electric">{settings.theme || 'AMOLED Dark'}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => onUpdateSettings({ theme: t.id })}
                className={`p-4 rounded-xl text-left transition border ${
                  settings.theme === t.id
                    ? 'bg-electric-500/20 border-electric-400 text-white shadow-glow-sm scale-[1.02]'
                    : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{t.label}</span>
                  {settings.theme === t.id && <Check className="w-4 h-4 text-electric-400" />}
                </div>
                <p className="text-xs text-neutral-400 mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 2. PERFORMANCE ENGINE TUNING (HIGH QUALITY VS PERFORMANCE MODE) */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Performance & Glass Engine</h3>
                <p className="text-xs text-neutral-400">Optimize Liquid Glass blur effects for low-end phones</p>
              </div>
            </div>
            <Badge variant="electric">{settings.performanceMode || 'High Quality'}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onUpdateSettings({ performanceMode: 'High Quality' })}
              className={`p-4 rounded-xl text-left transition border ${
                settings.performanceMode === 'High Quality'
                  ? 'bg-electric-500/20 border-electric-400 text-white shadow-glow-sm scale-[1.02]'
                  : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-electric-400" />
                  High Quality Mode
                </span>
                {settings.performanceMode === 'High Quality' && <Check className="w-4 h-4 text-electric-400" />}
              </div>
              <p className="text-xs text-neutral-400 mt-1">Full backdrop blur, liquid glass glows, & depth reflections</p>
            </button>

            <button
              onClick={() => onUpdateSettings({ performanceMode: 'Performance Mode' })}
              className={`p-4 rounded-xl text-left transition border ${
                settings.performanceMode === 'Performance Mode'
                  ? 'bg-electric-500/20 border-electric-400 text-white shadow-glow-sm scale-[1.02]'
                  : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Performance Mode
                </span>
                {settings.performanceMode === 'Performance Mode' && <Check className="w-4 h-4 text-electric-400" />}
              </div>
              <p className="text-xs text-neutral-400 mt-1">Lightweight blur for budget mobile phones & maximum battery saver</p>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 3. Animation System Control */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Animation Mode</h3>
                <p className="text-xs text-neutral-400">Balanced is default for optimal 60 FPS motion</p>
              </div>
            </div>
            <Badge variant="electric">{settings.animationMode}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            {animationModes.map((mode) => (
              <button
                key={mode}
                onClick={() => onUpdateSettings({ animationMode: mode })}
                className={`p-3.5 rounded-xl font-semibold text-sm transition border text-center ${
                  settings.animationMode === mode
                    ? 'bg-electric-500/20 border-electric-500 text-electric-400 shadow-glow-sm scale-105'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                }`}
              >
                {mode}
                {mode === 'Balanced' && <span className="block text-[10px] font-normal text-neutral-400 mt-0.5">(Default)</span>}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 4. Smart Notifications Control */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Smart Notifications</h3>
                <p className="text-xs text-neutral-400">Timely reminders without notification spam</p>
              </div>
            </div>
            <Button size="sm" variant="glass" onClick={requestNotificationPermission}>
              Enable Permissions
            </Button>
          </div>

          <div className="space-y-2 pt-1">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white block">Study Reminders</span>
                <span className="text-neutral-400">Notifies 5 mins before preferred study hour</span>
              </div>
              <button
                onClick={() => handleNotificationToggle('studyReminder')}
                className={`w-11 h-6 rounded-full transition p-1 flex items-center ${
                  settings.notifications?.studyReminder ? 'bg-electric-500 justify-end' : 'bg-neutral-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-black shadow-md" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white block">Exam Countdown Alerts</span>
                <span className="text-neutral-400">Daily syllabus page target reminders</span>
              </div>
              <button
                onClick={() => handleNotificationToggle('examReminder')}
                className={`w-11 h-6 rounded-full transition p-1 flex items-center ${
                  settings.notifications?.examReminder ? 'bg-electric-500 justify-end' : 'bg-neutral-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-black shadow-md" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white block">Guardian Daily Report</span>
                <span className="text-neutral-400">Automated 12:00 AM summary updates</span>
              </div>
              <button
                onClick={() => handleNotificationToggle('guardianReport')}
                className={`w-11 h-6 rounded-full transition p-1 flex items-center ${
                  settings.notifications?.guardianReport ? 'bg-electric-500 justify-end' : 'bg-neutral-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-black shadow-md" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 5. Language Setting */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Interface Language</h3>
              <p className="text-xs text-neutral-400">Select language for interface labels</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateSettings({ language: 'English' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                settings.language === 'English'
                  ? 'bg-electric-500/20 border-electric-500 text-electric-400'
                  : 'bg-white/5 border-white/10 text-neutral-400'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onUpdateSettings({ language: 'Bengali' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                settings.language === 'Bengali'
                  ? 'bg-electric-500/20 border-electric-500 text-electric-400'
                  : 'bg-white/5 border-white/10 text-neutral-400'
              }`}
            >
              বাংলা (Bengali)
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 6. Email Account & Cloud Sync Settings */}
      {(() => {
        const currentAcc = getCurrentUserAccount();
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
                    {currentAcc
                      ? `Signed in as ${currentAcc.email}`
                      : 'Sign in to automatically back up and sync syllabus progress'}
                  </p>
                </div>
              </div>

              <div>
                {currentAcc ? (
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
                    Sign Out ({currentAcc.email.split('@')[0]})
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Lock className="w-4 h-4" />}
                    onClick={() => onOpenAuthModal && onOpenAuthModal()}
                  >
                    Email Login / Register
                  </Button>
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
            <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">About Studex</h3>
              <p className="text-xs text-neutral-400">Version 1.0 Production &bull; Global EdTech</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="glass" size="sm" onClick={onReplaySplash}>
              Replay Splash Screen
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/about')}>
              View About Page
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* 7. Reset Setup */}
      <GlassCard className="border-red-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-red-400 text-base">Re-run Setup Wizard</h3>
            <p className="text-xs text-neutral-400">Reset your profile setup to re-configure subjects & targets</p>
          </div>
          <Button variant="danger" size="sm" icon={<RotateCcw className="w-4 h-4" />} onClick={onResetSetup}>
            Reset Setup
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
