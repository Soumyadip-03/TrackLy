"use client"

import { useEffect, useState } from "react"
import { VisualAttendanceForm } from "@/components/attendance/visual-attendance-form"
import { AttendanceCalculator } from "@/components/attendance/attendance-calculator"
import { TargetAttendanceCalculator } from "@/components/attendance/target-attendance-calculator"
import { AcademicPeriodSelector } from "@/components/attendance/academic-period-selector"
import { AutoMarkedAttendance } from "@/components/dashboard/auto-marked-attendance"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { getFromLocalStorage } from "@/lib/storage-utils"
import WeeklyReportButton from "@/components/attendance/weekly-report-button"

// Record type
interface AttendanceRecord {
  date: string
  classId: string
  className: string
  status: "present" | "absent" 
  notes: string
  classType?: string
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [activeTab, setActiveTab] = useState("academic-period")

  // Load saved records from localStorage and check URL parameters
  useEffect(() => {
    const loadedRecords = getFromLocalStorage<AttendanceRecord[]>('attendance_records', [])
    setRecords(loadedRecords)
    
    // Handle tab from URL parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      
      if (tabParam && ['academic-period', 'record', 'auto-marked', 'calculator'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else {
        setActiveTab('academic-period');
      }
    }
    
    // Add event listener for storage changes
    const handleStorageChange = () => {
      const updatedRecords = getFromLocalStorage<AttendanceRecord[]>('attendance_records', [])
      setRecords(updatedRecords)
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Custom event for same-window updates
    window.addEventListener('attendanceUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('attendanceUpdated', handleStorageChange)
    }
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader 
          title="Attendance Tracking" 
          description="Record and analyze your class attendance"
        />
        <WeeklyReportButton />
      </div>
      <Tabs defaultValue="academic-period" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="academic-period">Academic Period</TabsTrigger>
          <TabsTrigger value="record">Record Attendance</TabsTrigger>
          <TabsTrigger value="auto-marked">Auto-Marked</TabsTrigger>
          <TabsTrigger value="calculator">Attendance Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="academic-period" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <AcademicPeriodSelector />
          </div>
        </TabsContent>

        <TabsContent value="record" className="mt-6">
          <div className="max-w-6xl mx-auto">
            <VisualAttendanceForm />
          </div>
        </TabsContent>
        
        <TabsContent value="auto-marked" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <AutoMarkedAttendance />
          </div>
        </TabsContent>
        
        <TabsContent value="calculator" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceCalculator />
              <TargetAttendanceCalculator />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 