"use client"

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastNotificationProps {
  message: string
  type?: ToastType
  duration?: number
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left'
  onClose?: () => void
}

/**
 * A reusable toast notification component that can be used throughout the application
 */
export const showToast = ({ 
  message, 
  type = 'info', 
  duration = 3000,
  position = 'top-right',
  onClose
}: ToastNotificationProps) => {
  const toastOptions = {
    duration,
    position,
    onDismiss: onClose,
    icon: type === 'success' ? <CheckCircle className="h-5 w-5" /> :
          type === 'error' ? <AlertCircle className="h-5 w-5" /> :
          <Info className="h-5 w-5" />
  }

  switch (type) {
    case 'success':
      toast.success(message, toastOptions)
      break
    case 'error':
      toast.error(message, toastOptions)
      break
    case 'warning':
      toast.warning(message, toastOptions)
      break
    case 'info':
    default:
      toast.info(message, toastOptions)
      break
  }
}

/**
 * A toast notification component that can be rendered in the DOM
 */
export const ToastNotification: React.FC<ToastNotificationProps & { visible: boolean }> = ({
  message,
  type = 'info',
  duration = 3000,
  visible,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(visible)

  useEffect(() => {
    setIsVisible(visible)
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed z-50 flex items-center p-4 rounded-md shadow-lg transition-all duration-300 transform",
        type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
        type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
        type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
        'bg-blue-50 text-blue-800 border border-blue-200',
        "right-4 top-4"
      )}
    >
      <div className="flex-shrink-0 mr-3">
        {type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
        {type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
        {type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
        {type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
      </div>
      <div className="ml-3 text-sm font-medium">{message}</div>
      <button
        type="button"
        className={cn(
          "ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 focus:ring-2 focus:outline-none",
          type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-400' :
          type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-400' :
          type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-400' :
          'text-blue-500 hover:bg-blue-100 focus:ring-blue-400'
        )}
        onClick={() => {
          setIsVisible(false)
          if (onClose) onClose()
        }}
      >
        <span className="sr-only">Close</span>
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Create a higher-order component to add toast notifications to any component
export function withToastNotification<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    return (
      <>
        <Component {...props} showToast={showToast} />
      </>
    )
  }
}

export default ToastNotification
