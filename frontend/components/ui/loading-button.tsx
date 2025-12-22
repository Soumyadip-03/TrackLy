"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonProps } from "@/components/ui/button"

export interface LoadingButtonProps extends ButtonProps {
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  onClick?: () => Promise<void> | void
  loadingText?: string
  successText?: string
  resetTimeout?: number
  className?: string
  loading?: boolean
}

export function LoadingButton({
  children,
  variant = "default",
  size = "default",
  onClick,
  loadingText,
  successText,
  resetTimeout = 2000,
  className,
  loading,
  ...props
}: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Reset success state after specified timeout
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isSuccess) {
      timer = setTimeout(() => {
        setIsSuccess(false)
      }, resetTimeout)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isSuccess, resetTimeout])

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      try {
        setIsLoading(true)
        const result = onClick()
        
        // Handle both Promise and void returns
        if (result instanceof Promise) {
          await result
        }
        
        setIsLoading(false)
        setIsSuccess(true)
      } catch (error) {
        console.error("Button action failed:", error)
        setIsLoading(false)
      }
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading || isSuccess || loading}
      className={cn(
        className,
        isSuccess && "bg-green-500 hover:bg-green-600 text-white",
        "transition-all duration-300"
      )}
      {...props}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {isSuccess && (
        <Check className="mr-2 h-4 w-4" />
      )}
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        isLoading 
          ? loadingText || children 
          : isSuccess 
            ? successText || "Done!" 
            : children
      )}
    </Button>
  )
} 