import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from './hooks/useUserStore';
import { auth } from './lib/firebase';
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
import { FuturePlansPage } from './pages/FuturePlansPage';
import { AuthModal } from './pages/AuthModal';
import { CalendarPage } from './pages/CalendarPage';
import { SplashPreviewPage } from './pages/SplashPreviewPage';

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

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleStartSetup = () => {
    setInWelcomeFlow(false);
  };

  const handleWizardComplete = (finalProfile: any) => {
    updateProfile(finalProfile);
    setInWelcomeFlow(false);
    // Increment guest count if NOT logged in via Firebase Auth
    if (!auth.currentUser) {
      import('./services/statsService').then(({ incrementGuestSignupCount }) => {
        incrementGuestSignupCount();
      });
    }
  };

  const handleReplaySplash = () => {
    setShowSplash(true);
  };

  // Render
  return (
    <Router>
      {showAuthModal && (
        <AuthModal
          onSuccess={() => setShowAuthModal(false)}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      <AppRoutes
        profile={profile}
        settings={settings}
        updateProfile={updateProfile}
        addSubject={addSubject}
        editSubject={editSubject}
        removeSubject={removeSubject}
        reorderSubjects={reorderSubjects}
        addChapterToSubject={addChapterToSubject}
        removeChapterFromSubject={removeChapterFromSubject}
        editChapterInSubject={editChapterInSubject}
        reorderChapters={reorderChapters}
        toggleChapterComplete={toggleChapterComplete}
        toggleRevisionComplete={toggleRevisionComplete}
        triggerMissedRecovery={triggerMissedRecovery}
        resetSetup={resetSetup}
        updateSettings={updateSettings}
        handleReplaySplash={handleReplaySplash}
        handleStartSetup={handleStartSetup}
        handleWizardComplete={handleWizardComplete}
        onOpenAuthModal={() => setShowAuthModal(true)}
        showSplash={showSplash}
        setShowSplash={setShowSplash}
        inWelcomeFlow={inWelcomeFlow}
      />
    </Router>
  );
};

// ─── Inner routes component (uses useLocation inside Router) ───────────

interface AppRoutesProps {
  profile: any;
  settings: any;
  updateProfile: any;
  addSubject: any;
  editSubject: any;
  removeSubject: any;
  reorderSubjects: any;
  addChapterToSubject: any;
  removeChapterFromSubject: any;
  editChapterInSubject: any;
  reorderChapters: any;
  toggleChapterComplete: any;
  toggleRevisionComplete: any;
  triggerMissedRecovery: any;
  resetSetup: any;
  updateSettings: any;
  handleReplaySplash: () => void;
  handleStartSetup: () => void;
  handleWizardComplete: (p: any) => void;
  onOpenAuthModal: () => void;
  showSplash: boolean;
  setShowSplash: (v: boolean) => void;
  inWelcomeFlow: boolean;
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  profile, settings, updateProfile, addSubject, editSubject, removeSubject,
  reorderSubjects, addChapterToSubject, removeChapterFromSubject, editChapterInSubject,
  reorderChapters, toggleChapterComplete, toggleRevisionComplete,
  triggerMissedRecovery, resetSetup, updateSettings, handleReplaySplash,
  handleStartSetup, handleWizardComplete, onOpenAuthModal,
  showSplash, setShowSplash, inWelcomeFlow,
}) => {
  const location = useLocation();
  const isPublicGuardian = location.pathname === '/guardian' && !profile.setupCompleted;

  // Splash preview — always public
  if (location.pathname === '/splash-preview') {
    return (
      <Routes>
        <Route path="/splash-preview" element={<SplashPreviewPage />} />
      </Routes>
    );
  }

  // Public guardian access (share link with ?code=, user not logged in)
  if (isPublicGuardian) {
    return (
      <Routes>
        <Route path="/guardian" element={<GuardianPage profile={profile} settings={settings} onUpdateProfile={updateProfile} />} />
      </Routes>
    );
  }

  // Normal auth-gated flow
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!profile.setupCompleted) {
    if (inWelcomeFlow) {
      return <WelcomeScreen onStartSetup={handleStartSetup} onOpenAuthModal={onOpenAuthModal} />;
    }
    return <SetupWizard initialProfile={profile} onComplete={handleWizardComplete} />;
  }

  // Authenticated app routes
  return (
    <Routes>
      <Route
        path="/"
        element={<MainLayout profile={profile} settings={settings} onOpenAuthModal={onOpenAuthModal} />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage profile={profile} settings={settings} onToggleChapterComplete={toggleChapterComplete} onToggleRevisionComplete={toggleRevisionComplete} />} />
        <Route path="todays-target" element={<TodaysTargetPage profile={profile} onToggleChapterComplete={toggleChapterComplete} />} />
        <Route path="complete-syllabus" element={<CompleteSyllabusPage profile={profile} />} />
        <Route path="download-app" element={<AppDownloadPage />} />
        <Route path="subjects" element={
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
        } />
        <Route path="progress" element={<ProgressPage profile={profile} onToggleRevisionComplete={toggleRevisionComplete} onTriggerMissedRecovery={triggerMissedRecovery} />} />
        <Route path="profile" element={<ProfilePage profile={profile} />} />
        <Route path="settings" element={<SettingsPage settings={settings} onUpdateSettings={updateSettings} onResetSetup={resetSetup} onReplaySplash={handleReplaySplash} />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="future-plans" element={<FuturePlansPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="guardian" element={<GuardianPage profile={profile} settings={settings} onUpdateProfile={updateProfile} />} />
      </Route>

      <Route path="/focus" element={<FocusPage profile={profile} onUpdateProfile={updateProfile} onToggleChapterComplete={toggleChapterComplete} />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;