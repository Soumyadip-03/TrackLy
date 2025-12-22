"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Helper script to convert existing buttons to LoadingButtons
export const convertButtonsToLoadingButtons = () => {
  if (typeof window === 'undefined') return;
  
  // Only run once the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Target all buttons except those with data-no-loading attribute
    const buttons = document.querySelectorAll('button:not([data-no-loading])');
    
    buttons.forEach(button => {
      // Skip if already processed
      if (button.hasAttribute('data-loading-processed')) return;
      
      // Mark as processed
      button.setAttribute('data-loading-processed', 'true');
      
      // Add click handler to show loading state
      button.addEventListener('click', () => {
        // Skip if disabled or submit button (handled by form)
        if (button.hasAttribute('disabled') || button.getAttribute('type') === 'submit') return;
        
        // Show loading state
        const originalContent = button.innerHTML;
        button.setAttribute('disabled', 'true');
        button.setAttribute('data-original-content', originalContent);
        
        // Add loading spinner
        const spinner = document.createElement('span');
        spinner.className = 'loading-spinner mr-2';
        spinner.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        button.prepend(spinner);
        
        // Add done state after operation completes
        setTimeout(() => {
          button.innerHTML = '';
          const checkmark = document.createElement('span');
          checkmark.className = 'success-checkmark mr-2';
          checkmark.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M20 6L9 17l-5-5"></path></svg>`;
          button.prepend(checkmark);
          button.appendChild(document.createTextNode('Done!'));
          button.classList.add('bg-green-500', 'hover:bg-green-600', 'text-white', 'border-green-500');
          
          // Reset after delay
          setTimeout(() => {
            button.innerHTML = originalContent;
            button.classList.remove('bg-green-500', 'hover:bg-green-600', 'text-white', 'border-green-500');
            button.removeAttribute('disabled');
          }, 2000);
        }, 1000);
      });
    });
  });
};

// Component you can add at the top level of your app to automatically convert buttons
export function ButtonConverter() {
  useEffect(() => {
    convertButtonsToLoadingButtons();
  }, []);
  
  return null; // This component doesn't render anything
}

// Enhanced Button component that automatically includes loading behavior
interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  noLoading?: boolean
  className?: string
}

export function EnhancedButton({
  children,
  variant = "default",
  size = "default",
  noLoading,
  className,
  onClick,
  ...props
}: EnhancedButtonProps) {
  // If noLoading is true, use regular button
  if (noLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={onClick}
        data-no-loading="true"
        {...props}
      >
        {children}
      </Button>
    );
  }
  
  // Otherwise use LoadingButton
  return (
    <LoadingButton
      variant={variant}
      size={size}
      className={className}
      onClick={onClick as () => Promise<void> | void}
      {...props}
    >
      {children}
    </LoadingButton>
  );
} 