"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle2, Clock, Info, XCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { notificationService, Notification } from "@/lib/services/notification-service"
import { playNotificationSound } from "@/lib/sound-utils"
import { filterNotifications, showBrowserNotification, requestBrowserNotificationPermission } from "@/lib/notification-filter"

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      const data = await notificationService.getAll()
      const filtered = filterNotifications(data)
      setNotifications(filtered)
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate new notifications
  const generateNotifications = async () => {
    setIsGenerating(true)
    try {
      const newNotifs = await notificationService.generate()
      if (newNotifs.length > 0) {
        playNotificationSound()
        
        // Show browser notification for first new notification
        if (newNotifs[0]) {
          showBrowserNotification(newNotifs[0].title, newNotifs[0].message)
        }
        
        toast({
          title: "Notifications Generated",
          description: `${newNotifs.length} new notification${newNotifs.length > 1 ? 's' : ''} created`
        })
      } else {
        toast({
          title: "No New Notifications",
          description: "All caught up!"
        })
      }
      await loadNotifications()
    } catch (error) {
      console.error("Error generating notifications:", error)
      toast({
        title: "Error",
        description: "Failed to generate notifications",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    requestBrowserNotificationPermission()
    loadNotifications()
    
    // Auto-generate on mount
    generateNotifications()
    
    // Listen for updates
    const handleUpdate = () => {
      loadNotifications()
    }
    
    window.addEventListener('notificationsUpdated', handleUpdate)
    window.addEventListener('settingsUpdated', handleUpdate)
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleUpdate)
      window.removeEventListener('settingsUpdated', handleUpdate)
    }
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      )
      toast({
        title: "Notification Read",
        description: "Marked as read"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as read",
        variant: "destructive"
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast({
        title: "All Read",
        description: "All notifications marked as read"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive"
      })
    }
  }

  const handleClear = async (id: string) => {
    try {
      await notificationService.delete(id)
      setNotifications(prev => prev.filter(n => n._id !== id))
      toast({
        title: "Notification Cleared",
        description: "Notification removed"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear notification",
        variant: "destructive"
      })
    }
  }

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll()
      setNotifications([])
      toast({
        title: "All Cleared",
        description: "All notifications removed"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear all",
        variant: "destructive"
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "alert":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "info":
        return <Info className="h-5 w-5 text-green-500" />
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      
      if (diff < 60000) return "Just now"
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000)
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
      }
      if (date.toDateString() === now.toDateString()) {
        const hours = Math.floor(diff / 3600000)
        return `${hours} hour${hours > 1 ? 's' : ''} ago`
      }
      
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
      
      if (diff < 604800000) {
        return `${date.toLocaleDateString([], { weekday: 'long' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
      
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } catch (error) {
      return "Unknown date"
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardDescription>
          {unreadCount > 0 
            ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
            : "No new notifications"
          }
        </CardDescription>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll} disabled={notifications.length === 0}>
            Clear All
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full hover:bg-primary/10" 
            onClick={generateNotifications}
            disabled={isGenerating}
            title="Refresh notifications"
          >
            <RefreshCw className={cn("h-4 w-4 text-primary", isGenerating && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-md border",
                  !notification.read && "bg-primary/5 border-primary/20"
                )}
              >
                <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1">{notification.message}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      <span className="text-xs">Read</span>
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2" 
                    onClick={() => handleClear(notification._id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">Clear</span>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No notifications to display</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
