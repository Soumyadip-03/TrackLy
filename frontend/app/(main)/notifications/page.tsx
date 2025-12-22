import { PageHeader } from "@/components/page-header"
import { NotificationList } from "@/components/notifications/notification-list"
import { AlertSettings } from "@/components/notifications/alert-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Settings } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="container py-6 space-y-6">
      <PageHeader title="Notifications & Alerts" description="Manage your notifications and alert preferences" />

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Alert Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationList />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <AlertSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
