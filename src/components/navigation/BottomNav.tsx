import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Target, BookOpen, Play, BarChart2, CalendarDays, User, MoreHorizontal,
  Settings, ShieldCheck, Compass, Download, Info, X, ChevronRight
} from 'lucide-react';
import { AppSettings } from '../../types';
import { t } from '../../utils/i18n';

interface BottomNavProps {
  settings?: AppSettings;
}

const MAIN_ITEMS = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: Home },
  { path: '/calendar', labelKey: 'nav.calendar', icon: CalendarDays },
  { path: '/todays-target', labelKey: 'nav.todaysTarget', icon: Target },
  { path: '/focus', labelKey: 'nav.focus', icon: Play },
  { path: '/progress', labelKey: 'nav.progress', icon: BarChart2 },
];

const MORE_ITEMS = [
  { path: '/subjects', labelKey: 'nav.subjects', icon: BookOpen },
  { path: '/complete-syllabus', labelKey: 'nav.completeSyllabus', icon: Compass },
  { path: '/guardian', labelKey: 'nav.guardian', icon: ShieldCheck },
  { path: '/profile', labelKey: 'nav.profile', icon: User },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
  { path: '/download-app', labelKey: 'nav.download', icon: Download },
  { path: '/about', labelKey: 'nav.about', icon: Info },
];

export const BottomNav: React.FC<BottomNavProps> = ({ settings }) => {
  const lang = settings?.language || 'English';
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isMoreActive = MORE_ITEMS.some(item => location.pathname === item.path);
  const isProfileDirect = location.pathname === '/profile';

  // Close More panel on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // Close More panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 select-none glass-nav border-t border-white/10">
      {/* Safe area padding for notched phones */}
      <div className="flex items-stretch justify-around px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]" style={{ height: 'calc(68px + env(safe-area-inset-bottom, 0px))' }}>
        {MAIN_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-2xl mx-px transition-all duration-200 min-w-0 max-w-[80px] ${
                  isActive
                    ? 'text-electric-400'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`
              }
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl">
                <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
              </div>
              <span className="text-[10px] leading-tight font-medium whitespace-nowrap truncate w-full text-center">
                {t(item.labelKey, lang)}
              </span>
            </NavLink>
          );
        })}

        {/* Profile button */}
        <button
          onClick={() => navigate('/profile')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-2xl mx-px transition-all duration-200 min-w-0 max-w-[80px] ${
            isProfileDirect ? 'text-electric-400' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl">
            <User className="w-[22px] h-[22px]" strokeWidth={1.8} />
          </div>
          <span className="text-[10px] leading-tight font-medium whitespace-nowrap truncate w-full text-center">
            {t('nav.profile', lang)}
          </span>
        </button>

        {/* More button */}
        <div className="relative flex-1 min-w-0 max-w-[80px]" ref={panelRef}>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`w-full flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-2xl mx-px transition-all duration-200 ${
              moreOpen || isMoreActive ? 'text-electric-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl">
              {moreOpen ? <X className="w-[22px] h-[22px]" strokeWidth={1.8} /> : <MoreHorizontal className="w-[22px] h-[22px]" strokeWidth={1.8} />}
            </div>
            <span className="text-[10px] leading-tight font-medium whitespace-nowrap truncate w-full text-center">
              {t('nav.more', lang)}
            </span>
          </button>

          {/* More Panel */}
          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-56 glass-panel rounded-2xl border border-white/10 shadow-glass-card overflow-hidden">
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {MORE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition ${
                        isActive
                          ? 'bg-electric-500/15 text-electric-400'
                          : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
                      <span className="text-sm font-medium flex-1">{t(item.labelKey, lang)}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
