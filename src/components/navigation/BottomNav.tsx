import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Target, Compass, Play, BookOpen, BarChart2, ShieldCheck, Smartphone, Settings } from 'lucide-react';
import { AppSettings } from '../../types';
import { t } from '../../utils/i18n';

interface BottomNavProps {
  settings?: AppSettings;
}

export const BottomNav: React.FC<BottomNavProps> = ({ settings }) => {
  const lang = settings?.language || 'English';

  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard', lang), icon: Home },
    { path: '/todays-target', label: t('nav.todaysTarget', lang), icon: Target },
    { path: '/complete-syllabus', label: t('nav.completeSyllabus', lang), icon: Compass },
    { path: '/focus', label: t('nav.focus', lang), icon: Play },
    { path: '/subjects', label: t('nav.subjects', lang), icon: BookOpen },
    { path: '/progress', label: t('nav.progress', lang), icon: BarChart2 },
    { path: '/guardian', label: t('nav.guardian', lang), icon: ShieldCheck },
    { path: '/download-app', label: t('nav.downloadApp', lang), icon: Smartphone },
    { path: '/settings', label: t('nav.settings', lang), icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-2xl border-t border-white/10 px-2 flex items-center justify-around z-40 overflow-x-auto select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 min-w-[46px] ${
                isActive
                  ? 'text-electric-400 font-semibold scale-105'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="text-[9px] tracking-wide whitespace-nowrap">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
