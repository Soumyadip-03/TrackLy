"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { toggleNotificationSound } from "@/lib/sound-utils"

interface GeneralSettingsData {
  notificationSound: boolean
  loginNotificationSound: boolean | null
  browserNotifications: boolean
  mutedTypes: string[]
}

export function GeneralSettings() {
  const defaultSettings: GeneralSettingsData = {
    notificationSound: true,
    loginNotificationSound: true,
    browserNotifications: true,
    mutedTypes: []
  }

  const [settings, setSettings] = useState<GeneralSettingsData>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const savedSettings = getFromLocalStorage<any>('notification_settings', {})
    const savedMutedTypes = getFromLocalStorage<string[]>('muted_notification_types', [])
    const mergedSettings = {
      ...defaultSettings,
      ...savedSettings,
      mutedTypes: savedMutedTypes.length > 0 ? savedMutedTypes : (savedSettings.mutedTypes || [])
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
      const currentValue = prev[name as keyof typeof prev]
      const newValue = typeof currentValue === 'boolean' ? !currentValue : true
      const newSettings = { ...prev, [name]: newValue }
      
      // Save immediately
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...newSettings }
      saveToLocalStorage('notification_settings', updatedSettings)
      
      if (name === "notificationSound") {
        toggleNotificationSound(newValue as boolean)
        window.dispatchEvent(new CustomEvent('notificationSoundChanged', { 
          detail: { enabled: newValue } 
        }))
      }
      
      if (name === "browserNotifications" && newValue) {
        if (typeof window !== 'undefined' && window.Notification && window.Notification.permission === 'default') {
          window.Notification.requestPermission()
        }
      }
      
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      
      return newSettings
    })
  }

  const handleMutedTypeChange = (type: string, checked: boolean) => {
    setSettings(prev => {
      const newSettings = checked
        ? { ...prev, mutedTypes: [...prev.mutedTypes, type] }
        : { ...prev, mutedTypes: prev.mutedTypes.filter(t => t !== type) }
      
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...newSettings }
      saveToLocalStorage('notification_settings', updatedSettings)
      saveToLocalStorage('muted_notification_types', newSettings.mutedTypes)
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      
      return newSettings
    })
  }

  const isMutedType = (type: string): boolean => {
    return settings.mutedTypes.includes(type)
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
            checked={!!settings.notificationSound}
            onCheckedChange={async (checked) => {
              setSettings(prev => {
                const newSettings = { ...prev, notificationSound: checked }
                const existingSettings = getFromLocalStorage<any>('notification_settings', {})
                const updatedSettings = { ...existingSettings, ...newSettings }
                saveToLocalStorage('notification_settings', updatedSettings)
                toggleNotificationSound(checked)
                
                // Play test sound when enabled
                if (checked) {
                  const audioContext = new AudioContext()
                  const oscillator = audioContext.createOscillator()
                  const gainNode = audioContext.createGain()
                  
                  oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
                  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
                  
                  oscillator.connect(gainNode)
                  gainNode.connect(audioContext.destination)
                  
                  oscillator.start()
                  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1)
                  oscillator.stop(audioContext.currentTime + 1)
                }
                
                window.dispatchEvent(new CustomEvent('notificationSoundChanged', { detail: { enabled: checked } }))
                window.dispatchEvent(new CustomEvent('settingsUpdated'))
                return newSettings
              })
            }}
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
            onCheckedChange={(checked) => {
              handleSwitchChange("loginNotificationSound")
              
              // Play test sound when enabled
              if (checked) {
                const audioContext = new AudioContext()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
                
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                
                oscillator.start()
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1)
                oscillator.stop(audioContext.currentTime + 1)
              }
            }}
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
          <Label>Mute Specific Notifications</Label>
          <p className="text-xs text-muted-foreground mb-2">Select notification types you want to mute</p>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="mute-attendance" 
                checked={isMutedType('attendance')}
                onChange={(e) => handleMutedTypeChange('attendance', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="mute-attendance">Attendance Reminders</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="mute-todo" 
                checked={isMutedType('todo')}
                onChange={(e) => handleMutedTypeChange('todo', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="mute-todo">To-Do Reminders</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="mute-calendar" 
                checked={isMutedType('calendar')}
                onChange={(e) => handleMutedTypeChange('calendar', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="mute-calendar">Calendar Events</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="mute-points" 
                checked={isMutedType('points')}
                onChange={(e) => handleMutedTypeChange('points', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="mute-points">Points & Achievements</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="mute-system" 
                checked={isMutedType('system')}
                onChange={(e) => handleMutedTypeChange('system', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="mute-system">System Notifications</Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Settings are saved automatically when you make changes.
      </CardFooter>
    </Card>
  )
}
