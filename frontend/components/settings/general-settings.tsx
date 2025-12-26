"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toggleNotificationSound } from "@/lib/sound-utils"

interface GeneralSettingsData {
  notificationSound: boolean
  loginNotificationSound: boolean | null
  browserNotifications: boolean
  notificationPriority: string
}

export function GeneralSettings() {
  const defaultSettings: GeneralSettingsData = {
    notificationSound: true,
    loginNotificationSound: true,
    browserNotifications: true,
    notificationPriority: "all"
  }

  const [settings, setSettings] = useState<GeneralSettingsData>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const savedSettings = getFromLocalStorage<any>('notification_settings', {})
    const mergedSettings = {
      ...defaultSettings,
      ...savedSettings
    }
    setSettings(mergedSettings)

    const handleSoundChange = (event: CustomEvent) => {
      setSettings(prev => ({
        ...prev,
        notificationSound: event.detail.enabled
      }))
    }
    
    window.addEventListener('notificationSoundChanged', handleSoundChange as EventListener)
    
    return () => {
      window.removeEventListener('notificationSoundChanged', handleSoundChange as EventListener)
    }
  }, [])

  const handleSwitchChange = (name: string) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [name]: !prev[name as keyof typeof prev] }
      
      // Save immediately
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...newSettings }
      saveToLocalStorage('notification_settings', updatedSettings)
      
      if (name === "notificationSound") {
        toggleNotificationSound(!prev.notificationSound)
        window.dispatchEvent(new CustomEvent('notificationSoundChanged', { 
          detail: { enabled: !prev.notificationSound } 
        }))
      }
      
      if (name === "browserNotifications" && !prev.browserNotifications) {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission()
        }
      }
      
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      
      return newSettings
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    setIsSaving(true)
    
    try {
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...settings }
      saveToLocalStorage('notification_settings', updatedSettings)
      saveToLocalStorage('notification_priority', settings.notificationPriority)
      
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      
      toast({
        title: "Settings Saved",
        description: "Your general settings have been updated successfully.",
      })
      
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Settings Issue",
        description: "There was a problem saving your settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Customize your notification preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notification-sound">Notification Sound</Label>
            <p className="text-xs text-muted-foreground">Play a sound when notifications arrive</p>
          </div>
          <Switch
            id="notification-sound"
            checked={settings.notificationSound}
            onCheckedChange={() => handleSwitchChange("notificationSound")}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="login-notification-sound">Login Sound</Label>
            <p className="text-xs text-muted-foreground">Play a sound when you log in</p>
          </div>
          <Switch
            id="login-notification-sound"
            checked={settings.loginNotificationSound !== false}
            onCheckedChange={() => handleSwitchChange("loginNotificationSound")}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="browser-notifications">Browser Notifications</Label>
            <p className="text-xs text-muted-foreground">Show desktop notifications</p>
          </div>
          <Switch
            id="browser-notifications"
            checked={settings.browserNotifications}
            onCheckedChange={() => handleSwitchChange("browserNotifications")}
          />
        </div>
        
        <div className="space-y-2 border-t pt-4">
          <Label>Priority Level</Label>
          <p className="text-xs text-muted-foreground mb-2">Choose which priority levels to show</p>
          
          <RadioGroup 
            value={settings.notificationPriority} 
            onValueChange={(value) => handleSelectChange("notificationPriority", value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="priority-all" />
              <Label htmlFor="priority-all">All Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high" id="priority-high" />
              <Label htmlFor="priority-high">High Priority Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="priority-medium" />
              <Label htmlFor="priority-medium">Medium Priority & Above</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  )
}
