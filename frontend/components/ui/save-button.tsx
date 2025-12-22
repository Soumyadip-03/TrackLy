"use client"

import { ButtonHTMLAttributes } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"

interface SaveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isSaving: boolean
  text?: string
  loadingText?: string
  variant?: "default" | "primary" | "destructive" | "outline" | "ghost" | "link" | "secondary"
}

export function SaveButton({
  isSaving,
  onClick,
  text = "Save Changes",
  loadingText = "Saving...",
  className = "",
  variant = "default",
  type = "submit",
  ...props
}: SaveButtonProps) {
  return (
    <Button 
      type={type}
      disabled={isSaving} 
      onClick={onClick}
      className={cn(
        variant === "primary" && "bg-primary hover:bg-primary/90",
        className
      )}
      {...props}
    >
      {isSaving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          {text}
        </>
      )}
    </Button>
  )
} 