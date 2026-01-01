"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"

interface AcademicSettingsData {
  attendanceReminders: boolean
  attendanceThreshold: string
  attendanceReminderFrequency: string
  todoReminders: boolean
  todoReminderTime: string
  priorityTodosOnly: boolean
  calendarReminders: boolean
  calendarReminderTime: string
}

export function AcademicSettings() {
  const defaultSettings: AcademicSettingsData = {
    attendanceReminders: true,
    attendanceThreshold: "75",
    attendanceReminderFrequency: "never",
    todoReminders: true,
    todoReminderTime: "1",
    priorityTodosOnly: false,
    calendarReminders: true,
    calendarReminderTime: "1"
  }

  const [settings, setSettings] = useState<AcademicSettingsData>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const savedSettings = getFromLocalStorage<any>('notification_settings', {})
    const mergedSettings = { ...defaultSettings, ...savedSettings }
    setSettings(mergedSettings)
  }, [])

  const handleSwitchChange = (name: string) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [name]: !prev[name as keyof typeof prev] }
      
      // Auto-save to localStorage
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...newSettings }
      saveToLocalStorage('notification_settings', updatedSettings)
      
      // Save to backend
      saveToBackend(newSettings)
      
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      
      return newSettings
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [name]: value }
      
      // Auto-save to localStorage
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...newSettings }
      saveToLocalStorage('notification_settings', updatedSettings)
      
      // Save to backend
      saveToBackend(newSettings)
      
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      
      return newSettings
    })
  }

  const saveToBackend = async (newSettings: Partial<AcademicSettingsData>) => {
    try {
      const token = localStorage.getItem('trackly_token')
      const response = await fetch('http://localhost:5000/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      })
      
      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Academic preferences updated successfully.",
        })
      }
    } catch (error) {
      console.error('Error saving to backend:', error)
      toast({
        title: "Save Failed",
        description: "Could not save settings. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSave = () => {
    setIsSaving(true)
    try {
      const existingSettings = getFromLocalStorage<any>('notification_settings', {})
      const updatedSettings = { ...existingSettings, ...settings }
      saveToLocalStorage('notification_settings', updatedSettings)
      window.dispatchEvent(new CustomEvent('settingsUpdated'))
      toast({
        title: "Settings Saved",
        description: "Your academic notification settings have been updated.",
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
        <CardTitle>Academic Settings</CardTitle>
        <CardDescription>Manage attendance, todo, and calendar notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="attendance-reminders">Attendance Reminders</Label>
              <p className="text-xs text-muted-foreground">Receive reminders to update your attendance</p>
            </div>
            <Switch
              id="attendance-reminders"
              checked={settings.attendanceReminders}
              onCheckedChange={() => handleSwitchChange("attendanceReminders")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="attendance-threshold">Low Attendance Alert Threshold</Label>
              <p className="text-xs text-muted-foreground">Get alerted when attendance falls below this percentage</p>
            </div>
            <Select
              value={settings.attendanceThreshold}
              onValueChange={(value) => handleSelectChange("attendanceThreshold", value)}
              disabled={!settings.attendanceReminders}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="60">60%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="attendance-reminder-frequency">Attendance Summary Frequency</Label>
              <p className="text-xs text-muted-foreground">How often to receive attendance summaries</p>
            </div>
            <Select
              value={settings.attendanceReminderFrequency}
              onValueChange={(value) => handleSelectChange("attendanceReminderFrequency", value)}
              disabled={!settings.attendanceReminders}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="todo-reminders">To-Do Reminders</Label>
              <p className="text-xs text-muted-foreground">Receive reminders for upcoming tasks</p>
            </div>
            <Switch
              id="todo-reminders"
              checked={settings.todoReminders}
              onCheckedChange={() => handleSwitchChange("todoReminders")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="todo-reminder-time">Reminder Time</Label>
              <p className="text-xs text-muted-foreground">How many days before the task is due</p>
            </div>
            <Select
              value={settings.todoReminderTime}
              onValueChange={(value) => handleSelectChange("todoReminderTime", value)}
              disabled={!settings.todoReminders}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Same day</SelectItem>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="2">2 days</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="5">5 days</SelectItem>
                <SelectItem value="7">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="priority-todos-only">High Priority Tasks Only</Label>
              <p className="text-xs text-muted-foreground">Only receive reminders for high priority tasks</p>
            </div>
            <Switch
              id="priority-todos-only"
              checked={settings.priorityTodosOnly}
              onCheckedChange={() => handleSwitchChange("priorityTodosOnly")}
              disabled={!settings.todoReminders}
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="calendar-reminders">Calendar Event Reminders</Label>
              <p className="text-xs text-muted-foreground">Get notified about upcoming calendar events</p>
            </div>
            <Switch
              id="calendar-reminders"
              checked={settings.calendarReminders}
              onCheckedChange={() => handleSwitchChange("calendarReminders")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="calendar-reminder-time">Calendar Reminder Time</Label>
              <p className="text-xs text-muted-foreground">How many days before the event</p>
            </div>
            <Select
              value={settings.calendarReminderTime}
              onValueChange={(value) => handleSelectChange("calendarReminderTime", value)}
              disabled={!settings.calendarReminders}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Same day</SelectItem>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="2">2 days</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
