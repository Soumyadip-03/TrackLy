"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getLoginRecords, LoginRecord } from "@/lib/auth-utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { Bell, Mail } from "lucide-react"

interface EmailNotification {
  timestamp: string;
  to: string;
  subject: string;
  preview: string;
  content?: string;
}

export function LoginHistory() {
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([])
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>([])
  const [activeTab, setActiveTab] = useState("logins")

  useEffect(() => {
    // Load login records from localStorage
    const records = getLoginRecords()
    setLoginRecords(records)
    
    // Load email notifications
    const emails = getFromLocalStorage<EmailNotification[]>('email_notifications', [])
    setEmailNotifications(emails)

    // Set up event listener for updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('login_records')) {
        setLoginRecords(getLoginRecords())
      }
      if (e.key?.includes('email_notifications')) {
        setEmailNotifications(getFromLocalStorage('email_notifications', []))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Format date for display
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  // Format time for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Activity</CardTitle>
        <CardDescription>Your account access and notification history</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="logins" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Login Activity</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Email Notifications</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="logins">
            {loginRecords.length === 0 ? (
              <p className="text-muted-foreground text-sm">No login history available.</p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {loginRecords.map((record, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col space-y-1 border-b pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{formatDate(record.timestamp)}</div>
                        <div className="text-sm text-muted-foreground">{formatTime(record.timestamp)}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="font-medium">{record.browser}</span> on {record.device}
                        </div>
                        {index === 0 && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="emails">
            {emailNotifications.length === 0 ? (
              <p className="text-muted-foreground text-sm">No email notifications sent yet.</p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {emailNotifications.map((email, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col space-y-1 border-b pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{email.subject}</div>
                        <div className="text-sm text-muted-foreground">{formatDate(email.timestamp)} {formatTime(email.timestamp)}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        To: {email.to}
                      </div>
                      <div className="text-sm">
                        {email.preview}
                      </div>
                      {email.content && (
                        <div className="mt-2 p-3 bg-muted rounded-md text-xs whitespace-pre-line">
                          {email.content}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1 italic">
                        Note: This is a simulated email in development. No actual emails are sent.
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 