import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { AttendanceTrends } from "@/components/history/attendance-trends"
import { AttendanceLogs } from "@/components/history/attendance-logs"
import { RecentActivity } from "@/components/history/recent-activity"
import { BarChart, ClipboardList, Clock } from "lucide-react"

export default function HistoryPage() {
  return (
    <div className="container py-6 space-y-6">
      <PageHeader title="History & Reports" description="View your attendance history and generate reports" />

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="flex flex-wrap justify-start gap-2 mb-4">
          <TabsTrigger value="trends" className="flex items-center gap-2 min-w-[140px]">
            <BarChart className="h-4 w-4" />
            <span>Attendance Trends</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2 min-w-[140px]">
            <ClipboardList className="h-4 w-4" />
            <span>Attendance Logs</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2 min-w-[140px]">
            <Clock className="h-4 w-4" />
            <span>Recent Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <AttendanceTrends />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <AttendanceLogs />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <RecentActivity />
        </TabsContent>
      </Tabs>
    </div>
  )
}
