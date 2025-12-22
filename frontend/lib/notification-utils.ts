/**
 * Notification utilities for the application
 */

"use client"

import { getFromLocalStorage, saveToLocalStorage } from './storage-utils';
import { toast } from '@/components/ui/use-toast';

export interface AppNotification {
  id: string;
  type: "reminder" | "alert" | "info" | "success";
  title: string;
  message: string;
  date: Date | string;
  read: boolean;
  category?: string; // For filtering: 'login', 'attendance', 'todo', etc.
  priority?: "high" | "medium" | "low";
  details?: any; // Optional additional data
}

// Max number of notifications to keep in history
export const MAX_NOTIFICATIONS = 100;

/**
 * Add a new notification to the user's history
 */
export async function addNotification(notification: Omit<AppNotification, 'id' | 'date' | 'read'>): Promise<string> {
  try {
    // Generate a unique ID for the notification
    const id = `${notification.category || notification.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Prepare the complete notification object
    const newNotification: AppNotification = {
      ...notification,
      id,
      date: new Date(),
      read: false
    };
    
    // Get existing notifications
    const existingNotifications = getFromLocalStorage<AppNotification[]>('notifications', []);
    
    // Add new notification at the beginning
    const updatedNotifications = [newNotification, ...existingNotifications];
    
    // Keep only the most recent notifications
    const trimmedNotifications = updatedNotifications.slice(0, MAX_NOTIFICATIONS);
    
    // Save to localStorage
    saveToLocalStorage('notifications', trimmedNotifications);
    
    // Dispatch an event so any UI can update
    window.dispatchEvent(new CustomEvent('notificationsUpdated', { 
      detail: { notification: newNotification } 
    }));
    
    return id;
  } catch (error) {
    console.error('Error adding notification:', error);
    return '';
  }
}

/**
 * Get all user notifications
 */
export async function getNotifications(): Promise<AppNotification[]> {
  return getFromLocalStorage<AppNotification[]>('notifications', []);
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const notifications = getFromLocalStorage<AppNotification[]>('notifications', []);
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    // Save to localStorage
    saveToLocalStorage('notifications', updatedNotifications);
    
    // Dispatch an event so UI can update
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const notifications = getFromLocalStorage<AppNotification[]>('notifications', []);
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    
    // Save to localStorage
    saveToLocalStorage('notifications', updatedNotifications);
    
    // Dispatch an event so UI can update
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<void> {
  try {
    const notifications = getFromLocalStorage<AppNotification[]>('notifications', []);
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    
    // Save to localStorage
    saveToLocalStorage('notifications', updatedNotifications);
    
    // Dispatch an event so UI can update
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    // Clear localStorage
    saveToLocalStorage('notifications', []);
    
    // Dispatch an event so UI can update
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}