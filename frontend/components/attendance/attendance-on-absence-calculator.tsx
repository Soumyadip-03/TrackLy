"use client"

import { useState, useEffect } from "react"
import { format, eachDayOfInterval, isSameDay } from "date-fns"
import { Calculator, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchWithAuth } from "@/lib/api"
import { MultiDatePicker } from "./multi-date-picker"

interface Subject {
  _id: string
  name: string
  code?: string
  classType: string
  attendedClasses: number
  totalClasses: number
}

interface ScheduleClass {
  id: string
  subjectId: string
  day: string
  subject: string
  classType: string
  startTime: string
  endTime: string
}

interface Holiday {
  date: string
  reason?: string
}

interface AttendanceStats {
  overall: {
    percentage: number
    attendedClasses: number
    totalClasses: number
  }
  subjects: Array<{
    _id: string
    name: string
    classType: string
    percentage: number
    attendedClasses: number
    totalClasses: number
  }>
}

interface SubjectSelections {
  [date: string]: {
    [subjectKey: string]: "present" | "absent"
  }
}

export function AttendanceOnAbsenceCalculator() {
  const [absentDates, setAbsentDates] = useState<Date[]>([])
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceStats | null>(null)
  const [schedule, setSchedule] = useState<ScheduleClass[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [offDays, setOffDays] = useState<string[]>([])
  const [calculatedResult, setCalculatedResult] = useState<AttendanceStats | null>(null)
  const [dateList, setDateList] = useState<string[]>([])
  const [currentDateIndex, setCurrentDateIndex] = useState(0)
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelections>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, scheduleRes, holidaysRes] = await Promise.all([
        fetchWithAuth("/attendance/stats"),
        fetchWithAuth("/schedule/current"),
        fetchWithAuth("/holidays")
      ])

      const statsData = await statsRes.json()
      const scheduleData = await scheduleRes.json()
      const holidaysData = await holidaysRes.json()

      if (statsData.success) {
        setCurrentAttendance(statsData.data)
      }

      if (scheduleData.success && scheduleData.data) {
        setSchedule(scheduleData.data.schedule?.classes || [])
        setOffDays(scheduleData.data.schedule?.offDays || [])
      }

      if (holidaysData.success) {
        setHolidays(holidaysData.data || [])
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setLoading(false)
    }
  }

  const isHolidayDate = (date: Date): boolean => {
    return holidays.some(h => {
      const holidayDate = new Date(h.date)
      return holidayDate.getDate() === date.getDate() &&
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getFullYear() === date.getFullYear()
    })
  }

  const isOffDay = (date: Date): boolean => {
    const dayName = format(date, "EEEE")
    return offDays.includes(dayName)
  }

  const getSubjectsForDay = (date: Date): ScheduleClass[] => {
    const dayName = format(date, "EEEE")
    return schedule.filter(cls => cls.day === dayName)
  }

  const checkTodayAttendanceUploaded = async (): Promise<boolean> => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = format(today, "yyyy-MM-dd")

      const scheduledSubjects = getSubjectsForDay(today)
      
      if (scheduledSubjects.length === 0) return false

      const response = await fetchWithAuth(`/attendance/range?startDate=${todayStr}&endDate=${todayStr}`)
      const data = await response.json()

      if (data.success) {
        const uploadedCount = data.data?.length || 0
        return uploadedCount >= scheduledSubjects.length
      }
      return false
    } catch (error) {
      console.error("Error checking today's attendance:", error)
      return false
    }
  }

  const handleAbsentDatesChange = async (dates: Date[]) => {
    setAbsentDates(dates)

    if (dates.length === 0) {
      setDateList([])
      setSubjectSelections({})
      setCalculatedResult(null)
      setCurrentDateIndex(0)
      return
    }

    const lastAbsentDate = new Date(Math.max(...dates.map(d => d.getTime())))
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const isTodayUploaded = await checkTodayAttendanceUploaded()

    const allDates = eachDayOfInterval({ start: today, end: lastAbsentDate })

    const validDates = allDates.filter(date => {
      if (isHolidayDate(date) || isOffDay(date)) return false
      if (isSameDay(date, today) && isTodayUploaded) return false
      return true
    })

    const dateStrings = validDates.map(d => format(d, "yyyy-MM-dd"))
    setDateList(dateStrings)
    setCurrentDateIndex(0)

    const selections: SubjectSelections = {}
    dateStrings.forEach(dateStr => {
      const date = new Date(dateStr)
      const subjects = getSubjectsForDay(date)
      const isAbsent = dates.some(d => isSameDay(d, date))

      selections[dateStr] = {}
      subjects.forEach(subject => {
        const subjectKey = `${subject.subject}|||${subject.classType}|||${subject.startTime}|||${subject.endTime}`
        selections[dateStr][subjectKey] = isAbsent ? "absent" : "present"
      })
    })

    setSubjectSelections(selections)
  }

  const toggleSubjectStatus = (subjectKey: string, status: "present" | "absent") => {
    const currentDate = dateList[currentDateIndex]
    if (!currentDate) return

    setSubjectSelections(prev => ({
      ...prev,
      [currentDate]: {
        ...prev[currentDate],
        [subjectKey]: status
      }
    }))
  }

  const handleCalculate = () => {
    if (!currentAttendance) return

    const tempStats: Record<string, { present: number; total: number; name: string; classType: string }> = {}

    currentAttendance.subjects.forEach(subject => {
      const key = `${subject.name}|||${subject.classType}`
      tempStats[key] = {
        present: subject.attendedClasses,
        total: subject.totalClasses,
        name: subject.name,
        classType: subject.classType
      }
    })

    Object.entries(subjectSelections).forEach(([date, subjects]) => {
      Object.entries(subjects).forEach(([subjectKey, status]) => {
        const parts = subjectKey.split("|||")
        const name = parts[0]
        const classType = parts[1]
        const matchKey = `${name}|||${classType}`

        if (!tempStats[matchKey]) {
          tempStats[matchKey] = { present: 0, total: 0, name, classType }
        }

        if (status === "present") {
          tempStats[matchKey].present += 1
          tempStats[matchKey].total += 1
        } else {
          tempStats[matchKey].total += 1
        }
      })
    })

    let totalPresent = 0
    let totalClasses = 0
    const subjectResults: AttendanceStats["subjects"] = []

    currentAttendance.subjects.forEach((subject, index) => {
      const key = `${subject.name}|||${subject.classType}`
      const stats = tempStats[key]
      
      if (stats) {
        const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
        totalPresent += stats.present
        totalClasses += stats.total

        subjectResults.push({
          _id: subject._id || `${key}_${index}`,
          name: stats.name,
          classType: stats.classType,
          percentage,
          attendedClasses: stats.present,
          totalClasses: stats.total
        })
      }
    })

    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0

    setCalculatedResult({
      overall: {
        percentage: overallPercentage,
        attendedClasses: totalPresent,
        totalClasses
      },
      subjects: subjectResults
    })
  }

  if (loading) {
    return (
      <Card className="overflow-hidden flex flex-col h-full">
        <CardHeader className="flex-shrink-0 py-3">
          <CardTitle className="text-lg flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Attendance on Absence Calculator
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const currentDate = dateList[currentDateIndex]
  const currentSubjects = currentDate ? getSubjectsForDay(new Date(currentDate)) : []

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <CardHeader className="flex-shrink-0 py-3">
        <CardTitle className="text-xl flex items-center whitespace-nowrap">
          <Calculator className="mr-2 h-5 w-5" />
          Attendance on Absence Calculator
        </CardTitle>
        <CardDescription>Calculate your attendance based on future absences</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col p-4 space-y-3">
        {dateList.length === 0 && (
          <div className="border-2 border-amber-600/50 rounded-lg p-4 bg-gradient-to-br from-amber-950/40 to-amber-900/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                <span className="text-amber-500 text-xs font-bold">i</span>
              </div>
              <div className="text-base font-semibold text-amber-500">How it works</div>
            </div>
            <ul className="text-xs text-amber-200/90 leading-relaxed space-y-1 list-disc list-inside">
              <li>Select the dates you plan to be absent using the calendar</li>
              <li>Navigate through each date to mark subjects as Present or Absent</li>
              <li>Click Calculate to see your projected attendance percentage</li>
              <li>Compare your current vs calculated attendance stats</li>
            </ul>
          </div>
        )}

        <div>
          <MultiDatePicker
            selectedDates={absentDates}
            onDatesChange={handleAbsentDatesChange}
            minDate={new Date()}
          />
        </div>

        {dateList.length > 0 && (
          <>
            <div className="border rounded-md p-2 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDateIndex(prev => Math.max(0, prev - 1))}
                disabled={currentDateIndex === 0}
                className="h-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {currentDate && format(new Date(currentDate), "MMM dd, yyyy")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDateIndex(prev => Math.min(dateList.length - 1, prev + 1))}
                disabled={currentDateIndex === dateList.length - 1}
                className="h-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSubjects.map(subject => {
                    const subjectKey = `${subject.subject}|||${subject.classType}|||${subject.startTime}|||${subject.endTime}`
                    const status = subjectSelections[currentDate]?.[subjectKey]

                    return (
                      <TableRow key={subject.id}>
                        <TableCell className="text-xs">
                          <div className="font-medium">{subject.subject}</div>
                          <div className="text-muted-foreground capitalize">{subject.classType}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {subject.startTime} - {subject.endTime}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant={status === "present" ? "default" : "outline"}
                              onClick={() => toggleSubjectStatus(subjectKey, "present")}
                              className="h-7 text-xs"
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={status === "absent" ? "destructive" : "outline"}
                              onClick={() => toggleSubjectStatus(subjectKey, "absent")}
                              className="h-7 text-xs"
                            >
                              Absent
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <Button onClick={handleCalculate} className="w-full h-8 text-xs">
              <Calculator className="mr-2 h-3 w-3" />
              Calculate
            </Button>
          </>
        )}

        {calculatedResult && currentAttendance && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="border rounded-md p-2">
              <div className="text-xs font-medium text-muted-foreground mb-1">Current</div>
              <div className="text-2xl font-bold">{currentAttendance.overall.percentage}%</div>
              <div className="text-xs text-muted-foreground">
                {currentAttendance.overall.attendedClasses}/{currentAttendance.overall.totalClasses}
              </div>
            </div>
            <div className="border rounded-md p-2">
              <div className="text-xs font-medium text-muted-foreground mb-1">Calculated</div>
              <div className="text-2xl font-bold">{calculatedResult.overall.percentage}%</div>
              <div className="text-xs text-muted-foreground">
                {calculatedResult.overall.attendedClasses}/{calculatedResult.overall.totalClasses}
              </div>
            </div>
            <div className="col-span-2 max-h-32 overflow-y-auto border rounded-md p-2">
              <div className="text-sm font-medium mb-1">Subject Breakdown</div>
              {calculatedResult.subjects.map((subject, index) => (
                <div key={`${subject._id}_${index}`} className="flex justify-between text-xs py-1">
                  <span>{subject.name} ({subject.classType})</span>
                  <span className={subject.percentage >= 75 ? "text-green-600" : "text-red-600"}>
                    {subject.percentage}% ({subject.attendedClasses}/{subject.totalClasses})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
