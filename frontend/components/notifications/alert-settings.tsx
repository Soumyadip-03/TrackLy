"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { NotificationSoundToggle } from "@/components/ui/notification-toggle"
import { toggleNotificationSound } from "@/lib/sound-utils"

interface NotificationSettings {
  // Attendance settings
  attendanceReminders: boolean;
  attendanceThreshold: string;
  attendanceReminderFrequency: string;
  
  // Todo settings
  todoReminders: boolean;
  todoReminderTime: string;
  priorityTodosOnly: boolean;
  
  // Calendar settings
  calendarReminders: boolean;
  calendarReminderTime: string;
  
  // Delivery preferences
  notificationSound: boolean;
  browserNotifications: boolean;
  emailNotifications: boolean;
  emailAddress: string;
  emailDigest: string; // 'instant', 'daily', 'weekly'
  
  // Points & achievements
  pointsNotifications: boolean;
  achievementNotifications: boolean;
  
  // Muted notifications
  mutedTypes: string[]; // Array of notification types to mute
  
  // Priority Level
  notificationPriority: string; // 'all', 'high', 'medium', 'low'
  
  // Login notification sound
  loginNotificationSound: boolean | null;
}

// Add a utility function for safe fetch that never throws
const safeFetch = async (url: string, options: RequestInit) => {
  try {
    // Add timeout functionality
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // First check if response is OK
    if (!response.ok) {
      // Try to get error as JSON but handle case where it's not valid JSON
      try {
        const errorData = await response.json();
        return { success: false, error: errorData };
      } catch (jsonError) {
        // If not JSON, return the status text
        return { success: false, error: { message: response.statusText || "Server error" } };
      }
    }
    
    // For successful responses, safely try to parse JSON
    try {
      const data = await response.json();
      return { success: true, data };
    } catch (jsonError) {
      console.error("Error parsing successful response as JSON:", jsonError);
      return { success: false, error: { message: "Invalid JSON response from server" } };
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return { success: false, error: { message: error instanceof Error ? error.message : "Unknown fetch error" } };
  }
};

export function AlertSettings() {
  // Default settings for new users
  const defaultSettings: NotificationSettings = {
    attendanceReminders: true,
    attendanceThreshold: "85",
    attendanceReminderFrequency: "weekly",
    
    todoReminders: true,
    todoReminderTime: "1",
    priorityTodosOnly: false,
    
    calendarReminders: true,
    calendarReminderTime: "1",
    
    notificationSound: true,
    browserNotifications: true,
    emailNotifications: false,
    emailAddress: "",
    emailDigest: "daily",
    
    pointsNotifications: true,
    achievementNotifications: true,
    
    mutedTypes: [],
    
    notificationPriority: "all",
    
    loginNotificationSound: true
  };

  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("academic");
  const [userEmail, setUserEmail] = useState<string>("");

  // Load saved settings and user data on component mount
  useEffect(() => {
    // Load main settings from localStorage
    const savedSettings = getFromLocalStorage<NotificationSettings>('notification_settings', defaultSettings);
    
    // Load additional separate settings
    const savedEmail = getFromLocalStorage<string>('user_email_preference', '');
    const savedMutedTypes = getFromLocalStorage<string[]>('muted_notification_types', []);
    const savedPriority = getFromLocalStorage<string>('notification_priority', 'all');
    
    // Merge all settings
    const mergedSettings = {
      ...savedSettings,
      // Override with individual settings if they exist
      ...(savedEmail ? { emailAddress: savedEmail } : {}),
      ...(savedMutedTypes.length > 0 ? { mutedTypes: savedMutedTypes } : {}),
      ...(savedPriority ? { notificationPriority: savedPriority } : {})
    };
    
    // Look for saved user email
    const cachedUserEmail = localStorage.getItem('user_email') || '';
    if (cachedUserEmail) {
      setUserEmail(cachedUserEmail);
      
      // Update settings with the user's email if not already set
      if (!mergedSettings.emailAddress) {
        mergedSettings.emailAddress = cachedUserEmail;
      }
    }
    
    // Set the combined settings
    setSettings(mergedSettings);
    
    console.log('Loaded notification settings from localStorage:', mergedSettings);

    // Add event listener for notification sound changes from other components
    const handleSoundChange = (event: CustomEvent) => {
      setSettings(prev => ({
        ...prev,
        notificationSound: event.detail.enabled
      }));
    };
    
    window.addEventListener('notificationSoundChanged', handleSoundChange as EventListener);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('notificationSoundChanged', handleSoundChange as EventListener);
    };
  }, []);

  const handleSwitchChange = (name: string) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [name]: !prev[name as keyof typeof prev] };
      
      // Special handling for notification sound to sync with the utility function
      if (name === "notificationSound") {
        toggleNotificationSound(!prev.notificationSound);
        // Trigger an event to notify other components
        window.dispatchEvent(new CustomEvent('notificationSoundChanged', { 
          detail: { enabled: !prev.notificationSound } 
        }));
      }
      
      return newSettings;
    });
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleMutedTypeChange = (type: string, checked: boolean) => {
    setSettings(prev => {
      if (checked) {
        return { ...prev, mutedTypes: [...prev.mutedTypes, type] };
      } else {
        return { ...prev, mutedTypes: prev.mutedTypes.filter(t => t !== type) };
      }
    });
  }

  const handleSave = () => {
    setIsSaving(true);
    
    try {
      // Email validation no longer needed as we'll use account email
      
      // Save all settings to localStorage
      saveToLocalStorage('notification_settings', settings);
      
      // No longer need to save email preference separately
      
      // Save muted types separately
      if (settings.mutedTypes && settings.mutedTypes.length > 0) {
        saveToLocalStorage('muted_notification_types', settings.mutedTypes);
      }
      
      // Save priority settings separately
      saveToLocalStorage('notification_priority', settings.notificationPriority);
      
      // Notify other components that settings have been updated immediately
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      
      // Show success toast - focus on local storage success
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated successfully.",
      });
      
      // Additional toast for email settings if enabled
      if (settings.emailNotifications) {
        toast({
          title: "Email Settings Saved",
          description: "Email notifications are enabled in your preferences.",
        });
      }
      
      // Log success for debugging
      console.log('All notification settings saved to localStorage:', settings);
      
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Settings Issue",
        description: "There was a problem saving your settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const validateEmail = (email: string): boolean => {
    if (!settings.emailNotifications) return true;
    if (!email) return false;
    
    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
  
  const isMutedType = (type: string): boolean => {
    return settings.mutedTypes.includes(type);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Settings</CardTitle>
        <CardDescription>Customize your notification preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          {/* General Tab - REMOVED */}
          
          {/* Academic Tab */}
          <TabsContent value="academic" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Attendance Alerts</h3>

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
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="80">80%</SelectItem>
                    <SelectItem value="85">85%</SelectItem>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="95">95%</SelectItem>
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

            <div className="space-y-4">
              <h3 className="text-sm font-medium">To-Do Alerts</h3>

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
          </TabsContent>
          
          {/* Delivery Tab */}
          <TabsContent value="delivery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Preferences</CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Email Notifications</h3>
                  
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
                    <>
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
                    </>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Other Notifications</h3>

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
          </TabsContent>
          
          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
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
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  )
}
