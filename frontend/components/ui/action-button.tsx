"use client"

import React, { useState } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { showToast, ToastType } from '@/components/ui/toast-notification'
import { Loader2 } from 'lucide-react'

interface ActionButtonProps extends ButtonProps {
  actionFn: () => Promise<{ success: boolean; message: string }>
  successMessage?: string
  errorMessage?: string
  loadingText?: string
  showToastOnSuccess?: boolean
  showToastOnError?: boolean
  toastType?: ToastType
  toastDuration?: number
  onSuccess?: () => void
  onError?: (error: any) => void
}

/**
 * A button component that shows loading state and toast notifications when clicked
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  actionFn,
  successMessage = 'Action completed successfully',
  errorMessage = 'An error occurred. Please try again.',
  loadingText = 'Processing...',
  showToastOnSuccess = true,
  showToastOnError = true,
  toastType = 'success',
  toastDuration = 3000,
  onSuccess,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(e)
    }

    if (props.disabled || isLoading) return

    setIsLoading(true)
    try {
      const result = await actionFn()
      
      if (result.success) {
        if (showToastOnSuccess) {
          showToast({
            message: result.message || successMessage,
            type: toastType,
            duration: toastDuration
          })
        }
        if (onSuccess) onSuccess()
      } else {
        if (showToastOnError) {
          showToast({
            message: result.message || errorMessage,
            type: 'error',
            duration: toastDuration
          })
        }
        if (onError) onError(new Error(result.message || errorMessage))
      }
    } catch (error) {
      console.error('Action button error:', error)
      if (showToastOnError) {
        showToast({
          message: errorMessage,
          type: 'error',
          duration: toastDuration
        })
      }
      if (onError) onError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={isLoading || props.disabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export default ActionButton
