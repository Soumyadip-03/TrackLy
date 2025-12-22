"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { Variants, motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"

// Define notification types
export type NotificationType = "success" | "error" | "info" | "warning"

// Define notification interface
export interface NotificationItem {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
}

// Options type for notifications
interface NotificationOptions {
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
}

interface NotificationContextType {
  notifications: NotificationItem[]
  showNotification: (notification: Omit<NotificationItem, "id">) => void
  closeNotification: (id: string) => void
  showSuccess: (title: string, message: string, options?: NotificationOptions) => void
  showError: (title: string, message: string, options?: NotificationOptions) => void
  showInfo: (title: string, message: string, options?: NotificationOptions) => void
  showWarning: (title: string, message: string, options?: NotificationOptions) => void
}

// Create the context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Animation variants for the popup
const popupVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: -20,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.3, 
      ease: "easeOut" 
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { 
      duration: 0.2, 
      ease: "easeIn" 
    }
  }
}

// Backdrop animation variants
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.2 
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.2,
      delay: 0.1 
    }
  }
}

// Icons for each notification type
const notificationIcons = {
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  error: <AlertCircle className="h-6 w-6 text-red-500" />,
  info: <Info className="h-6 w-6 text-blue-500" />,
  warning: <AlertTriangle className="h-6 w-6 text-amber-500" />
}

// Background colors for each type
const getBackgroundColor = (type: NotificationType) => {
  switch (type) {
    case "success": return "bg-green-50 dark:bg-green-950/30"
    case "error": return "bg-red-50 dark:bg-red-950/30"
    case "info": return "bg-blue-50 dark:bg-blue-950/30"
    case "warning": return "bg-amber-50 dark:bg-amber-950/30"
    default: return "bg-background"
  }
}

// Border colors for each type
const getBorderColor = (type: NotificationType) => {
  switch (type) {
    case "success": return "border-green-300 dark:border-green-700"
    case "error": return "border-red-300 dark:border-red-700"
    case "info": return "border-blue-300 dark:border-blue-700"
    case "warning": return "border-amber-300 dark:border-amber-700"
    default: return "border-border"
  }
}

// Create a global variable to store notification functions
let globalNotifications: NotificationContextType | null = null;

// Create a provider component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const closeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showNotification = (notification: Omit<NotificationItem, "id">) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const showSuccess = (title: string, message: string, options?: NotificationOptions) => {
    showNotification({
      type: "success",
      title,
      message,
      duration: options?.duration || 5000,
      action: options?.action,
      persistent: options?.persistent || false
    });
  };

  const showError = (title: string, message: string, options?: NotificationOptions) => {
    showNotification({
      type: "error",
      title,
      message,
      duration: options?.duration || 7000,
      action: options?.action,
      persistent: options?.persistent || false
    });
  };

  const showInfo = (title: string, message: string, options?: NotificationOptions) => {
    showNotification({
      type: "info",
      title,
      message,
      duration: options?.duration || 5000,
      action: options?.action,
      persistent: options?.persistent || false
    });
  };

  const showWarning = (title: string, message: string, options?: NotificationOptions) => {
    showNotification({
      type: "warning",
      title,
      message,
      duration: options?.duration || 6000,
      action: options?.action,
      persistent: options?.persistent || false
    });
  };

  useEffect(() => {
    if (!isInitialized) {
      globalNotifications = {
        notifications,
        showNotification,
        closeNotification,
        showSuccess,
        showError,
        showInfo,
        showWarning
      };
      setIsInitialized(true);
    }
  }, [isInitialized, notifications, showNotification, closeNotification, showSuccess, showError, showInfo, showWarning]);

  return (
    <NotificationContext.Provider value={globalNotifications}>
      {children}
      <NotificationList notifications={notifications} onClose={closeNotification} />
    </NotificationContext.Provider>
  );
}

// Export the hook
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Individual notification item component
function NotificationItem({ notification, onClose }: { 
  notification: NotificationItem, 
  onClose: () => void 
}) {
  useEffect(() => {
    // Auto-close non-persistent notifications after duration
    if (!notification.persistent && notification.duration) {
      const timer = setTimeout(() => {
        onClose()
      }, notification.duration)
      
      return () => clearTimeout(timer)
    }
  }, [notification, onClose])
  
  return (
    <motion.div
      key={notification.id}
      variants={popupVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "w-full max-w-md rounded-lg shadow-lg border p-4",
        "backdrop-blur-sm bg-opacity-95 dark:bg-opacity-90",
        getBackgroundColor(notification.type),
        getBorderColor(notification.type)
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {notificationIcons[notification.type]}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-foreground">{notification.title}</h3>
          <div className="mt-1 text-sm text-muted-foreground">
            {notification.message}
          </div>
          {notification.action && (
            <div className="mt-3">
              <LoadingButton 
                size="sm"
                onClick={notification.action.onClick}
                loadingText="Processing..."
                className={cn(
                  notification.type === 'error' && "bg-red-500 hover:bg-red-600",
                  notification.type === 'success' && "bg-green-500 hover:bg-green-600",
                  notification.type === 'warning' && "bg-amber-500 hover:bg-amber-600",
                  notification.type === 'info' && "bg-blue-500 hover:bg-blue-600",
                )}
              >
                {notification.action.label}
              </LoadingButton>
            </div>
          )}
        </div>
        <button
          type="button"
          className="flex-shrink-0 rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

// NotificationList component
interface NotificationListProps {
  notifications: NotificationItem[]
  onClose: (id: string) => void
}

function NotificationList({ notifications, onClose }: NotificationListProps) {
  return (
    <AnimatePresence>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={cn(
              "w-full sm:w-96 p-4 rounded-lg shadow-lg",
              notification.type === "success" && "bg-green-100 border border-green-200",
              notification.type === "error" && "bg-red-100 border border-red-200",
              notification.type === "warning" && "bg-yellow-100 border border-yellow-200",
              notification.type === "info" && "bg-blue-100 border border-blue-200"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {notification.type === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {notification.type === "error" && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                {notification.type === "warning" && (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                {notification.type === "info" && (
                  <Info className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={cn(
                  "text-sm font-medium",
                  notification.type === "success" && "text-green-800",
                  notification.type === "error" && "text-red-800",
                  notification.type === "warning" && "text-yellow-800",
                  notification.type === "info" && "text-blue-800"
                )}>
                  {notification.title}
                </h3>
                <p className={cn(
                  "text-sm mt-1",
                  notification.type === "success" && "text-green-700",
                  notification.type === "error" && "text-red-700",
                  notification.type === "warning" && "text-yellow-700",
                  notification.type === "info" && "text-blue-700"
                )}>
                  {notification.message}
                </p>
                {notification.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={notification.action.onClick}
                    className="mt-2"
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>
              <button
                onClick={() => onClose(notification.id)}
                className={cn(
                  "flex-shrink-0 rounded-full p-1 transition-colors",
                  notification.type === "success" && "hover:bg-green-200 text-green-600",
                  notification.type === "error" && "hover:bg-red-200 text-red-600",
                  notification.type === "warning" && "hover:bg-yellow-200 text-yellow-600",
                  notification.type === "info" && "hover:bg-blue-200 text-blue-600"
                )}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

// Main popup component
export function NotificationPopup() {
  const notifications = useNotification();

  return null; // The NotificationList is now rendered by the provider
}

// Export wrapper functions
export function showSuccessNotification(title: string, message: string, options?: NotificationOptions) {
  if (globalNotifications) {
    globalNotifications.showSuccess(title, message, options);
  } else {
    console.warn("Notification system not initialized yet");
  }
}

export function showErrorNotification(title: string, message: string, options?: NotificationOptions) {
  if (globalNotifications) {
    globalNotifications.showError(title, message, options);
  } else {
    console.warn("Notification system not initialized yet");
  }
}

export function showInfoNotification(title: string, message: string, options?: NotificationOptions) {
  if (globalNotifications) {
    globalNotifications.showInfo(title, message, options);
  } else {
    console.warn("Notification system not initialized yet");
  }
}

export function showWarningNotification(title: string, message: string, options?: NotificationOptions) {
  if (globalNotifications) {
    globalNotifications.showWarning(title, message, options);
  } else {
    console.warn("Notification system not initialized yet");
  }
} 