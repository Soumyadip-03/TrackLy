"use client"

import { useEffect, useState } from "react"
import { RecordAttendance } from "@/components/attendance/record-attendance"
import { AttendanceOnAbsenceCalculator } from "@/components/attendance/attendance-on-absence-calculator"
import { TargetAttendanceCalculator } from "@/components/attendance/target-attendance-calculator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFromLocalStorage } from "@/lib/storage-utils"

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

  useEffect(() => {
    const loadedRecords = getFromLocalStorage<AttendanceRecord[]>('attendance_records', [])
    setRecords(loadedRecords)
    
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      
      if (tabParam && ['record', 'calculator'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else {
        setActiveTab('record');
      }
    }
    
    const handleStorageChange = () => {
      const updatedRecords = getFromLocalStorage<AttendanceRecord[]>('attendance_records', [])
      setRecords(updatedRecords)
    }
    
    window.addEventListener('storage', handleStorageChange)
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
            <TabsList className="w-full max-w-3xl mx-auto grid grid-cols-2 flex-shrink-0">
              <TabsTrigger value="record">Record Attendance</TabsTrigger>
              <TabsTrigger value="calculator">Attendance Calculator</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 overflow-y-auto mt-6">
            <div className="container pb-6">
              <TabsContent value="record" className="mt-0 flex-1 min-h-0 overflow-hidden">
                <div className="max-w-6xl mx-auto h-full">
                  <RecordAttendance />
                </div>
              </TabsContent>
              
              <TabsContent value="calculator" className="mt-0 flex-1 min-h-0 overflow-hidden">
                <div className="max-w-7xl mx-auto h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    <AttendanceOnAbsenceCalculator />
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