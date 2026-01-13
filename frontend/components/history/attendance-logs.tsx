"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Calendar, Clock, BookOpen, Filter, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO, getDay } from "date-fns"
import { fetchWithAuth } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AttendanceRecord {
  _id: string
  date: string
  subjectName: string
  status: "present" | "absent"
  classType?: string
  hasPreparatoryTag?: boolean
  timeDuration?: {
    startTime: string
    endTime: string
  }
  subject: {
    _id: string
    name: string
  }
}

interface ProcessedLog {
  date: string
  rawDate: Date
  dayOfWeek: string
  status: "present" | "partial" | "absent"
  subjects: {
    name: string
    status: "present" | "absent"
    classType?: string
    hasPreparatoryTag?: boolean
    timeDuration?: {
      startTime: string
      endTime: string
    }
  }[]
}

export function AttendanceLogs() {
  const [logs, setLogs] = useState<ProcessedLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ProcessedLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dayFilter, setDayFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [availableDays, setAvailableDays] = useState<string[]>([])

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  useEffect(() => {
    loadAttendanceLogs()
    
    // Listen for attendance upload events
    const handleAttendanceUpdate = () => {
      loadAttendanceLogs()
    }
    
    window.addEventListener('attendanceUpdated', handleAttendanceUpdate)
    
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate)
    }
  }, [])

  useEffect(() => {
    applyFilters()
  }, [dayFilter, statusFilter, logs])

  const applyFilters = () => {
    let filtered = [...logs]

    // Day filter
    if (dayFilter !== "all") {
      filtered = filtered.filter(log => log.dayOfWeek === dayFilter)
    }

    // Status filter - filter subjects within each day
    if (statusFilter !== "all") {
      if (statusFilter === "preparatory") {
        filtered = filtered.map(log => ({
          ...log,
          subjects: log.subjects.filter(s => s.hasPreparatoryTag)
        })).filter(log => log.subjects.length > 0)
      } else {
        filtered = filtered.map(log => ({
          ...log,
          subjects: log.subjects.filter(s => s.status === statusFilter)
        })).filter(log => log.subjects.length > 0)
      }
    }

    setFilteredLogs(filtered)
  }

  const loadAttendanceLogs = async () => {
    try {
      setIsLoading(true)
      
      const scheduleResponse = await fetchWithAuth('/schedule/current')
      const scheduleData = await scheduleResponse.json()
      const currentSchedule = scheduleData.data
      
      // Extract available days from schedule (excluding off days)
      if (currentSchedule?.schedule?.classes) {
        const scheduleDays = [...new Set(
          currentSchedule.schedule.classes.map((cls: any) => cls.day as string)
        )].filter((day): day is string => typeof day === 'string' && !currentSchedule.schedule.offDays?.includes(day))
        setAvailableDays(scheduleDays)
      }
      
      const response = await fetchWithAuth('/attendance/history')
      const data = await response.json()
      let records: AttendanceRecord[] = data.data || []
      
      if (currentSchedule?.startDate && currentSchedule?.endDate) {
        const startDate = new Date(currentSchedule.startDate)
        const endDate = new Date(currentSchedule.endDate)
        
        // Set to start/end of day to include full date range
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        
        records = records.filter(record => {
          const recordDate = new Date(record.date)
          return recordDate >= startDate && recordDate <= endDate
        })
      }
      
      if (records.length === 0) {
        setIsLoading(false)
        return
      }
      
      const groupedByDate = records.reduce<Record<string, AttendanceRecord[]>>((acc, record) => {
        const recordDate = new Date(record.date)
        const datePart = format(recordDate, 'yyyy-MM-dd')
        
        if (!acc[datePart]) {
          acc[datePart] = []
        }
        
        acc[datePart].push(record)
        return acc
      }, {})
      
      const processedLogs: ProcessedLog[] = Object.entries(groupedByDate).map(([dateKey, dayRecords]) => {
        const presentCount = dayRecords.filter(r => r.status === "present").length
        const totalCount = dayRecords.length
        
        let status: "present" | "partial" | "absent"
        
        if (presentCount === totalCount) {
          status = "present"
        } else if (presentCount === 0) {
          status = "absent"
        } else {
          status = "partial"
        }
        
        const subjects = dayRecords.map(record => ({
          name: record.subjectName,
          status: record.status,
          classType: record.classType,
          hasPreparatoryTag: record.hasPreparatoryTag,
          timeDuration: record.timeDuration
        }))
        
        const rawDate = parseISO(dateKey)
        const dayIndex = getDay(rawDate)
        const dayOfWeek = daysOfWeek[(dayIndex + 6) % 7]
        
        return {
          date: format(rawDate, "MMM d, yyyy"),
          rawDate,
          dayOfWeek,
          status,
          subjects
        }
      })
      
      processedLogs.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
      
      setLogs(processedLogs)
      setFilteredLogs(processedLogs)
    } catch (error) {
      console.error("Error loading attendance logs:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance logs",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Attendance Logs</CardTitle>
            <CardDescription>Recent attendance records</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAttendanceLogs}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {availableDays.map(day => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="preparatory">Preparatory</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="space-y-4 pr-2">
            {filteredLogs.map((log, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.date}</span>
                    <span className="text-xs text-muted-foreground">({log.dayOfWeek})</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      log.status === "present"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : log.status === "partial"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                    }`}
                  >
                    {log.status === "present" ? "All Present" : log.status === "partial" ? "Partial" : "All Absent"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {log.subjects.map((subject, subIndex) => (
                    <div key={subIndex} className={`flex items-center justify-between text-sm border-l-2 pl-2 py-1 ${
                      subject.status === "present" ? "border-green-500" : "border-red-500"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {subject.status === "present" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-medium">{subject.name}</span>
                        {subject.hasPreparatoryTag && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                            PREP
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                        {subject.classType && subject.classType !== 'none' && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span className="uppercase">{subject.classType}</span>
                          </div>
                        )}
                        {subject.timeDuration?.startTime && subject.timeDuration?.endTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{subject.timeDuration.startTime} - {subject.timeDuration.endTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No attendance records found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {dayFilter !== "all" || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Start marking your attendance to see logs here"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
