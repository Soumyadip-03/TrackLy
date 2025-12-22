import { BaseService } from './base-service';
import { saveToLocalStorage, getFromLocalStorage } from '../storage-utils';
import { fetchWithAuth } from '../api';

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'todo' | 'attendance' | 'system' | 'achievement' | string;
  isRead: boolean;
  relatedId?: string;
  createdAt?: string;
}

/**
 * Service for managing notifications via backend API
 */
export class NotificationService extends BaseService {
  constructor() {
    super('notifications');
  }

  async getNotifications(limit?: number, unreadOnly = false): Promise<Notification[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return this.getNotificationsFromLocalStorage();

      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (unreadOnly) params.append('unreadOnly', 'true');

      const response = await fetchWithAuth(`/notification?${params.toString()}`);

      if (!response.ok) {
        this.handleError(null, 'fetching notifications', false);
        return this.getNotificationsFromLocalStorage();
      }

      const data = await response.json();
      const notifications: Notification[] = data.data || [];

      saveToLocalStorage('notifications', notifications);
      return notifications;
    } catch (error) {
      this.handleError(error, 'fetching notifications', false);
      return this.getNotificationsFromLocalStorage();
    }
  }

  async createNotification(notification: Notification): Promise<Notification | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const localNotifications = this.getNotificationsFromLocalStorage();
      const tempId = `temp_${Date.now()}`;
      const newLocalNotification = { ...notification, id: tempId };
      saveToLocalStorage('notifications', [newLocalNotification, ...localNotifications]);

      const response = await fetchWithAuth('/notification', {
        method: 'POST',
        body: JSON.stringify({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isRead: notification.isRead,
          relatedId: notification.relatedId
        })
      });

      if (!response.ok) {
        this.handleError(null, 'creating notification');
        return null;
      }

      const data = await response.json();
      const createdNotification = data.data;
      
      const updatedNotifications = localNotifications
        .filter(n => n.id !== tempId)
        .concat(createdNotification);
      
      saveToLocalStorage('notifications', updatedNotifications);
      return createdNotification;
    } catch (error) {
      this.handleError(error, 'creating notification');
      return null;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localNotifications = this.getNotificationsFromLocalStorage();
      const updatedLocalNotifications = localNotifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      saveToLocalStorage('notifications', updatedLocalNotifications);

      const response = await fetchWithAuth(`/notification/${notificationId}/read`, {
        method: 'PUT'
      });

      if (!response.ok) {
        this.handleError(null, 'marking notification as read', false);
        return false;
      }

      return true;
    } catch (error) {
      this.handleError(error, 'marking notification as read', false);
      return false;
    }
  }

  async markAllAsRead(): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localNotifications = this.getNotificationsFromLocalStorage();
      const updatedLocalNotifications = localNotifications.map(n => ({ ...n, isRead: true }));
      saveToLocalStorage('notifications', updatedLocalNotifications);

      const response = await fetchWithAuth('/notification/read-all', {
        method: 'PUT'
      });

      if (!response.ok) {
        this.handleError(null, 'marking all notifications as read');
        return false;
      }

      this.logSuccess('All notifications marked as read');
      return true;
    } catch (error) {
      this.handleError(error, 'marking all notifications as read');
      return false;
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const localNotifications = this.getNotificationsFromLocalStorage();
      const updatedLocalNotifications = localNotifications.filter(n => n.id !== notificationId);
      saveToLocalStorage('notifications', updatedLocalNotifications);

      const response = await fetchWithAuth(`/notification/${notificationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        this.handleError(null, 'deleting notification');
        return false;
      }

      return true;
    } catch (error) {
      this.handleError(error, 'deleting notification');
      return false;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        const localNotifications = this.getNotificationsFromLocalStorage();
        return localNotifications.filter(n => !n.isRead).length;
      }

      const response = await fetchWithAuth('/notification/unread-count');

      if (!response.ok) {
        this.handleError(null, 'getting unread notification count', false);
        const localNotifications = this.getNotificationsFromLocalStorage();
        return localNotifications.filter(n => !n.isRead).length;
      }

      const data = await response.json();
      return data.data?.count || 0;
    } catch (error) {
      this.handleError(error, 'getting unread notification count', false);
      const localNotifications = this.getNotificationsFromLocalStorage();
      return localNotifications.filter(n => !n.isRead).length;
    }
  }

  private getNotificationsFromLocalStorage(): Notification[] {
    return getFromLocalStorage<Notification[]>('notifications', []);
  }
}
