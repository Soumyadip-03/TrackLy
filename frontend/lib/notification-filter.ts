"use client"

import { Notification } from "./services/notification-service"
import { getFromLocalStorage } from "./storage-utils"

export function filterNotifications(notifications: Notification[]): Notification[] {
  // Don't filter by muted types - show all notifications
  return notifications.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function showBrowserNotification(title: string, message: string, category?: string): void {
  if (typeof window === 'undefined' || !window.Notification) return
  
  // Check if browser notifications are enabled in settings
  const settings = getFromLocalStorage<any>('notification_settings', {})
  if (settings.browserNotifications === false) return
  
  // Browser notifications show for all categories when enabled
  // (mute settings only affect sound, not browser notifications)
  
  if (window.Notification.permission === 'granted') {
    new window.Notification(title, {
      body: message,
      icon: '/logo/logo.png',
      badge: '/logo/logo.png',
      tag: 'trackly-notification',
      requireInteraction: false
    })
  } else if (window.Notification.permission === 'default') {
    // Auto-request permission if not yet decided
    window.Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new window.Notification(title, {
          body: message,
          icon: '/logo/logo.png',
          badge: '/logo/logo.png',
          tag: 'trackly-notification',
          requireInteraction: false
        })
      }
    })
  }
}

export async function requestBrowserNotificationPermission(): Promise<void> {
  if (typeof window === 'undefined' || !window.Notification) return
  
  if (window.Notification.permission === 'default') {
    await window.Notification.requestPermission()
  }
}
