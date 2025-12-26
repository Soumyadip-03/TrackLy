import { fetchWithAuth } from '../api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'reminder' | 'alert' | 'info' | 'success';
  category: 'todo' | 'attendance' | 'calendar' | 'points' | 'achievement' | 'system';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const response = await fetchWithAuth('/notification');
    if (!response.ok) throw new Error('Failed to fetch notifications');
    const data = await response.json();
    return data.data;
  },

  async generate(): Promise<Notification[]> {
    const response = await fetchWithAuth('/notification/generate', {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to generate notifications');
    const data = await response.json();
    return data.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await fetchWithAuth(`/notification/${id}/read`, {
      method: 'PATCH'
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    const data = await response.json();
    return data.data;
  },

  async markAllAsRead(): Promise<void> {
    const response = await fetchWithAuth('/notification/read-all', {
      method: 'PATCH'
    });
    if (!response.ok) throw new Error('Failed to mark all as read');
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`/notification/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete notification');
  },

  async clearAll(): Promise<void> {
    const response = await fetchWithAuth('/notification/clear-all', {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to clear all notifications');
  }
};
