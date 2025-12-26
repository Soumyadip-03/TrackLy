"use client"

import React, { createContext, useContext } from 'react'
import { Toaster } from 'sonner'
import { showToast, ToastType } from '@/components/ui/toast-notification'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    showToast({
      message,
      type,
      duration
    })
  }

  return (
    <ToastContext.Provider value={{ showToast: toast }}>
      {children}
    </ToastContext.Provider>
  )
}

export default ToastProvider
