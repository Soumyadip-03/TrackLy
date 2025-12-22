"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, CheckCircle2, Clock, Info, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { NotificationSound } from "./notification-sound"
import { playNotificationSound } from "@/lib/sound-utils"
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  AppNotification
} from "@/lib/notification-utils"

interface Notification {
  id: string
  type: "reminder" | "alert" | "info" | "success"
  title: string
  message: string
  date: Date
  read: boolean
  category?: string
  priority?: "high" | "medium" | "low"
  details?: any
}

// Utility for safe API fetching
const safeFetch = async (url: string, options: RequestInit) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle non-JSON responses
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return { success: false, error: errorData };
      } catch (jsonError) {
        return { success: false, error: { message: response.statusText || "Server error" } };
      }
    }
    
    try {
      const data = await response.json();
      return { success: true, data };
    } catch (jsonError) {
      console.error("Error parsing response as JSON:", jsonError);
      return { success: false, error: { message: "Invalid JSON response" } };
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return { success: false, error: { message: error instanceof Error ? error.message : "Unknown error" } };
  }
};

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [error, setError] = useState<string | null>(null)
  const previousNotificationCount = useRef(0)
  
  // Play notification sound manually
  const playSound = () => {
    playNotificationSound().catch(err => {
      console.error('Failed to play notification sound:', err)
      
      toast({
        title: "Sound Testing",
        description: "Attempted to play notification sound",
      })
    });
  }

  // Function to ensure dates are properly saved and retrieved
  const ensureValidDate = (dateInput: any): Date => {
    if (!dateInput) return new Date();
    
    try {
      // If it's already a Date object
      if (dateInput instanceof Date) {
        // Check if it's a valid date
        if (isNaN(dateInput.getTime())) {
          console.error("Invalid Date object:", dateInput);
          return new Date(); // Return current date if invalid
        }
        return dateInput;
      }
      
      // If it's a string, try to parse it
      if (typeof dateInput === 'string') {
        const parsedDate = new Date(dateInput);
        if (isNaN(parsedDate.getTime())) {
          console.error("Could not parse date from string:", dateInput);
          return new Date();
        }
        return parsedDate;
      }
      
      // If it's a number (timestamp), convert to Date
      if (typeof dateInput === 'number') {
        return new Date(dateInput);
      }
      
      // If we got here, we don't know how to handle the input
      console.error("Unknown date format:", dateInput);
      return new Date();
    } catch (err) {
      console.error("Error processing date:", err);
      return new Date();
    }
  }

  // Load saved notifications and generate new ones based on app data
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Get saved notifications
        const savedNotifications = await getNotifications();
        
        // Convert string dates back to Date objects if needed
        const processedNotifications = savedNotifications.map(notification => ({
          ...notification,
          date: ensureValidDate(notification.date)
        }));
        
        // Generate new notifications based on app data
        const newNotifications = generateNotifications();
        
        // Combine existing and new notifications, avoiding duplicates based on id
        const combinedNotifications = [...processedNotifications];
        
        let hasNewNotifications = false;
        newNotifications.forEach(newNotif => {
          // Check if this notification already exists by id
          const exists = combinedNotifications.some(existingNotif => 
            existingNotif.id === newNotif.id
          );
          
          if (!exists) {
            combinedNotifications.push(newNotif);
            hasNewNotifications = true;
          }
        });
        
        // Sort by date, newest first
        combinedNotifications.sort((a, b) => ensureValidDate(b.date).getTime() - ensureValidDate(a.date).getTime());
        
        // Count unread notifications
        const unreadCount = combinedNotifications.filter(n => !n.read).length;
        
        // Only play sound if there are actual new notifications with content
        if (hasNewNotifications && newNotifications.length > 0) {
          // Play notification sound
          playNotificationSound();
        }
        
        // Update ref for next comparison
        previousNotificationCount.current = unreadCount;
        
        setNotifications(combinedNotifications);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error("Error loading notifications:", err);
        setError("Failed to load notifications. Using cached data.");
        // Try to use the last known good state
        try {
          const cachedNotifications = await getNotifications();
          if (cachedNotifications.length > 0) {
            const processed = cachedNotifications.map(notification => ({
              ...notification,
              date: ensureValidDate(notification.date)
            }));
            setNotifications(processed);
          }
        } catch (cacheErr) {
          console.error("Error loading cached notifications:", cacheErr);
        }
      }
    };
    
    // Initial load
    loadNotifications();
    
    // Set up listeners for notification events
    const handleNotificationsUpdated = () => {
      loadNotifications();
    };
    
    // Add event listener
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    
    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, []); // Empty dependency array since we want this to run only once on mount
  
  // Save notifications whenever they change
  useEffect(() => {
    // This effect shouldn't do anything as we're now using the notification utils
    // The notifications are saved automatically by the notification utils
  }, [notifications]);
  
  // Generate notifications based on app data
  const generateNotifications = () => {
    try {
      const generatedNotifications: Notification[] = [];
      const now = new Date();
      
      // Get notification settings
      const notificationSettings = getFromLocalStorage<{
        attendanceReminders: boolean;
        attendanceThreshold: string;
        attendanceReminderFrequency: string;
        todoReminders: boolean;
        todoReminderTime: string;
        priorityTodosOnly: boolean;
        calendarReminders: boolean;
        calendarReminderTime: string;
        notificationSound: boolean;
        browserNotifications: boolean;
        emailNotifications: boolean;
        emailAddress: string;
        emailDigest: string;
        pointsNotifications: boolean;
        achievementNotifications: boolean;
        mutedTypes: string[];
        notificationPriority: string;
      }>('notification_settings', {
        attendanceReminders: true,
        attendanceThreshold: "85",
        attendanceReminderFrequency: "weekly",
        
        todoReminders: true,
        todoReminderTime: "1",
        priorityTodosOnly: false,
        
        calendarReminders: true,
        calendarReminderTime: "1",
        
        notificationSound: true,
        browserNotifications: true,
        emailNotifications: false,
        emailAddress: "",
        emailDigest: "daily",
        
        pointsNotifications: true,
        achievementNotifications: true,
        
        mutedTypes: [],
        
        notificationPriority: "all"
      });
      
      // Skip generation for muted notification types
      const isMuted = (type: string): boolean => {
        try {
          return notificationSettings.mutedTypes?.includes(type as any) || false;
        } catch (err) {
          console.error("Error checking muted types:", err);
          return false;
        }
      };
      
      // Filter by priority
      const shouldShowPriority = (priority: "high" | "medium" | "low") => {
        try {
          switch(notificationSettings.notificationPriority) {
            case "high":
              return priority === "high";
            case "medium":
              return priority === "high" || priority === "medium";
            default:
              return true;
          }
        } catch (err) {
          console.error("Error checking priority:", err);
          return true; // Show all by default if there's an error
        }
      };
      
      // Check todo items if todo reminders are enabled and not muted
      if (notificationSettings.todoReminders && !isMuted('todos')) {
        try {
          const todos = getFromLocalStorage<any[]>('todos', []);
          const reminderDays = parseInt(notificationSettings.todoReminderTime, 10) || 1;
          
          todos.forEach(todo => {
            try {
              // Skip if priorityTodosOnly is true and this is not high priority
              if (notificationSettings.priorityTodosOnly && todo.priority !== "high") {
                return;
              }
              
              if (todo.dueDate) {
                const dueDate = ensureValidDate(todo.dueDate);
                const diffTime = dueDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // Create notification for upcoming todos based on settings
                if (diffDays <= reminderDays && diffDays >= 0 && !todo.completed) {
                  // Determine priority
                  const notificationPriority = diffDays === 0 ? "high" : (diffDays === 1 ? "medium" : "low");
                  
                  // Skip if doesn't match priority filter
                  if (!shouldShowPriority(notificationPriority)) {
                    return;
                  }
                  
                  generatedNotifications.push({
                    id: `todo-${todo.id || Date.now()}`,
                    type: diffDays === 0 ? "alert" : "reminder",
                    title: diffDays === 0 ? "Task Due Today" : "Upcoming Task",
                    message: `"${todo.title}" is due ${diffDays === 0 ? "today" : "in " + diffDays + " days"}.`,
                    date: now,
                    read: false
                  });
                }
              }
            } catch (todoErr) {
              console.error("Error processing todo item:", todoErr);
            }
          });
        } catch (todosErr) {
          console.error("Error loading todos:", todosErr);
        }
      }
      
      // Check calendar tasks if calendar reminders are enabled and not muted
      if (notificationSettings.calendarReminders && !isMuted('calendar')) {
        try {
          const calendarTasks = getFromLocalStorage<any[]>('calendar_todos', []);
          const reminderDays = parseInt(notificationSettings.calendarReminderTime, 10) || 1;
          
          calendarTasks.forEach(task => {
            try {
              if (task.date) {
                const taskDate = ensureValidDate(task.date);
                const diffTime = taskDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // Create notification for upcoming calendar events
                if (diffDays <= reminderDays && diffDays >= 0) {
                  // Determine priority based on how soon the event is
                  const notificationPriority = diffDays === 0 ? "high" : (diffDays === 1 ? "medium" : "low");
                  
                  // Skip if doesn't match priority filter
                  if (!shouldShowPriority(notificationPriority)) {
                    return;
                  }
                  
                  generatedNotifications.push({
                    id: `calendar-${task.id || Date.now()}`,
                    type: "reminder",
                    title: "Calendar Event Reminder",
                    message: `"${task.title}" for ${task.subject || 'your class'} is scheduled ${diffDays === 0 ? "today" : "in " + diffDays + " days"}.`,
                    date: now,
                    read: false
                  });
                }
              }
            } catch (taskErr) {
              console.error("Error processing calendar task:", taskErr);
            }
          });
        } catch (calendarErr) {
          console.error("Error loading calendar tasks:", calendarErr);
        }
      }
      
      // Check attendance issues if attendance reminders are enabled and not muted
      if (notificationSettings.attendanceReminders && !isMuted('attendance')) {
        try {
          const subjects = getFromLocalStorage<any[]>('subjects', []);
          const attendance = getFromLocalStorage<any[]>('attendance_records', []);
          const threshold = parseInt(notificationSettings.attendanceThreshold, 10) || 85;
          
          // Determine if we should show attendance notifications based on frequency
          const shouldShowAttendanceNotification = () => {
            try {
              const lastAttendanceNotification = getFromLocalStorage<string>('last_attendance_notification', '');
              if (!lastAttendanceNotification) return true;
              
              const lastDate = ensureValidDate(lastAttendanceNotification);
              const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
              
              switch(notificationSettings.attendanceReminderFrequency) {
                case 'daily':
                  return daysDiff >= 1;
                case 'weekly':
                  return daysDiff >= 7;
                case 'monthly':
                  return daysDiff >= 30;
                case 'never':
                  return false;
                default:
                  return true;
              }
            } catch (freqErr) {
              console.error("Error checking attendance notification frequency:", freqErr);
              return false; // Skip on error
            }
          };
          
          // Create attendance alerts if data exists and frequency check passes
          if (subjects.length > 0 && attendance.length > 0 && shouldShowAttendanceNotification()) {
            try {
              // Save the current time as the last notification time
              getFromLocalStorage('last_attendance_notification', now.toISOString());
              
              subjects.forEach(subject => {
                try {
                  // Example of checking attendance percentage
                  // In a real app, you would calculate this from actual attendance data
                  const hasLowAttendance = Math.random() < 0.3; // 30% chance for demo
                  if (hasLowAttendance) {
                    generatedNotifications.push({
                      id: `attendance-${subject.id || 'subject'}-${Date.now()}`,
                      type: "alert",
                      title: "Low Attendance Alert",
                      message: `Your attendance in ${subject.name || 'a subject'} is below ${threshold}%. Consider attending more classes.`,
                      date: now,
                      read: false
                    });
                  }
                } catch (subjectErr) {
                  console.error("Error processing subject:", subjectErr);
                }
              });
            } catch (saveErr) {
              console.error("Error saving last attendance notification:", saveErr);
            }
          }
        } catch (attendanceErr) {
          console.error("Error loading attendance data:", attendanceErr);
        }
      }
      
      // Points notifications if enabled and not muted
      if (notificationSettings.pointsNotifications && !isMuted('points')) {
        try {
          // Check if we should show welcome notification (first-time user)
          // We'll use a flag in localStorage to track if user has seen the welcome message
          const hasSeenWelcome = getFromLocalStorage<boolean>('has_seen_welcome', false);
          
          if (!hasSeenWelcome) {
            // First time user - show welcome notification
            generatedNotifications.push({
              id: `welcome-${Date.now()}`,
              type: "info",
              title: "Welcome to TrackLy",
              message: "Start tracking your attendance and managing your academic tasks.",
              date: now,
              read: false
            });
            
            // Mark that user has seen welcome message
            saveToLocalStorage('has_seen_welcome', true);
          }
          
          // Achievement notifications if enabled
          if (notificationSettings.achievementNotifications) {
            try {
              const achievementData = getFromLocalStorage<any[]>('achievements', []);
              const unreadAchievements = achievementData.filter(a => !a.notified);
              
              unreadAchievements.forEach(achievement => {
                try {
                  generatedNotifications.push({
                    id: `achievement-${achievement.id || Date.now()}`,
                    type: "info",
                    title: "Achievement Unlocked",
                    message: achievement.description || "You've unlocked a new achievement!",
                    date: now,
                    read: false
                  });
                } catch (achErr) {
                  console.error("Error processing achievement:", achErr);
                }
              });
            } catch (achievementsErr) {
              console.error("Error loading achievements:", achievementsErr);
            }
          }
        } catch (pointsErr) {
          console.error("Error processing points notifications:", pointsErr);
        }
      }
      
      return generatedNotifications;
    } catch (err) {
      console.error("Error generating notifications:", err);
      return []; // Return empty array on error
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      
      // Update local state immediately for UI responsiveness
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification))
      );

      toast({
        title: "Notification Read",
        description: "Notification marked as read.",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      
      // Update local state immediately for UI responsiveness
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));

      toast({
        title: "All Notifications Read",
        description: "All notifications marked as read.",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      });
    }
  }

  const handleClear = async (id: string) => {
    try {
      await deleteNotification(id);
      
      // Update local state immediately for UI responsiveness
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));

      toast({
        title: "Notification Cleared",
        description: "Notification has been removed.",
      });
    } catch (error) {
      console.error("Error clearing notification:", error);
      toast({
        title: "Error",
        description: "Failed to clear notification.",
        variant: "destructive",
      });
    }
  }

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      
      // Update local state immediately for UI responsiveness
      setNotifications([]);

      toast({
        title: "All Notifications Cleared",
        description: "All notifications have been removed.",
      });
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      toast({
        title: "Error",
        description: "Failed to clear all notifications.",
        variant: "destructive",
      });
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
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  /**
   * Format date in a readable, relative format
   */
  const formatDate = (date: Date) => {
    try {
      // Ensure we have a valid date
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "Unknown date";
      }
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      // Just now
      if (diff < 60000) {
        return "Just now";
      }
      
      // Minutes ago
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      }
      
      // Hours ago - if today
      if (date.toDateString() === now.toDateString()) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      }
      
      // Yesterday
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // This week (< 7 days)
      if (diff < 604800000) {
        return `${date.toLocaleDateString([], { weekday: 'long' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Older
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date error";
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <>
      <NotificationSound />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Notifications
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors" 
                onClick={playSound}
                title="Test notification sound"
              >
                <Bell className="h-4 w-4 text-primary" />
                <span className="sr-only">Test notification sound</span>
              </Button>
            </CardTitle>
            <CardDescription>
              {error ? (
                <span className="text-amber-500">{error}</span>
              ) : unreadCount > 0 ? (
                `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              ) : (
                "No new notifications"
              )}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
              Mark All Read
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll} disabled={notifications.length === 0}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-md border",
                    !notification.read && "bg-primary/5 border-primary/20",
                  )}
                >
                  <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{notification.title}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(notification.date)}</span>
                    </div>
                    <p className="text-sm mt-1">{notification.message}</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        <span className="text-xs">Read</span>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleClear(notification.id)}>
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
    </>
  )
}

// TypeScript declaration for the global sound generation function
declare global {
  interface Window {
    playGeneratedSound?: () => boolean;
  }
}
