"use client"

import { useState, useEffect } from "react"
import { addDays, format } from "date-fns"
import { Calculator, Calendar, ChevronRight, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MultiDateSubjectSelector } from "./multi-date-subject-selector"
import { cn } from "@/lib/utils"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { isHoliday, isOffDay, generateAutoPresentRecords } from "@/lib/attendance-utils"

interface Subject {
  id: string;
  name: string;
  code?: string;
}

interface AttendanceRecord {
  date: string;
  subject: string;
  status: "present" | "absent";
}

export function AttendanceCalculator() {
  const [calculatorType, setCalculatorType] = useState<"whole-day" | "per-subject">("whole-day")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [multiDateSelection, setMultiDateSelection] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<{ overall: number; subjects: Record<string, number> } | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])

  // Load subjects and attendance records from localStorage
  useEffect(() => {
    const loadData = () => {
      const savedSubjects = getFromLocalStorage<Subject[]>('subjects', []);
      const savedAttendance = getFromLocalStorage<AttendanceRecord[]>('attendance', []);
      
      setSubjects(savedSubjects);
      setAttendanceRecords(savedAttendance);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  const handleCalculate = () => {
    // Show calculating state
    setCalculating(true)

    // Set a short timeout to simulate processing
    setTimeout(() => {
      if (calculatorType === "whole-day") {
        // Calculate attendance if student is absent for the whole selected day
        calculateWholeDayAbsence(selectedDate);
      } else {
        // Calculate based on multi-date subject selection
        calculateMultiDateSubjectAbsence(multiDateSelection);
      }

      setCalculating(false)
    }, 800)
  }

  // Calculate attendance if a student is absent for a whole day
  const calculateWholeDayAbsence = (absentDate: string) => {
    // Get existing attendance data
    const currentAttendance = calculateCurrentAttendance();
    
    // Find subjects scheduled for the selected date
    // This would typically come from a schedule, but we'll use a simplified approach
    const subjectsForSelectedDate = subjects.map(s => s.id);
    
    // Create a copy of the current attendance records
    const simulatedAttendance = { ...currentAttendance };
    
    // For each subject scheduled on that day, simulate an absence
    subjectsForSelectedDate.forEach(subjectId => {
      if (simulatedAttendance[subjectId]) {
        // Increment absent count for this subject
        simulatedAttendance[subjectId].absent += 1;
        
        // Total count remains the same since we're just changing a present to absent
        // But if this is a new day, we'd increment the total too
        simulatedAttendance[subjectId].total += 1;
      }
    });
    
    // Calculate percentages based on the simulated attendance
    const result = calculateAttendancePercentages(simulatedAttendance);
    setResult(result);
  }

  // Calculate attendance based on selected subjects on multiple dates
  const calculateMultiDateSubjectAbsence = (selection: Record<string, string[]>) => {
    // Get existing attendance data
    const currentAttendance = calculateCurrentAttendance();
    
    // Create a copy of the current attendance
    const simulatedAttendance = { ...currentAttendance };
    
    // For each date and selected subjects, simulate absences
    Object.entries(selection).forEach(([date, subjectIds]) => {
      subjectIds.forEach(subjectId => {
        if (simulatedAttendance[subjectId]) {
          // Increment absent count for this subject
          simulatedAttendance[subjectId].absent += 1;
          
          // Increment total count since this is a new class
          simulatedAttendance[subjectId].total += 1;
        } else {
          // Initialize if this subject doesn't exist yet
          simulatedAttendance[subjectId] = { present: 0, absent: 1, total: 1 };
        }
      });
    });
    
    // Calculate percentages based on the simulated attendance
    const result = calculateAttendancePercentages(simulatedAttendance);
    setResult(result);
  }

  // Calculate current attendance from attendance records with auto-present functionality
  const calculateCurrentAttendance = () => {
    const attendance: Record<string, { present: number; absent: number; total: number }> = {};
    
    // Get attendance records with auto-present for past unmarked days
    const allRecords = generateAutoPresentRecords();
    
    // Process attendance records, filtering out holidays and off days
    allRecords
      .filter(record => {
        // Skip records for holidays or off days
        return !isHoliday(record.date) && !isOffDay(record.date);
      })
      .forEach(record => {
        // Map from the subjectId to subject for compatibility
        const subjectKey = record.subject || record.subjectId;
        
        if (!attendance[subjectKey]) {
          attendance[subjectKey] = { present: 0, absent: 0, total: 0 };
        }
        
        if (record.status === 'present') {
          attendance[subjectKey].present += 1;
        } else {
          attendance[subjectKey].absent += 1;
        }
        
        attendance[subjectKey].total += 1;
      });
    
    return attendance;
  }

  // Calculate attendance percentages from attendance counts
  const calculateAttendancePercentages = (
    attendance: Record<string, { present: number; absent: number; total: number }>
  ) => {
    const subjectPercentages: Record<string, number> = {};
    let totalPresent = 0;
    let totalClasses = 0;
    
    // Calculate percentage for each subject
    Object.entries(attendance).forEach(([subjectId, data]) => {
      const percentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 100;
      subjectPercentages[subjectId] = percentage;
      
      totalPresent += data.present;
      totalClasses += data.total;
    });
    
    // Calculate overall percentage
    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;
    
    return {
      overall: overallPercentage,
      subjects: subjectPercentages
    };
  }

  // Get today's date and a future date
  const today = new Date()
  const futureDate = selectedDate ? new Date(selectedDate) : addDays(today, 7)

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Attendance Calculator
            </span>
          </CardTitle>
          <CardDescription>Loading your attendance data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // No subjects found
  if (subjects.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Attendance Calculator
            </span>
          </CardTitle>
          <CardDescription>Calculate your attendance based on future absences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No subjects found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please add subjects in your profile settings
            </p>
            <Button 
              className="mt-4"
              variant="outline"
              onClick={() => window.location.href = '/settings/profile'}
            >
              Go to Profile Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardTitle className="flex items-center">
          <Calculator className="mr-2 h-5 w-5 text-primary" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Attendance Calculator
          </span>
        </CardTitle>
        <CardDescription>Calculate your attendance based on future absences</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="whole-day" onValueChange={(value) => setCalculatorType(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger
              value="whole-day"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Whole Day Calculator
            </TabsTrigger>
            <TabsTrigger
              value="per-subject"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Per Subject Calculator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whole-day" className="p-6 space-y-4 animate-in fade-in-50">
            <div className="space-y-2">
              <Label htmlFor="absence-date" className="text-base">
                Select Absence Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="absence-date"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={format(today, "yyyy-MM-dd")}
                />
              </div>
            </div>

            <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
              <AlertTitle className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                How it works
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                Select a future date to mark as absent. The calculator will show how this absence will affect your
                overall attendance.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
              onClick={handleCalculate}
              disabled={!selectedDate || calculating}
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
              <Label htmlFor="absence-date-subject" className="text-base">
                Select End Date for Calculation
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="absence-date-subject"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={format(addDays(today, 1), "yyyy-MM-dd")}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Select subjects for dates between today ({format(today, "MMM d")}) and your selected date
              </p>
            </div>

            {selectedDate && (
              <div className="pt-2">
                <MultiDateSubjectSelector
                  startDate={today}
                  endDate={new Date(selectedDate)}
                  onSelectionChangeAction={setMultiDateSelection}
                />
              </div>
            )}

            <Button
              className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
              onClick={handleCalculate}
              disabled={!selectedDate || Object.keys(multiDateSelection).length === 0 || calculating}
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
              <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
                <AlertTitle className="text-green-800 dark:text-green-300 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Calculation Result
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">Overall Attendance</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{result.overall}%</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div className="w-full max-w-xs bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000 ease-out",
                              result.overall > 90
                                ? "bg-green-500"
                                : result.overall > 75
                                  ? "bg-amber-500"
                                  : "bg-red-500",
                            )}
                            style={{ width: `${result.overall}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-sm font-medium text-muted-foreground">Subject-wise Attendance</span>
                      <div className="mt-2 space-y-2">
                        {subjects
                          .filter(subject => result.subjects[subject.id] !== undefined)
                          .map((subject, index) => (
                          <div key={subject.id} className="flex flex-col">
                            <div className="flex justify-between items-center text-sm">
                              <span>{subject.name}</span>
                              <span
                                className={cn(
                                  "font-medium",
                                  result.subjects[subject.id] > 90
                                    ? "text-green-600 dark:text-green-400"
                                    : result.subjects[subject.id] > 75
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-red-600 dark:text-red-400",
                                )}
                              >
                                {result.subjects[subject.id]}%
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-1000 ease-out",
                                  result.subjects[subject.id] > 90
                                    ? "bg-green-500"
                                    : result.subjects[subject.id] > 75
                                      ? "bg-amber-500"
                                      : "bg-red-500",
                                )}
                                style={{
                                  width: `${result.subjects[subject.id]}%`,
                                  transitionDelay: `${index * 100}ms`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
