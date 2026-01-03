"use client"

import { useEffect, useState } from "react"
import { VisualAttendanceForm } from "@/components/attendance/visual-attendance-form"
import { AttendanceCalculator } from "@/components/attendance/attendance-calculator"
import { TargetAttendanceCalculator } from "@/components/attendance/target-attendance-calculator"
import { AutoMarkedAttendance } from "@/components/dashboard/auto-marked-attendance"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFromLocalStorage } from "@/lib/storage-utils"

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
  const [activeTab, setActiveTab] = useState("record")

  // Load saved records from localStorage and check URL parameters
  useEffect(() => {
    const loadedRecords = getFromLocalStorage<AttendanceRecord[]>('attendance_records', [])
    setRecords(loadedRecords)
    
    // Handle tab from URL parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      
      if (tabParam && ['record', 'auto-marked', 'calculator'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else {
        setActiveTab('record');
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
    <div className="container mx-auto py-2 h-screen flex flex-col overflow-hidden">
      <div className="container py-6"></div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="record" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="container">
            <TabsList className="w-full max-w-3xl mx-auto grid grid-cols-3 flex-shrink-0">
              <TabsTrigger value="record">Record Attendance</TabsTrigger>
              <TabsTrigger value="auto-marked">Auto-Marked</TabsTrigger>
              <TabsTrigger value="calculator">Attendance Calculator</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 overflow-y-auto mt-6">
            <div className="container pb-6">
              <TabsContent value="record" className="mt-0 flex-1 min-h-0 overflow-hidden">
                <div className="max-w-6xl mx-auto h-full">
                  <VisualAttendanceForm />
                </div>
              </TabsContent>
              
              <TabsContent value="auto-marked" className="mt-0 flex-1 min-h-0 overflow-hidden">
                <div className="max-w-4xl mx-auto h-full">
                  <AutoMarkedAttendance />
                </div>
              </TabsContent>
              
              <TabsContent value="calculator" className="mt-0 flex-1 min-h-0 overflow-hidden">
                <div className="max-w-4xl mx-auto h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    <AttendanceCalculator />
                    <TargetAttendanceCalculator />
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 