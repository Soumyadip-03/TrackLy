import { toast } from '@/components/ui/use-toast'
import type { ToastActionElement } from '@/components/ui/toast'

interface ToastOptions {
  duration?: number;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
}

/**
 * Custom hook for showing toast notifications
 * @returns Object with methods for showing different types of toast notifications
 */
const useToastNotification = () => {
  return {
    /**
     * Show a success toast notification
     * @param title The title to display
     * @param description The description to display
     * @param options Additional options for the toast
     */
    success: (title: string, description?: string, options?: ToastOptions) => {
      toast({
        title,
        description,
        duration: options?.duration,
        action: options?.action,
        variant: options?.variant || 'default',
      })
    },

    /**
     * Show an error toast notification
     * @param title The title to display
     * @param description The description to display
     * @param options Additional options for the toast
     */
    error: (title: string, description?: string, options?: ToastOptions) => {
      toast({
        title,
        description,
        duration: options?.duration,
        action: options?.action,
        variant: 'destructive',
      })
    },

    /**
     * Show an info toast notification
     * @param title The title to display
     * @param description The description to display
     * @param options Additional options for the toast
     */
    info: (title: string, description?: string, options?: ToastOptions) => {
      toast({
        title,
        description,
        duration: options?.duration,
        action: options?.action,
        variant: options?.variant || 'default',
      })
    },

    /**
     * Show a warning toast notification
     * @param title The title to display
     * @param description The description to display
     * @param options Additional options for the toast
     */
    warning: (title: string, description?: string, options?: ToastOptions) => {
      toast({
        title,
        description,
        duration: options?.duration,
        action: options?.action,
        variant: options?.variant || 'default',
      })
    },

    /**
     * Show a custom toast notification
     * @param options Toast options
     */
    custom: (options: Parameters<typeof toast>[0]) => {
      toast(options)
    }
  }
}

export default useToastNotification
