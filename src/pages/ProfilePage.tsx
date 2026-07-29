import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { calculateLevelFromXP } from '../services/gamificationService';
import { getCurrentUserAccount, logoutAccount } from '../services/authService';
import {
  User, Award, Flame, BookOpen, Clock, Layers, Trophy, CheckCircle2, Shield, Settings as SettingsIcon, Mail, Lock, ShieldCheck, LogOut
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';

interface ProfilePageProps {
  profile: UserProfile;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile }) => {
  const navigate = useNavigate();

  const g = profile.gamification || {
    xp: 150,
    level: 1,
    levelTitle: 'Beginner',
    currentStreak: 1,
    longestStreak: 1,
    totalStudyMinutes: 45,
    achievements: [],
  };

  const { level, title, currentLevelXP, nextLevelXP } = calculateLevelFromXP(g.xp);
  const xpInCurrentLevel = g.xp - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const levelProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / (xpNeededForNext || 1)) * 100));

  const totalPages = profile.subjects.reduce((sum, s) => sum + (s.totalPages || 0), 0);
  const completedPages = profile.subjects.reduce((sum, s) => sum + (s.completedPages || 0), 0);
  const completedChapters = profile.subjects.reduce((sum, s) => sum + (s.completedChapters || 0), 0);

  const studyHours = Math.floor((g.totalStudyMinutes || 0) / 60);
  const studyMins = (g.totalStudyMinutes || 0) % 60;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none">
      {/* Profile Header Hero Card */}
      <GlassCard className="border-electric-500/30 p-6 md:p-8 bg-gradient-to-r from-electric-700/10 via-black to-black">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-electric-500/20 border border-electric-500/40 flex items-center justify-center text-4xl shadow-glow-md">
              {profile.avatar || '🎓'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">{profile.name}</h1>
                <Badge variant="electric">{profile.selectedClass}</Badge>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Level {level} &bull; <strong className="text-electric-400">{title}</strong>
              </p>
              <span className="text-[11px] text-neutral-500 block mt-0.5">
                Member since {new Date(profile.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>

          <Button variant="glass" size="sm" icon={<SettingsIcon className="w-4 h-4" />} onClick={() => navigate('/settings')}>
            Edit Preferences
          </Button>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Level {level} Experience</span>
            <span className="text-electric-400 font-bold">{g.xp} / {nextLevelXP} XP</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelProgressPercent}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-electric-600 to-electric-400 rounded-full shadow-glow-sm"
            />
          </div>
        </div>
      </GlassCard>

      {/* Comprehensive Academic Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
            <Flame className="w-5 h-5" />
          </div>
          <span className="block text-2xl font-extrabold text-white">{g.currentStreak || 1} Days</span>
          <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Active Streak</span>
        </GlassCard>

        <GlassCard className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-electric-500/20 border border-electric-500/30 flex items-center justify-center text-electric-400 mx-auto mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <span className="block text-2xl font-extrabold text-white">{studyHours}h {studyMins}m</span>
          <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Total Focus Time</span>
        </GlassCard>

        <GlassCard className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="block text-2xl font-extrabold text-white">{completedPages} / {totalPages}</span>
          <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Pages Completed</span>
        </GlassCard>

        <GlassCard className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-2">
            <Layers className="w-5 h-5" />
          </div>
          <span className="block text-2xl font-extrabold text-white">{completedChapters}</span>
          <span className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Completed Chapters</span>
        </GlassCard>
      </div>

      {/* EMAIL LOGIN & CLOUD ACCOUNT CARD */}
      {(() => {
        const currentAcc = getCurrentUserAccount();
        const { onOpenAuthModal } = (useOutletContext() || {}) as { onOpenAuthModal?: () => void };

        return (
          <GlassCard className="border-electric-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">Email Account & Cloud Sync</h3>
                    {currentAcc ? (
                      <Badge variant="electric">Verified Email</Badge>
                    ) : (
                      <Badge variant="neutral">Local Offline Profile</Badge>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {currentAcc
                      ? `Signed in as ${currentAcc.email} &bull; Cross-device sync active`
                      : 'Sign in with an email account to enable multi-device sync'}
                  </p>
                </div>
              </div>

              {currentAcc ? (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<LogOut className="w-4 h-4" />}
                  onClick={() => {
                    if (confirm('Sign out of your email account?')) {
                      logoutAccount();
                      window.location.reload();
                    }
                  }}
                >
                  Sign Out ({currentAcc.email.split('@')[0]})
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  icon={<Lock className="w-4 h-4" />}
                  onClick={() => onOpenAuthModal && onOpenAuthModal()}
                >
                  Email Login / Sign Up
                </Button>
              )}
            </div>
          </GlassCard>
        );
      })()}

      {/* ACHIEVEMENTS GALLERY */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Achievements & Trophies
          </h3>
          <Badge variant="glass">
            {(g.achievements || []).filter((a) => a.unlocked).length} / {(g.achievements || []).length} Unlocked
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(g.achievements || []).map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border transition flex items-center gap-3 ${
                ach.unlocked
                  ? 'bg-electric-500/10 border-electric-500/30'
                  : 'bg-white/5 border-white/10 opacity-50'
              }`}
            >
              <div className="text-3xl p-2 rounded-xl bg-white/5 border border-white/10">
                {ach.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  {ach.title}
                  {ach.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-electric-400" />}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">{ach.description}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
