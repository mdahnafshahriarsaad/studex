import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './hooks/useUserStore';
import { SplashScreen } from './pages/SplashScreen';
import { WelcomeScreen } from './pages/WelcomeScreen';
import { SetupWizard } from './pages/SetupWizard';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TodaysTargetPage } from './pages/TodaysTargetPage';
import { CompleteSyllabusPage } from './pages/CompleteSyllabusPage';
import { AppDownloadPage } from './pages/AppDownloadPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { ProgressPage } from './pages/ProgressPage';
import { FocusPage } from './pages/FocusPage';
import { GuardianPage } from './pages/GuardianPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { AuthModal } from './pages/AuthModal';
import { CalendarPage } from './pages/CalendarPage';

// Synchronous: apply Bangla font class BEFORE React renders (prevents flash)
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('studex-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.language === 'Bengali') {
        document.body.classList.add('lang-bengali');
      }
      document.documentElement.setAttribute('data-lang', parsed.language || 'English');
    }
  } catch (e) { /* ignore */ }
}

export const App: React.FC = () => {
  const {
    profile,
    settings,
    updateProfile,
    updateSettings,
    addSubject,
    editSubject,
    removeSubject,
    reorderSubjects,
    addChapterToSubject,
    removeChapterFromSubject,
    editChapterInSubject,
    reorderChapters,
    toggleChapterComplete,
    replaceSyllabus,
    toggleRevisionComplete,
    triggerMissedRecovery,
    resetSetup,
  } = useUserStore();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [inWelcomeFlow, setInWelcomeFlow] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Auto-open AuthModal if URL contains a verifyToken (email verification link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verifyToken')) {
      setShowSplash(false);
      setShowAuthModal(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleStartSetup = () => {
    setInWelcomeFlow(false);
  };

  const handleWizardComplete = (finalProfile: any) => {
    updateProfile(finalProfile);
    setInWelcomeFlow(false);
  };

  const handleReplaySplash = () => {
    setShowSplash(true);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!profile.setupCompleted) {
    if (inWelcomeFlow) {
      return (
        <>
          {showAuthModal && (
            <AuthModal
              onSuccess={() => setShowAuthModal(false)}
              onClose={() => setShowAuthModal(false)}
            />
          )}
          <WelcomeScreen
            onStartSetup={handleStartSetup}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        </>
      );
    }
    return <SetupWizard initialProfile={profile} onComplete={handleWizardComplete} />;
  }

  return (
    <Router>
      {showAuthModal && (
        <AuthModal
          onSuccess={() => setShowAuthModal(false)}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      <Routes>
        <Route
          path="/"
          element={
            <MainLayout
              profile={profile}
              settings={settings}
              onOpenAuthModal={() => setShowAuthModal(true)}
            />
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <DashboardPage
                profile={profile}
                settings={settings}
                onToggleChapterComplete={toggleChapterComplete}
                onToggleRevisionComplete={toggleRevisionComplete}
              />
            }
          />
          <Route
            path="todays-target"
            element={
              <TodaysTargetPage
                profile={profile}
                onToggleChapterComplete={toggleChapterComplete}
              />
            }
          />
          <Route
            path="complete-syllabus"
            element={<CompleteSyllabusPage profile={profile} />}
          />
          <Route path="download-app" element={<AppDownloadPage />} />
          <Route
            path="subjects"
            element={
              <SubjectsPage
                profile={profile}
                onAddSubject={addSubject}
                onEditSubject={editSubject}
                onRemoveSubject={removeSubject}
                onReorderSubjects={reorderSubjects}
                onAddChapter={addChapterToSubject}
                onRemoveChapter={removeChapterFromSubject}
                onEditChapter={editChapterInSubject}
                onReorderChapters={reorderChapters}
                onToggleChapterComplete={toggleChapterComplete}
              />
            }
          />
          <Route
            path="progress"
            element={
              <ProgressPage
                profile={profile}
                onToggleRevisionComplete={toggleRevisionComplete}
                onTriggerMissedRecovery={triggerMissedRecovery}
              />
            }
          />
          <Route
            path="guardian"
            element={
              <GuardianPage
                profile={profile}
                onUpdateProfile={updateProfile}
              />
            }
          />
          <Route path="profile" element={<ProfilePage profile={profile} />} />
          <Route
            path="settings"
            element={
              <SettingsPage
                settings={settings}
                onUpdateSettings={updateSettings}
                onResetSetup={resetSetup}
                onReplaySplash={handleReplaySplash}
              />
            }
          />
          <Route path="about" element={<AboutPage />} />
          <Route path="calendar" element={<CalendarPage />} />
        </Route>

        {/* Fullscreen Focus Mode (Outside MainLayout) */}
        <Route
          path="/focus"
          element={
            <FocusPage
              profile={profile}
              onUpdateProfile={updateProfile}
              onToggleChapterComplete={toggleChapterComplete}
            />
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
