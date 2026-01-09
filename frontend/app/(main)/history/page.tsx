import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { AttendanceReport } from "@/components/history/attendance-report"
import { AttendanceLogs } from "@/components/history/attendance-logs"
import { RecentActivity } from "@/components/history/recent-activity"
import { BarChart, ClipboardList, Clock } from "lucide-react"

export default function HistoryPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="container py-6"></div>
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="trends" className="h-full flex flex-col">
          <div className="container">
            <TabsList className="w-full max-w-3xl mx-auto grid grid-cols-3">
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>Attendance Report</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span>Attendance Logs</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Recent Activity</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 overflow-y-auto mt-6">
            <div className="container pb-6">
              <TabsContent value="trends" className="space-y-6 mt-0">
                <AttendanceReport />
              </TabsContent>

              <TabsContent value="logs" className="space-y-6 mt-0">
                <AttendanceLogs />
              </TabsContent>

              <TabsContent value="activity" className="space-y-6 mt-0">
                <RecentActivity />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
