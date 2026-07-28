export const APP_INFO = {
  name: 'STUDEX',
  version: '1.0.0',
  tagline: 'Plan smarter. Study better. Achieve more.',
  developers: [
    'MD. AHNAF SHAHRIAR SAAD',
    'MONAJIL AHMED RAFU',
  ],
  copyright: 'Copyright © 2026 Studex. All Rights Reserved.',
};

export const CLASS_LEVELS = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
] as const;

export const DAILY_TIME_OPTIONS = [
  '1 Hour', '2 Hours', '3 Hours', 'Custom'
] as const;

export const PREFERRED_TIME_OPTIONS = [
  { id: 'Morning', label: 'Morning', timeRange: '6:00 AM - 12:00 PM', icon: 'Sun' },
  { id: 'Afternoon', label: 'Afternoon', timeRange: '12:00 PM - 5:00 PM', icon: 'SunMedium' },
  { id: 'Evening', label: 'Evening', timeRange: '5:00 PM - 9:00 PM', icon: 'Sunset' },
  { id: 'Night', label: 'Night', timeRange: '9:00 PM - 1:00 AM', icon: 'Moon' },
] as const;

export const AVATAR_PRESETS = [
  '⚡', '🚀', '🎓', '📚', '💡', '🌟', '🛡️', '👑'
];
