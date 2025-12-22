"use client"

import { useState, useEffect } from "react"
import { addDays, format } from "date-fns"
import { Calculator, Calendar, ChevronRight, AlertCircle, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { Slider } from "@/components/ui/slider"
import { calculateAttendanceExcludingHolidays, calculateSubjectAttendanceExcludingHolidays, getAllHolidays, generateAutoPresentRecords, isHoliday, isOffDay } from "@/lib/attendance-utils"

interface Subject {
  id: string;
  name: string;
  code?: string;
}

interface AttendanceRecord {
  id?: string;
  date: string;
  subjectId: string;
  subjectName: string;
  status: "present" | "absent";
  notes?: string;
}

export function TargetAttendanceCalculator() {
  const [calculatorType, setCalculatorType] = useState<"overall" | "per-subject">("overall")
  const [targetPercentage, setTargetPercentage] = useState<number>(75)
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [result, setResult] = useState<{ requiredClasses: number; currentPercentage: number; selectedSubjectName?: string } | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  
  // Load subjects and attendance records from localStorage
  useEffect(() => {
    const loadData = () => {
      const savedSubjects = getFromLocalStorage<Subject[]>('subjects', []);
      const savedAttendance = getFromLocalStorage<AttendanceRecord[]>('attendance_records', []);
      
      setSubjects(savedSubjects);
      setAttendanceRecords(savedAttendance);
      setIsLoading(false);
      
      // Set first subject as default if available
      if (savedSubjects.length > 0) {
        setSelectedSubject(savedSubjects[0].id);
      }
    };
    
    loadData();
  }, []);

  const handleCalculate = () => {
    // Show calculating state
    setCalculating(true)

    // Set a short timeout to simulate processing
    setTimeout(() => {
      if (calculatorType === "overall") {
        // Calculate overall target
        calculateOverallTarget(targetPercentage);
      } else {
        // Calculate subject-specific target
        calculateSubjectTarget(selectedSubject, targetPercentage);
      }

      setCalculating(false)
    }, 800)
  }

  // Calculate how many consecutive classes need to be attended to reach target percentage overall
  const calculateOverallTarget = (target: number) => {
    // Get current attendance data
    const currentAttendance = calculateCurrentAttendance();
    
    // Calculate overall current statistics
    let totalPresent = 0;
    let totalClasses = 0;
    
    Object.values(currentAttendance).forEach(data => {
      totalPresent += data.present;
      totalClasses += data.total;
    });
    
    // Calculate current percentage
    const currentPercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 100;
    
    // If we've already reached the target
    if (currentPercentage >= target) {
      setResult({
        requiredClasses: 0,
        currentPercentage: Math.round(currentPercentage)
      });
      return;
    }
    
    // Calculate how many consecutive present classes needed to reach target percentage
    // Formula: (target_percent * (total_classes + x) - total_present) / 100 = x
    // Solving for x: x = (target_percent * total_classes - 100 * total_present) / (100 - target_percent)
    
    const requiredClasses = Math.ceil((target * totalClasses - 100 * totalPresent) / (100 - target));
    
    setResult({
      requiredClasses: requiredClasses,
      currentPercentage: Math.round(currentPercentage)
    });
  }

  // Calculate how many consecutive classes need to be attended for a specific subject
  const calculateSubjectTarget = (subjectId: string, target: number) => {
    // Get current attendance data
    const currentAttendance = calculateCurrentAttendance();
    
    // Get the selected subject
    const subject = subjects.find(s => s.id === subjectId);
    
    if (!subject) {
      return;
    }
    
    // Get subject's current attendance data
    const subjectData = currentAttendance[subjectId] || { present: 0, absent: 0, total: 0 };
    
    // Calculate current percentage
    const currentPercentage = subjectData.total > 0 ? (subjectData.present / subjectData.total) * 100 : 100;
    
    // If we've already reached the target
    if (currentPercentage >= target) {
      setResult({
        requiredClasses: 0,
        currentPercentage: Math.round(currentPercentage),
        selectedSubjectName: subject.name
      });
      return;
    }
    
    // Calculate how many consecutive present classes needed to reach target percentage
    // Same formula as above but for specific subject
    const requiredClasses = Math.ceil((target * subjectData.total - 100 * subjectData.present) / (100 - target));
    
    setResult({
      requiredClasses: requiredClasses,
      currentPercentage: Math.round(currentPercentage),
      selectedSubjectName: subject.name
    });
  }

  // Calculate current attendance from attendance records with auto-present functionality
  const calculateCurrentAttendance = () => {
    const attendance: Record<string, { present: number; absent: number; total: number }> = {};
    
    // Get attendance records with auto-present for past days
    const allRecords = generateAutoPresentRecords();
    
    // Process attendance records to get counts (excluding holidays and off days)
    allRecords.forEach(record => {
      // Skip records for dates that are marked as holidays or off days
      if (isHoliday(record.date) || isOffDay(record.date)) {
        return;
      }
      
      if (!attendance[record.subjectId]) {
        attendance[record.subjectId] = { present: 0, absent: 0, total: 0 };
      }
      
      if (record.status === 'present') {
        attendance[record.subjectId].present += 1;
      } else {
        attendance[record.subjectId].absent += 1;
      }
      
      attendance[record.subjectId].total += 1;
    });
    
    return attendance;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Target Attendance Calculator
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
            <Target className="mr-2 h-5 w-5 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Target Attendance Calculator
            </span>
          </CardTitle>
          <CardDescription>Calculate classes needed to reach your target attendance</CardDescription>
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
          <Target className="mr-2 h-5 w-5 text-primary" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Target Attendance Calculator
          </span>
        </CardTitle>
        <CardDescription>Calculate classes needed to reach your target attendance</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="overall" onValueChange={(value) => setCalculatorType(value as any)} className="w-full">
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

            <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
              <AlertTitle className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Target className="h-4 w-4" />
                How it works
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                Set your target attendance percentage. The calculator will show how many consecutive classes
                you need to attend to reach this target based on your current attendance record.
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
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} {subject.code ? `(${subject.code})` : ""}
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

            <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
              <AlertTitle className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Target className="h-4 w-4" />
                How it works
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                Select a subject and set your target attendance percentage. The calculator will show how many consecutive
                classes you need to attend for this specific subject to reach your target.
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
                  Calculation Result
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">
                        {result.selectedSubjectName 
                          ? `Current Attendance for ${result.selectedSubjectName}` 
                          : "Current Overall Attendance"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.currentPercentage}%</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div className="w-full max-w-xs bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000 ease-out",
                              result.currentPercentage > 90
                                ? "bg-green-500"
                                : result.currentPercentage > 75
                                  ? "bg-amber-500"
                                  : "bg-red-500",
                            )}
                            style={{ width: `${result.currentPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 dark:bg-blue-900/20 rounded-lg p-4 mt-3">
                      <h4 className="text-xl font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {result.requiredClasses === 0 ? (
                          <span>Target already achieved!</span>
                        ) : (
                          <span>You need to attend {result.requiredClasses} more classes</span>
                        )}
                      </h4>
                      <p className="text-blue-700 dark:text-blue-400 mt-2">
                        {result.requiredClasses === 0 ? (
                          `Your current attendance of ${result.currentPercentage}% already meets your target of ${targetPercentage}%.`
                        ) : (
                          `To reach your target attendance of ${targetPercentage}%, 
                          you need to attend ${result.requiredClasses} consecutive classes 
                          ${result.selectedSubjectName ? `for ${result.selectedSubjectName}` : "across all subjects"}.`
                        )}
                      </p>
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