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
      {/* Mobile Brand / Workspace indicator */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img src="/logo-mark.png" alt="Studex" className="w-8 h-8 object-contain filter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
          <img src="/wordmark.png" alt="Studex" className="h-5 object-contain" />
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-electric-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t('header.academicWorkspace', lang)}
          </span>
        </div>
      </div>

      {/* Account Cloud Status & Profile Pill */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-panel border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>{g.currentStreak || 1}d {t('header.streak', lang)}</span>
        </div>

        <Badge variant="electric">Lvl {g.level || 1}</Badge>

        {/* Account Button / Auth Toggle */}
        {currentAcc ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-1.5 pr-3 py-1 transition"
            >
              <span className="text-base">{profile.avatar || '🎓'}</span>
              <span className="text-xs font-medium text-white max-w-[90px] truncate">{profile.name || 'Saad'}</span>
            </button>
            <button
              title={t('header.signOut', lang)}
              onClick={() => {
                if (confirm('Sign out of your Studex account?')) {
                  logoutAccount();
                  window.location.reload();
                }
              }}
              className="p-1.5 rounded-full bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-white/10 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onOpenAuthModal && onOpenAuthModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-electric-500/20 hover:bg-electric-500/30 border border-electric-500/40 text-electric-400 text-xs font-semibold shadow-glow-sm transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t('header.signIn', lang)}</span>
          </button>
        )}
      </div>
    </header>
  );
};
