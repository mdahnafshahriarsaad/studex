import React from 'react';
import { UserProfile, AppSettings } from '../../types';
import { Badge } from '../ui/Badge';
import { getCurrentUserAccount, logoutAccount } from '../../services/authService';
import { Sparkles, Flame, LogOut, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../utils/i18n';

interface HeaderProps {
  profile: UserProfile;
  settings?: AppSettings;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ profile, settings, onOpenAuthModal }) => {
  const navigate = useNavigate();
  const lang = settings?.language || 'English';
  const g = profile.gamification || { xp: 150, level: 1, currentStreak: 1 };
  const currentAcc = getCurrentUserAccount();

  return (
    <header className="sticky top-0 z-30 w-full bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between select-none">
      {/* Brand & Workspace indicator */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img src="/logo-mark.png" alt="Studex" className="w-20 h-20 md:w-24 md:h-24 object-contain filter drop-shadow-[0_0_28px_rgba(0,240,255,0.85)] hover:scale-105 transition" />
          <img src="/wordmark.png" alt="Studex" className="h-12 md:h-14 object-contain" />
        </div>
        <div className="hidden lg:flex items-center gap-2 ml-3 pl-4 border-l border-white/10">
          <Sparkles className="w-4.5 h-4.5 text-electric-400 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-300">
            {t('header.academicWorkspace', lang)}
          </span>
        </div>
      </div>

      {/* Account Cloud Status & Profile Pill */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>{g.currentStreak || 1}d {t('header.streak', lang)}</span>
        </div>

        <Badge variant="electric">Lvl {g.level || 1}</Badge>

        {/* Account Button / Auth Toggle */}
        {currentAcc ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-2 pr-3 py-1 transition"
            >
              <span className="text-base">{profile.avatar || '🎓'}</span>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-white max-w-[100px] truncate block leading-none">{profile.name || 'Saad'}</span>
                <span className="text-[9px] text-electric-400 font-medium leading-none">{currentAcc.email}</span>
              </div>
            </button>
            <button
              title={t('header.signOut', lang)}
              onClick={() => {
                if (confirm('Sign out of your Studex account?')) {
                  logoutAccount();
                  window.location.reload();
                }
              }}
              className="p-2 rounded-full bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-white/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onOpenAuthModal && onOpenAuthModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-electric-600 to-electric-500 hover:brightness-110 border border-electric-400/80 text-black text-xs font-bold shadow-[0_0_20px_rgba(0,240,255,0.45)] transition-all transform hover:scale-[1.03] active:scale-[0.97]"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
