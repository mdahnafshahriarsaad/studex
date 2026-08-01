import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Target, Compass, Play, BookOpen, BarChart2, ShieldCheck, Settings } from 'lucide-react';
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
    { path: '/subjects', label: t('nav.subjects', lang), icon: BookOpen },
    { path: '/focus', label: t('nav.focus', lang), icon: Play },
    { path: '/progress', label: t('nav.progress', lang), icon: BarChart2 },
    { path: '/guardian', label: t('nav.guardian', lang), icon: ShieldCheck },
    { path: '/settings', label: t('nav.settings', lang), icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 select-none glass-nav border-t border-white/10">
      <div className="flex items-stretch justify-around h-[72px] px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl mx-0.5 transition-all duration-200 min-w-0 ${
                  isActive
                    ? 'text-electric-400 font-semibold'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`
              }
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                'hover:bg-white/5'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] leading-tight font-medium whitespace-nowrap truncate w-full text-center px-0.5">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
