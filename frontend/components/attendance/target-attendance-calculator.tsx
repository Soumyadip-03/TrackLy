"use client"

import { useState, useEffect } from "react"
import { format, eachDayOfInterval, isSameDay } from "date-fns"
import { Calculator, ChevronRight, AlertCircle, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { fetchWithAuth } from "@/lib/api"

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

interface CalculationResult {
  daysNeeded: number
  totalAttended: number
  totalClasses: number
  currentPercentage: number
  finalPercentage: number
  targetReached: boolean
  currentAttended: number
  currentTotal: number
}

export function TargetAttendanceCalculator() {
  const [calculatorType, setCalculatorType] = useState<"overall" | "per-subject">("overall")
  const [targetPercentage, setTargetPercentage] = useState<number>(75)
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceStats | null>(null)
  const [schedule, setSchedule] = useState<ScheduleClass[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [offDays, setOffDays] = useState<string[]>([])
  const [academicEndDate, setAcademicEndDate] = useState<Date | null>(null)
  
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
        if (scheduleData.data.endDate) {
          setAcademicEndDate(new Date(scheduleData.data.endDate))
        }
      }

      if (holidaysData.success) {
        setHolidays(holidaysData.data || [])
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setIsLoading(false)
    }
  }

  const handleCalculate = () => {
    setCalculating(true)
    setTimeout(() => {
      if (calculatorType === "overall") {
        calculateOverallTarget(targetPercentage)
      } else {
        calculateSubjectTarget(selectedSubject, targetPercentage)
      }
      setCalculating(false)
    }, 800)
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

  const getClassesForDay = (date: Date): number => {
    const dayName = format(date, "EEEE")
    return schedule.filter(cls => cls.day === dayName).length
  }

  const checkTodayAttendanceUploaded = async (): Promise<boolean> => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = format(today, "yyyy-MM-dd")

      const scheduledCount = getClassesForDay(today)
      if (scheduledCount === 0) return false

      const response = await fetchWithAuth(`/attendance/range?startDate=${todayStr}&endDate=${todayStr}`)
      const data = await response.json()

      if (data.success) {
        const uploadedCount = data.data?.length || 0
        return uploadedCount >= scheduledCount
      }
      return false
    } catch (error) {
      console.error("Error checking today's attendance:", error)
      return false
    }
  }

  const calculateOverallTarget = async (target: number) => {
    if (!currentAttendance || !academicEndDate) return

    const currentAttended = currentAttendance.overall.attendedClasses
    const currentTotal = currentAttendance.overall.totalClasses
    const currentPercentage = currentAttendance.overall.percentage

    if (currentPercentage >= target) {
      setResult({
        daysNeeded: 0,
        totalAttended: 0,
        totalClasses: 0,
        currentPercentage,
        finalPercentage: currentPercentage,
        targetReached: true,
        currentAttended,
        currentTotal
      })
      return
    }

    const isTodayUploaded = await checkTodayAttendanceUploaded()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = isTodayUploaded ? new Date(today.getTime() + 86400000) : today

    const allDates = eachDayOfInterval({ start: startDate, end: academicEndDate })
    const validDays = allDates.filter(date => !isHolidayDate(date) && !isOffDay(date))

    let tempAttended = currentAttended
    let tempTotal = currentTotal
    let daysCount = 0
    let totalClassesAdded = 0
    let totalAttendedAdded = 0

    for (const day of validDays) {
      const classCount = getClassesForDay(day)
      if (classCount === 0) continue

      tempTotal += classCount
      totalClassesAdded += classCount

      const needed = Math.ceil((target / 100) * tempTotal - tempAttended)
      const toAttend = Math.min(needed, classCount)

      tempAttended += toAttend
      totalAttendedAdded += toAttend
      daysCount += 1

      const newPercentage = (tempAttended / tempTotal) * 100

      if (newPercentage >= target) {
        setResult({
          daysNeeded: daysCount,
          totalAttended: totalAttendedAdded,
          totalClasses: totalClassesAdded,
          currentPercentage,
          finalPercentage: Math.round(newPercentage * 10) / 10,
          targetReached: true,
          currentAttended,
          currentTotal
        })
        return
      }
    }

    setResult({
      daysNeeded: daysCount,
      totalAttended: totalAttendedAdded,
      totalClasses: totalClassesAdded,
      currentPercentage,
      finalPercentage: Math.round((tempAttended / tempTotal) * 1000) / 10,
      targetReached: false,
      currentAttended,
      currentTotal
    })
  }

  const calculateSubjectTarget = async (subjectId: string, target: number) => {
    if (!currentAttendance || !academicEndDate) return

    const subject = currentAttendance.subjects.find(s => s._id === subjectId)
    if (!subject) return

    const currentAttended = subject.attendedClasses
    const currentTotal = subject.totalClasses
    const currentPercentage = subject.percentage

    if (currentPercentage >= target) {
      setResult({
        daysNeeded: 0,
        totalAttended: 0,
        totalClasses: 0,
        currentPercentage,
        finalPercentage: currentPercentage,
        targetReached: true,
        currentAttended,
        currentTotal
      })
      return
    }

    const isTodayUploaded = await checkTodayAttendanceUploaded()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = isTodayUploaded ? new Date(today.getTime() + 86400000) : today

    const allDates = eachDayOfInterval({ start: startDate, end: academicEndDate })
    const validDays = allDates.filter(date => !isHolidayDate(date) && !isOffDay(date))

    let tempAttended = currentAttended
    let tempTotal = currentTotal
    let daysCount = 0
    let totalClassesAdded = 0
    let totalAttendedAdded = 0

    for (const day of validDays) {
      const dayName = format(day, "EEEE")
      const subjectClasses = schedule.filter(cls => cls.day === dayName && cls.subject === subject.name).length
      
      if (subjectClasses === 0) continue

      tempTotal += subjectClasses
      totalClassesAdded += subjectClasses

      const needed = Math.ceil((target / 100) * tempTotal - tempAttended)
      const toAttend = Math.min(needed, subjectClasses)

      tempAttended += toAttend
      totalAttendedAdded += toAttend
      daysCount += 1

      const newPercentage = (tempAttended / tempTotal) * 100

      if (newPercentage >= target) {
        setResult({
          daysNeeded: daysCount,
          totalAttended: totalAttendedAdded,
          totalClasses: totalClassesAdded,
          currentPercentage,
          finalPercentage: Math.round(newPercentage * 10) / 10,
          targetReached: true,
          currentAttended,
          currentTotal
        })
        return
      }
    }

    setResult({
      daysNeeded: daysCount,
      totalAttended: totalAttendedAdded,
      totalClasses: totalClassesAdded,
      currentPercentage,
      finalPercentage: Math.round((tempAttended / tempTotal) * 1000) / 10,
      targetReached: false,
      currentAttended,
      currentTotal
    })
  }



  if (isLoading) {
    return (
      <Card className="overflow-hidden flex flex-col h-full">
        <CardHeader className="flex-shrink-0 py-3">
          <CardTitle className="text-xl flex items-center whitespace-nowrap">
            <Target className="mr-2 h-5 w-5" />
            Target Attendance Calculator
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  if (!currentAttendance || currentAttendance.subjects.length === 0) {
    return (
      <Card className="overflow-hidden flex flex-col h-full">
        <CardHeader className="flex-shrink-0 py-3">
          <CardTitle className="text-xl flex items-center whitespace-nowrap">
            <Target className="mr-2 h-5 w-5" />
            Target Attendance Calculator
          </CardTitle>
          <CardDescription>Calculate classes needed to reach your target attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No subjects found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <CardHeader className="flex-shrink-0 py-3">
        <CardTitle className="text-xl flex items-center whitespace-nowrap">
          <Target className="mr-2 h-5 w-5" />
          Target Attendance Calculator
        </CardTitle>
        <CardDescription>Calculate classes needed to reach your target attendance</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="overall" onValueChange={(value) => { setCalculatorType(value as any); setResult(null); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger
              value="overall"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Overall Target
            </TabsTrigger>
            <TabsTrigger
              value="per-subject"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Subject Target
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="p-6 space-y-4 animate-in fade-in-50">
            <div className="space-y-2">
              <Label htmlFor="target-percentage" className="text-base">
                Target Attendance Percentage
              </Label>
              <div className="space-y-2">
                <Slider
                  id="target-percentage"
                  min={50}
                  max={100}
                  step={1}
                  value={[targetPercentage]}
                  onValueChange={(value) => setTargetPercentage(value[0])}
                  className="py-4"
                />
                <div className="flex justify-between items-center">
                  <Input
                    type="number"
                    min={50}
                    max={100}
                    value={targetPercentage}
                    onChange={(e) => setTargetPercentage(Number(e.target.value))}
                    className="w-20 h-8"
                  />
                  <span className="text-sm font-medium text-primary">{targetPercentage}%</span>
                </div>
              </div>
            </div>

            <Alert className="border-2 border-amber-600/50 rounded-lg bg-gradient-to-br from-amber-950/40 to-amber-900/20">
              <AlertTitle className="text-amber-500 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                  <span className="text-amber-500 text-xs font-bold">i</span>
                </div>
                <span className="text-base font-semibold">How it works</span>
              </AlertTitle>
              <AlertDescription className="text-xs text-amber-200/90 leading-relaxed mt-2">
                Set your target attendance percentage. The calculator will show how many consecutive days you need to attend to reach this target based on your current attendance record.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
              onClick={handleCalculate}
              disabled={calculating}
            >
              {calculating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Calculating...</span>
                </div>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="per-subject" className="p-6 space-y-4 animate-in fade-in-50">
            <div className="space-y-2">
              <Label htmlFor="subject-select" className="text-base">
                Select Subject
              </Label>
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {currentAttendance.subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.classType})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-percentage-subject" className="text-base">
                Target Attendance Percentage
              </Label>
              <div className="space-y-2">
                <Slider
                  id="target-percentage-subject"
                  min={50}
                  max={100}
                  step={1}
                  value={[targetPercentage]}
                  onValueChange={(value) => setTargetPercentage(value[0])}
                  className="py-4"
                />
                <div className="flex justify-between items-center">
                  <Input
                    type="number"
                    min={50}
                    max={100}
                    value={targetPercentage}
                    onChange={(e) => setTargetPercentage(Number(e.target.value))}
                    className="w-20 h-8"
                  />
                  <span className="text-sm font-medium text-primary">{targetPercentage}%</span>
                </div>
              </div>
            </div>

            <Alert className="border-2 border-amber-600/50 rounded-lg bg-gradient-to-br from-amber-950/40 to-amber-900/20">
              <AlertTitle className="text-amber-500 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                  <span className="text-amber-500 text-xs font-bold">i</span>
                </div>
                <span className="text-base font-semibold">How it works</span>
              </AlertTitle>
              <AlertDescription className="text-xs text-amber-200/90 leading-relaxed mt-2">
                Select a subject and set your target attendance percentage. The calculator will show how many consecutive days you need to attend for this specific subject to reach your target.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
              onClick={handleCalculate}
              disabled={!selectedSubject || calculating}
            >
              {calculating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Calculating...</span>
                </div>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="p-6 pt-0">
            <Separator className="my-4" />
            <div className="space-y-4">
              <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                <AlertTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  {result.daysNeeded === 0 ? "🎉 Target Already Achieved!" : result.targetReached ? "✅ Target Achievable!" : "⚠️ Target Not Achievable"}
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-3">
                    {result.daysNeeded === 0 ? (
                      <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-4">
                        <p className="text-green-700 dark:text-green-400 mt-2">
                          Your current attendance of {result.currentPercentage}% already meets your target of {targetPercentage}%.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-100 dark:bg-blue-900/20 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            You need to attend {result.daysNeeded} consecutive days
                          </h4>
                          <ul className="text-blue-700 dark:text-blue-400 mt-2 space-y-1 text-sm">
                            <li>• Attend {result.totalAttended} classes out of {result.totalClasses} total classes</li>
                            <li>• Current: {result.currentPercentage}% ({result.currentAttended}/{result.currentTotal})</li>
                            <li>• After: {result.finalPercentage}% ({result.currentAttended + result.totalAttended}/{result.currentTotal + result.totalClasses})</li>
                            <li>• Target: {targetPercentage}%</li>
                          </ul>
                        </div>
                        {!result.targetReached && (
                          <div className="bg-amber-100 dark:bg-amber-900/20 rounded-lg p-3">
                            <p className="text-amber-800 dark:text-amber-300 text-sm">
                              Target not achievable within academic period. Showing maximum possible attendance.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 