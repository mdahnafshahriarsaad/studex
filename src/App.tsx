import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
    toggleChapterComplete,
    toggleRevisionComplete,
    triggerMissedRecovery,
    resetSetup,
  } = useUserStore();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [inWelcomeFlow, setInWelcomeFlow] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

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
      return <WelcomeScreen onStartSetup={handleStartSetup} />;
    }
    return <SetupWizard initialProfile={profile} onComplete={handleWizardComplete} />;
  }

  return (
    <Router>
      {showAuthModal && <AuthModal onSuccess={() => setShowAuthModal(false)} />}

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
