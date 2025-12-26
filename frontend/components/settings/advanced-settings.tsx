"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"

interface AdvancedSettingsData {
  mutedTypes: string[]
}

export function AdvancedSettings() {
  const defaultSettings: AdvancedSettingsData = {
    mutedTypes: []
  }

  const [settings, setSettings] = useState<AdvancedSettingsData>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const savedSettings = getFromLocalStorage<any>('notification_settings', {})
    const savedMutedTypes = getFromLocalStorage<string[]>('muted_notification_types', [])
    const mergedSettings = {
      ...defaultSettings,
      mutedTypes: savedMutedTypes.length > 0 ? savedMutedTypes : (savedSettings.mutedTypes || [])
    }
    setSettings(mergedSettings)
  }, [])

  const handleMutedTypeChange = (type: string, checked: boolean) => {
    setSettings(prev => {
      const newSettings = checked
        ? { ...prev, mutedTypes: [...prev.mutedTypes, type] }
        : { ...prev, mutedTypes: prev.mutedTypes.filter(t => t !== type) }
      
      // Auto-save
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

  const handleSave = () => {
    setIsSaving(true)
    try {
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...settings }
      saveToLocalStorage('notification_settings', updatedSettings)
      
      if (settings.mutedTypes && settings.mutedTypes.length > 0) {
        saveToLocalStorage('muted_notification_types', settings.mutedTypes)
      }
      
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      toast({
        title: "Settings Saved",
        description: "Your advanced notification settings have been updated.",
      })
    } catch (error) {
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
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>Fine-tune your notification preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-sm font-medium">Mute Specific Notifications</h3>
        <p className="text-xs text-muted-foreground">Select notification types you want to mute</p>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="mute-attendance" 
              checked={isMutedType('attendance')}
              onCheckedChange={(checked) => handleMutedTypeChange('attendance', checked === true)}
            />
            <Label htmlFor="mute-attendance">Attendance Reminders</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="mute-todos" 
              checked={isMutedType('todos')}
              onCheckedChange={(checked) => handleMutedTypeChange('todos', checked === true)}
            />
            <Label htmlFor="mute-todos">To-Do Reminders</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="mute-calendar" 
              checked={isMutedType('calendar')}
              onCheckedChange={(checked) => handleMutedTypeChange('calendar', checked === true)}
            />
            <Label htmlFor="mute-calendar">Calendar Events</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="mute-points" 
              checked={isMutedType('points')}
              onCheckedChange={(checked) => handleMutedTypeChange('points', checked === true)}
            />
            <Label htmlFor="mute-points">Points & Achievements</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
