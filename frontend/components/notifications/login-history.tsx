"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Bell, Mail, RefreshCw } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"

interface LoginHistoryItem {
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    os: string;
    browser: string;
  };
}

interface EmailHistoryItem {
  type: string;
  subject: string;
  sentAt: string;
  status: string;
  details?: any;
}

export function LoginHistory() {
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([])
  const [emailHistory, setEmailHistory] = useState<EmailHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("logins")

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('/auth/me')
      if (response.ok) {
        const result = await response.json()
        const userData = result.data || result
        
        if (userData.userSpecificData) {
          // Sort login history by timestamp (newest first)
          const sortedLogins = (userData.userSpecificData.loginHistory || []).sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setLoginHistory(sortedLogins)
          setEmailHistory(userData.userSpecificData.emailHistory || [])
        }
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSecurityData()
    
    // Refresh every 30 seconds when on security tab
    const interval = setInterval(() => {
      fetchSecurityData()
    }, 30000);
    
    return () => clearInterval(interval);
  }, [])

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[320px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Security Activity</CardTitle>
            <CardDescription>Your account access and notification history</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSecurityData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4 flex-shrink-0">
            <TabsTrigger value="logins" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Login Activity</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Email Notifications</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="logins" className="flex-1 overflow-hidden mt-0">
            {loginHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No login history available.</p>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  {loginHistory.map((login, index) => (
                    <div key={index} className="flex flex-col space-y-1 border-b pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{formatDate(login.timestamp)}</div>
                        <div className="text-sm text-muted-foreground">{formatTime(login.timestamp)}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="font-medium">{login.deviceInfo.browser}</span> on {login.deviceInfo.os}
                        </div>
                        {index === 0 && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        IP: {login.ipAddress}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="emails" className="flex-1 overflow-hidden mt-0">
            {emailHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No email notifications sent yet.</p>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  {emailHistory.map((email, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col space-y-1 border-b pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{email.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(email.sentAt)} {formatTime(email.sentAt)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        Type: {email.type} • Status: {email.status}
                      </div>
                      {email.details && (
                        <div className="text-xs text-muted-foreground">
                          {email.details.ipAddress && `IP: ${email.details.ipAddress}`}
                          {email.details.device && ` • Device: ${email.details.device}`}
                          {email.details.browser && ` • Browser: ${email.details.browser}`}
                        </div>
                      )}
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