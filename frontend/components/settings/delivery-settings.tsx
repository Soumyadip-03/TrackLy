"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { fetchWithAuth } from "@/lib/api"

interface DeliverySettingsData {
  emailNotifications: boolean
  emailDigest: string
  pointsNotifications: boolean
  achievementNotifications: boolean
}

export function DeliverySettings() {
  const defaultSettings: DeliverySettingsData = {
    emailNotifications: false,
    emailDigest: "daily",
    pointsNotifications: true,
    achievementNotifications: true
  }

  const [settings, setSettings] = useState<DeliverySettingsData>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetchWithAuth('/auth/me')
        if (response.ok) {
          const data = await response.json()
          const prefs = data.notificationPreferences?.emailNotifications
          if (prefs) {
            const mutedTypes = prefs.mutedTypes || []
            setSettings({
              emailNotifications: prefs.enabled || false,
              emailDigest: prefs.frequency || 'daily',
              pointsNotifications: !mutedTypes.includes('points'),
              achievementNotifications: !mutedTypes.includes('achievement')
            })
          }
        }
      } catch (error) {
        const savedSettings = getFromLocalStorage<any>('notification_settings', {})
        const mergedSettings = { ...defaultSettings, ...savedSettings }
        setSettings(mergedSettings)
      }
    }
    loadSettings()
  }, [])

  const saveToBackend = async (newSettings: DeliverySettingsData) => {
    try {
      const response = await fetchWithAuth('/user/email-preferences', {
        method: 'PUT',
        body: JSON.stringify(newSettings)
      })
      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Email preferences updated successfully.",
        })
      }
    } catch (error) {
      console.error('Failed to save to backend:', error)
    }
  }

  const handleSwitchChange = (name: string) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [name]: !prev[name as keyof typeof prev] }
      
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...newSettings }
      saveToLocalStorage('notification_settings', updatedSettings)
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      
      saveToBackend(newSettings)
      
      return newSettings
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [name]: value }
      
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...newSettings }
      saveToLocalStorage('notification_settings', updatedSettings)
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      
      saveToBackend(newSettings)
      
      return newSettings
    })
  }

  const handleSave = () => {
    setIsSaving(true)
    try {
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...settings }
      saveToLocalStorage('notification_settings', updatedSettings)
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      
      if (settings.emailNotifications) {
        toast({
          title: "Settings Saved",
          description: "Email notifications are enabled in your preferences.",
        })
      } else {
        toast({
          title: "Settings Saved",
          description: "Your delivery preferences have been updated.",
        })
      }
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
        <CardTitle>Delivery Preferences</CardTitle>
        <CardDescription>Choose how you want to receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={() => handleSwitchChange("emailNotifications")}
            />
          </div>
          {settings.emailNotifications && (
            <div className="space-y-2">
              <Label htmlFor="email-digest">Email Frequency</Label>
              <Select
                value={settings.emailDigest}
                onValueChange={(value) => handleSelectChange("emailDigest", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Send Immediately</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="points-notifications">Points Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified when you earn or spend points</p>
            </div>
            <Switch
              id="points-notifications"
              checked={settings.pointsNotifications}
              onCheckedChange={() => handleSwitchChange("pointsNotifications")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="achievement-notifications">Achievement Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified when you unlock achievements</p>
            </div>
            <Switch
              id="achievement-notifications"
              checked={settings.achievementNotifications}
              onCheckedChange={() => handleSwitchChange("achievementNotifications")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
