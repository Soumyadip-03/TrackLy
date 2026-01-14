import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceReport } from "@/components/history/attendance-report"
import { AttendanceLogs } from "@/components/history/attendance-logs"
import { PreviousSemesters } from "@/components/history/previous-semesters"
import { BarChart, ClipboardList, Archive } from "lucide-react"

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
              <TabsTrigger value="previous" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                <span>Previous Semesters</span>
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

              <TabsContent value="previous" className="space-y-6 mt-0">
                <PreviousSemesters />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
