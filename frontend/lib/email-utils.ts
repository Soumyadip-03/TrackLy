"use client"

import { getFromLocalStorage } from "./storage-utils"
import { playNotificationSound, getNotificationSoundPreference } from "./sound-utils"

const API_URL = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' 
      ? 'http://localhost:5000/api' 
      : 'https://trackly-backend.onrender.com/api')
  : 'http://localhost:5000/api';

interface EmailNotificationPreferences {
  attendanceReminders: boolean;
  breakReminders: boolean;
  holidayAlerts: boolean;
  lowAttendanceAlerts: boolean;
  upcomingDeadlines: boolean;
  dailySummary: boolean;
}

const notificationTimestamps: Record<string, number> = {};
const NOTIFICATION_COOLDOWN = 5 * 60 * 1000;

function isOnNotificationCooldown(key: string): boolean {
  const lastTimestamp = notificationTimestamps[key];
  if (!lastTimestamp) return false;
  
  const now = Date.now();
  return (now - lastTimestamp) < NOTIFICATION_COOLDOWN;
}

function setNotificationTimestamp(key: string): void {
  notificationTimestamps[key] = Date.now();
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'attendance' | 'break' | 'holiday' | 'alert' | 'summary';
  isRead: boolean;
  createdAt: string;
}

export async function sendEmail(
  subject: string, 
  message: string, 
  to?: string,
  type: 'attendance' | 'break' | 'holiday' | 'alert' | 'summary' = 'alert'
): Promise<boolean> {
  try {
    const userEmail = to || getFromLocalStorage<string>('user_email', '');
    if (!userEmail) {
      console.error('No email address available for sending notification');
      return false;
    }

    const now = Date.now();
    const lastNotification = notificationTimestamps[type] || 0;
    if (now - lastNotification < NOTIFICATION_COOLDOWN) {
      console.log(`Skipping notification sound for ${type}, cooldown active`);
      return false;
    }
    
    try {
      const existingNotifications = getFromLocalStorage<Notification[]>('notifications', []);
      
      const newNotification: Notification = {
        id: `notification_${Date.now()}`,
        title: subject,
        message: message,
        type: type,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      existingNotifications.unshift(newNotification);
      localStorage.setItem('notifications', JSON.stringify(existingNotifications));
      
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { newNotification }
      }));
      
      console.log('Notification saved to localStorage:', newNotification.title);
    } catch (storageError) {
      console.error('Error saving notification to localStorage:', storageError);
    }
    
    notificationTimestamps[type] = now;

    if (getNotificationSoundPreference()) {
      switch (type) {
        case 'alert':
          await playNotificationSound('alert');
          break;
        case 'break':
        case 'holiday':
          await playNotificationSound('warning');
          break;
        default:
          await playNotificationSound('success');
      }
      notificationTimestamps[type] = now;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendAttendanceReminder(date: Date, subjects: any[]): Promise<void> {
  const userEmail = getFromLocalStorage<string>('user_email', '');
  if (!userEmail) return;

  const preferences = getFromLocalStorage<EmailNotificationPreferences>('email_preferences', {
    attendanceReminders: true,
    breakReminders: true,
    holidayAlerts: true,
    lowAttendanceAlerts: true,
    upcomingDeadlines: true,
    dailySummary: true
  });

  if (!preferences.attendanceReminders) return;

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subjectList = subjects
    .map(subject => `- ${subject.name || subject.subject} (${subject.time || 'Time not specified'})`)
    .join('\n');

  const message = `
Hello,

This is a reminder about your classes for ${formattedDate}.

Scheduled Classes:
${subjectList}

Please remember to mark your attendance for these classes.

Best regards,
TrackLy Attendance System
  `.trim();

  await sendEmail(
    `Classes Reminder for ${formattedDate}`,
    message,
    userEmail,
    'attendance'
  );
}

export async function sendLowAttendanceAlert(userId: string, courseName: string, currentPercentage: number, courseId?: string): Promise<boolean> {
  try {
    const userEmail = getFromLocalStorage<string>('user_email', '');
    const userName = getFromLocalStorage<string>('user_name', '');
    
    if (!userEmail || !userName) {
      console.error('Missing user data for sending low attendance alert');
      return false;
    }
    
    const alertKey = `low_attendance_${courseName}`;
    if (isOnNotificationCooldown(alertKey)) {
      console.log(`Low attendance alert for ${courseName} is on cooldown`);
      return false;
    }
    
    const subject = `Low Attendance Alert: ${courseName}`;
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #e53e3e;">Low Attendance Alert</h1>
        <p>Hello ${userName},</p>
        <p>Your attendance for <strong>${courseName}</strong> has dropped to <strong>${currentPercentage}%</strong>.</p>
        <p>This is below the required threshold of 75%.</p>
        <p>Please make sure to attend upcoming classes to improve your attendance.</p>
        <p>Best regards,<br>TrackLy Team</p>
      </div>
    `;
    
    const result = await sendEmail(subject, message, userEmail, 'alert');
    
    if (result) {
      setNotificationTimestamp(alertKey);
      console.log(`Low attendance alert sent for ${courseName}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending low attendance alert:', error);
    return false;
  }
}

export async function sendDailySummary(
  date: Date,
  attendanceRecords: any[],
  upcomingHolidays: any[]
): Promise<void> {
  const userEmail = getFromLocalStorage<string>('user_email', '');
  if (!userEmail) return;

  const preferences = getFromLocalStorage<EmailNotificationPreferences>('email_preferences', {
    attendanceReminders: true,
    breakReminders: true,
    holidayAlerts: true,
    lowAttendanceAlerts: true,
    upcomingDeadlines: true,
    dailySummary: true
  });

  if (!preferences.dailySummary) return;

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const attendanceSummary = attendanceRecords
    .map(record => `- ${record.subject}: ${record.status.toUpperCase()}`)
    .join('\n');

  const holidaySummary = upcomingHolidays.length > 0
    ? `\nUpcoming Holidays:\n${upcomingHolidays
        .map(h => `- ${h.date}: ${h.reason}`)
        .join('\n')}`
    : '\nNo upcoming holidays in the next week.';

  const message = `
Hello,

Here's your daily attendance summary for ${formattedDate}:

Attendance Records:
${attendanceSummary || 'No attendance records for today.'}

${holidaySummary}

Best regards,
TrackLy Attendance System
  `.trim();

  await sendEmail(
    `Daily Attendance Summary - ${formattedDate}`,
    message,
    userEmail,
    'summary'
  );
}

export function saveEmailPreferences(preferences: Partial<EmailNotificationPreferences>): void {
  const currentPreferences = getFromLocalStorage<EmailNotificationPreferences>('email_preferences', {
    attendanceReminders: true,
    breakReminders: true,
    holidayAlerts: true,
    lowAttendanceAlerts: true,
    upcomingDeadlines: true,
    dailySummary: true
  });

  const updatedPreferences = {
    ...currentPreferences,
    ...preferences
  };

  localStorage.setItem('email_preferences', JSON.stringify(updatedPreferences));
}
