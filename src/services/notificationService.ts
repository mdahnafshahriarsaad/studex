/**
 * Smart Notification Service for Studex PWA & Mobile Web
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Web Notifications not supported in this browser.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendNotification(title: string, body: string, icon = '/logo-mark.png'): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: '/favicon.png',
        tag: 'studex-notification',
      });
    } catch (err) {
      console.warn('Notification send failed:', err);
    }
  }
}

export function triggerStudyReminder(preferredTime: string): void {
  sendNotification(
    'Studex Study Reminder',
    `Your ${preferredTime} study session starts in 5 minutes. Keep your streak alive!`
  );
}

export function triggerExamReminder(examName: string, daysLeft: number, dailyTarget: number): void {
  sendNotification(
    'Exam Target Alert',
    `${examName} in ${daysLeft} days. Complete ${dailyTarget} pages today to stay on schedule.`
  );
}

export function triggerStreakReminder(currentStreak: number): void {
  sendNotification(
    'Streak Protection',
    `Your ${currentStreak}-day study streak is at risk. Complete today's target to maintain your progress!`
  );
}
