import React, { useEffect } from 'react';
import { Sidebar } from '../components/navigation/Sidebar';
import { BottomNav } from '../components/navigation/BottomNav';
import { Header } from '../components/navigation/Header';
import { PWAInstallPrompt } from '../components/ui/PWAInstallPrompt';
import { UserProfile, AppSettings } from '../types';
import { Outlet } from 'react-router-dom';

interface MainLayoutProps {
  profile: UserProfile;
  settings?: AppSettings;
  onOpenAuthModal?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ profile, settings, onOpenAuthModal }) => {

  // Apply active Theme & Performance mode CSS classes to body element
  useEffect(() => {
    const theme = settings?.theme || 'AMOLED Dark';
    const perf = settings?.performanceMode || 'High Quality';

    const themeClass =
      theme === 'Midnight Blue'
        ? 'theme-midnight'
        : theme === 'Light Glass'
        ? 'theme-light-glass'
        : theme === 'Minimal White'
        ? 'theme-minimal-white'
        : 'theme-amoled';

    const perfClass = perf === 'Performance Mode' ? 'perf-performance' : 'perf-high-quality';

    document.body.className = `${themeClass} ${perfClass}`;
  }, [settings?.theme, settings?.performanceMode]);

  return (
    <div className="min-h-screen text-white flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Background Studex Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-5 select-none">
        <img src="/watermark.png" alt="" className="w-[600px] h-[600px] object-contain" />
      </div>

      {/* Sidebar for Desktop */}
      <Sidebar settings={settings} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-8 relative z-10">
        <Header profile={profile} settings={settings} onOpenAuthModal={onOpenAuthModal} />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet context={{ onOpenAuthModal }} />
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav settings={settings} />

      {/* PWA Install Banner */}
      <PWAInstallPrompt />
    </div>
  );
};
