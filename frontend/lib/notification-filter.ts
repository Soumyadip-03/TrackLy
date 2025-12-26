import { getFromLocalStorage } from './storage-utils'

export interface NotificationSettings {
  notificationPriority?: string
  mutedTypes?: string[]
  attendanceReminders?: boolean
  todoReminders?: boolean
  calendarReminders?: boolean
  pointsNotifications?: boolean
  achievementNotifications?: boolean
  browserNotifications?: boolean
}

export interface Notification {
  _id: string
  type: string
  category: string
  priority: string
  read: boolean
  [key: string]: any
}

const categoryToTypeMap: Record<string, string> = {
  'attendance': 'attendance',
  'todo': 'todos',
  'calendar': 'calendar',
  'points': 'points',
  'achievement': 'points'
}

export function filterNotifications(notifications: Notification[]): Notification[] {
  const settings = getFromLocalStorage<NotificationSettings>('notification_settings', {})
  const mutedTypes = getFromLocalStorage<string[]>('muted_notification_types', [])
  
  return notifications.filter(notification => {
    // Priority filter
    const priority = settings.notificationPriority || 'all'
    if (priority === 'high' && notification.priority !== 'high') return false
    if (priority === 'medium' && notification.priority === 'low') return false
    
    // Muted types filter
    const mappedType = categoryToTypeMap[notification.category] || notification.category
    if (mutedTypes.includes(mappedType)) return false
    
    // Category-specific filters
    if (notification.category === 'attendance' && settings.attendanceReminders === false) return false
    if (notification.category === 'todo' && settings.todoReminders === false) return false
    if (notification.category === 'calendar' && settings.calendarReminders === false) return false
    if (notification.category === 'points' && settings.pointsNotifications === false) return false
    if (notification.category === 'achievement' && settings.achievementNotifications === false) return false
    
    return true
  })
}

export function showBrowserNotification(title: string, message: string) {
  const settings = getFromLocalStorage<NotificationSettings>('notification_settings', {})
  
  if (settings.browserNotifications === false) return
  
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    })
  }
}

export function requestBrowserNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}
