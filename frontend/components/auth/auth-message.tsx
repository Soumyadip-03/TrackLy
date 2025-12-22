"use client"

import React, { useEffect, useState } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthMessageProps {
  message: string
  type: "success" | "error"
  visible: boolean
  onDismiss?: () => void
  autoHideDuration?: number
}

export function AuthMessage({
  message,
  type,
  visible,
  onDismiss,
  autoHideDuration = 5000,
}: AuthMessageProps) {
  const [isVisible, setIsVisible] = useState(visible)

  useEffect(() => {
    setIsVisible(visible)
  }, [visible])

  useEffect(() => {
    if (isVisible && autoHideDuration) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onDismiss) onDismiss()
      }, autoHideDuration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHideDuration, onDismiss])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "rounded-lg p-4 mb-4 flex items-center gap-3 animate-in slide-in-from-top duration-300 text-sm",
        type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
      )}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      )}
      <div className="flex-1">{message}</div>
      {onDismiss && (
        <button
          onClick={() => {
            setIsVisible(false)
            onDismiss()
          }}
          className="text-gray-500 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          <span className="sr-only">Dismiss</span>
        </button>
      )}
    </div>
  )
} 