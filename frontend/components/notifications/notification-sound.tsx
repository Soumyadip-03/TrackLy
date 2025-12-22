"use client"

import { useEffect } from 'react'
import { playNotificationSound } from '@/lib/sound-utils'

/**
 * NotificationSound component
 * 
 * Listens for notification events and plays sounds accordingly.
 * Doesn't render any visible UI.
 */
export function NotificationSound() {
  useEffect(() => {
    // Function to handle notification events
    const handleNotification = () => {
      playNotificationSound().catch(err => {
        // Error already logged in utility
      });
    };
    
    // Listen for custom notification events
    window.addEventListener('new-notification', handleNotification);
    
    // Clean up listener on unmount
    return () => {
      window.removeEventListener('new-notification', handleNotification);
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}

// Add global type for custom event
declare global {
  interface WindowEventMap {
    'new-notification': CustomEvent;
  }
} 