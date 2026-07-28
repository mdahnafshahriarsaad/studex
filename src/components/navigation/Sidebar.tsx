import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Target, Compass, Play, BookOpen, BarChart2, User, ShieldCheck, Smartphone, Settings, Info } from 'lucide-react';
import { APP_INFO } from '../../utils/constants';
import { AppSettings } from '../../types';
import { t } from '../../utils/i18n';

interface SidebarProps {
  settings?: AppSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({ settings }) => {
  const lang = settings?.language || 'English';

  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard', lang), icon: Home },
    { path: '/todays-target', label: t('nav.todaysTarget', lang), icon: Target },
    { path: '/complete-syllabus', label: t('nav.completeSyllabus', lang), icon: Compass },
    { path: '/focus', label: t('nav.focus', lang), icon: Play },
    { path: '/subjects', label: t('nav.subjects', lang), icon: BookOpen },
    { path: '/progress', label: t('nav.progress', lang), icon: BarChart2 },
    { path: '/profile', label: t('nav.profile', lang), icon: User },
    { path: '/guardian', label: t('nav.guardian', lang), icon: ShieldCheck },
    { path: '/download-app', label: t('nav.downloadApp', lang), icon: Smartphone },
    { path: '/settings', label: t('nav.settings', lang), icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-black/80 backdrop-blur-2xl border-r border-white/10 p-5 z-40 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-white/10">
        <img
          src="/logo-mark.png"
          alt="Studex Logo"
          className="w-10 h-10 object-contain filter drop-shadow-[0_0_12px_rgba(0,240,255,0.5)]"
        />
        <div className="flex flex-col">
          <img src="/wordmark.png" alt="Studex" className="h-6 object-contain self-start" />
          <span className="text-[10px] tracking-widest text-neutral-400 font-semibold uppercase mt-0.5">
            {t('header.academicWorkspace', lang)}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-electric-500/15 text-electric-400 border border-electric-500/30 shadow-glow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/10 px-2 text-xs text-neutral-500">
        <NavLink to="/about" className="flex items-center gap-2 text-neutral-400 hover:text-white mb-1.5 transition">
          <Info className="w-4 h-4" />
          <span>{t('nav.about', lang)} v{APP_INFO.version}</span>
        </NavLink>
        <p className="text-[10px] text-neutral-500">{APP_INFO.copyright}</p>
      </div>
    </aside>
  );
};
