"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  parseISO,
  isWithinInterval,
  subMonths,
  startOfMonth,
  endOfMonth,
  formatISO,
} from "date-fns"
import { AlertCircle } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { subjectService } from "@/lib/services/subject-service"
import { toast } from "@/components/ui/use-toast"

interface AttendanceRecord {
  _id?: string
  date: string
  subjectName: string
  status: "present" | "absent"
  classType?: string
  subject: {
    _id?: string
    name: string
  }
}

interface Subject {
  _id?: string
  name: string
  code: string
  classType?: string
}

interface WeeklyData {
  name: string
  attendance: number
  weekStart: string
}

interface MonthlyData {
  name: string
  attendance: number
  monthStart: string
}

interface SubjectData {
  [key: string]: any
}

export function AttendanceReport() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [subjectData, setSubjectData] = useState<SubjectData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    loadAttendanceData()
  }, [])

  const loadAttendanceData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch attendance from database
      const attResponse = await fetchWithAuth('/attendance/history')
      const attData = await attResponse.json()
      const allRecords: AttendanceRecord[] = attData.data || []
      
      if (allRecords.length === 0) {
        setHasData(false)
        setIsLoading(false)
        return
      }
      
      setHasData(true)
      
      // Fetch subjects from database
      const subjects = await subjectService.getAll()
      
      // Convert dates and sort
      const recordsWithDates = allRecords.map(record => ({
        ...record,
        dateObj: parseISO(record.date)
      })).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      
      if (recordsWithDates.length === 0) {
        setHasData(false)
        setIsLoading(false)
        return
      }
      
      const oldestDate = recordsWithDates[0].dateObj
      const now = new Date()
      
      // Calculate charts data
      const weeklyAttendance = calculateWeeklyAttendance(recordsWithDates, oldestDate, now)
      setWeeklyData(weeklyAttendance)
      
      const monthlyAttendance = calculateMonthlyAttendance(recordsWithDates, oldestDate, now)
      setMonthlyData(monthlyAttendance)
      
      const subjectAttendance = calculateSubjectAttendance(recordsWithDates, subjects)
      setSubjectData(subjectAttendance)
      
    } catch (error) {
      console.error("Error loading attendance data:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const calculateWeeklyAttendance = (
    records: (AttendanceRecord & { dateObj: Date })[], 
    startDate: Date, 
    endDate: Date
  ): WeeklyData[] => {
    let weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 })
    
    if (weeks.length > 12) {
      weeks = weeks.slice(-12)
    }
    
    return weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      
      const weekRecords = records.filter(record => 
        isWithinInterval(record.dateObj, { start: weekStart, end: weekEnd })
      )
      
      const totalRecords = weekRecords.length
      const presentRecords = weekRecords.filter(record => record.status === "present").length
      const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0
      
      return {
        name: `Week ${index + 1}`,
        attendance: attendancePercentage,
        weekStart: formatISO(weekStart)
      }
    }).filter(week => {
      const weekEnd = endOfWeek(parseISO(week.weekStart), { weekStartsOn: 1 })
      return records.some(r => isWithinInterval(r.dateObj, { start: parseISO(week.weekStart), end: weekEnd }))
    })
  }
  
  const calculateMonthlyAttendance = (
    records: (AttendanceRecord & { dateObj: Date })[], 
    startDate: Date, 
    endDate: Date
  ): MonthlyData[] => {
    const sixMonthsAgo = subMonths(endDate, 6)
    const startMonth = startDate < sixMonthsAgo ? sixMonthsAgo : startDate
    const months = eachMonthOfInterval({ start: startMonth, end: endDate })
    
    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart)
      
      const monthRecords = records.filter(record => 
        isWithinInterval(record.dateObj, { start: monthStart, end: monthEnd })
      )
      
      const totalRecords = monthRecords.length
      const presentRecords = monthRecords.filter(record => record.status === "present").length
      const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0
      
      return {
        name: format(monthStart, "MMM"),
        attendance: attendancePercentage,
        monthStart: formatISO(monthStart)
      }
    }).filter(month => {
      const monthEnd = endOfMonth(parseISO(month.monthStart))
      return records.some(r => isWithinInterval(r.dateObj, { start: parseISO(month.monthStart), end: monthEnd }))
    })
  }
  
  const calculateSubjectAttendance = (
    records: (AttendanceRecord & { dateObj: Date })[], 
    subjects: Subject[]
  ): SubjectData[] => {
    const subjectMap = new Map<string, { name: string, classType: string, present: number, total: number }>()
    
    records.forEach(record => {
      const subject = subjects.find(s => s.name === record.subjectName)
      const classType = record.classType || subject?.classType || 'none'
      const key = `${record.subjectName}_${classType}`
      
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          name: record.subjectName,
          classType: classType,
          present: 0,
          total: 0
        })
      }
      
      const data = subjectMap.get(key)!
      data.total++
      if (record.status === 'present') {
        data.present++
      }
    })
    
    return Array.from(subjectMap.values()).map(data => {
      const percentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      
      let displayName = data.name
      if (data.classType && data.classType !== 'none') {
        const typeMap: { [key: string]: string } = {
          'lecture': 'LEC',
          'lab': 'LAB',
          'theory': 'T',
          'practical': 'P',
          'tutorial': 'TUT'
        }
        const typeAbbr = typeMap[data.classType.toLowerCase()] || data.classType.substring(0, 3).toUpperCase()
        displayName = `${data.name} [${typeAbbr}]`
      }
      
      return {
        name: displayName,
        attendance: percentage
      }
    })
  }

  const EmptyStateMessage = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
      <h3 className="text-lg font-medium mb-2">No Attendance Data</h3>
      <p className="text-sm text-muted-foreground">
        Start marking your attendance to see your trends over time.
      </p>
    </div>
  )

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : hasData ? (
          <Tabs defaultValue="weekly">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="subjects">By Subject</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="h-[500px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Attendance"]}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      borderRadius: "0.5rem",
                      padding: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    name="Attendance"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="monthly" className="h-[500px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Attendance"]}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      borderRadius: "0.5rem",
                      padding: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    name="Attendance"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="subjects" className="h-[500px] mt-4">
              {subjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={subjectData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100} 
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Attendance"]}
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                        borderRadius: "0.5rem",
                        padding: "0.5rem",
                      }}
                    />
                    <Line type="monotone" dataKey="attendance" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">Not enough subject data to display trends</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyStateMessage />
        )}
      </CardContent>
    </Card>
  )
}
