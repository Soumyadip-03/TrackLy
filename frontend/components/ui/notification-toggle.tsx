"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { toggleNotificationSound } from "@/lib/sound-utils"

// Define settings type
interface NotificationSettings {
  notificationSound?: boolean;
  loginNotificationSound?: boolean;
  [key: string]: any;
}

/**
 * Toggle switch for notification sound settings
 */
export function NotificationSoundToggle() {
  // State for the toggle
  const [enabled, setEnabled] = useState<boolean>(true);
  
  // Load setting from localStorage on mount and listen for changes
  useEffect(() => {
    const loadSoundSettings = () => {
      const settings = getFromLocalStorage<NotificationSettings>('notification_settings', {});
      // Default to true if not set
      setEnabled(settings.notificationSound !== false);
    };
    
    // Initial load
    loadSoundSettings();
    
    // Listen for changes from main settings component
    const handleSoundChange = (event: CustomEvent) => {
      setEnabled(event.detail.enabled);
    };
    
    window.addEventListener('notificationSoundChanged', handleSoundChange as EventListener);
    
    // Also listen for storage changes (in case localStorage is updated directly)
    window.addEventListener('storage', (event) => {
      if (event.key === 'trackly_notification_settings') {
        loadSoundSettings();
      }
    });
    
    // Clean up
    return () => {
      window.removeEventListener('notificationSoundChanged', handleSoundChange as EventListener);
    };
  }, []);
  
  // Handle toggle change
  const handleToggleChange = (checked: boolean) => {
    setEnabled(checked);
    toggleNotificationSound(checked);
    
    // Notify other components about the change
    window.dispatchEvent(new CustomEvent('notificationSoundChanged', { 
      detail: { enabled: checked } 
    }));
  };

  return (
    <div className="flex items-center justify-between space-x-2 py-2">
      <Label htmlFor="notification-sound" className="flex flex-col space-y-1">
        <span>Notification Sound</span>
        <span className="text-sm font-normal leading-snug text-muted-foreground">
          Play a sound when notifications appear
        </span>
      </Label>
      <Switch
        id="notification-sound"
        checked={enabled}
        onCheckedChange={handleToggleChange}
      />
    </div>
  );
} 