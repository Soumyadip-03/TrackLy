"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, AlertCircle, Calendar as CalendarIcon, GraduationCap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  getFromLocalStorage, 
  saveToLocalStorage, 
  getAttendanceRecordsBySemester,
  saveAttendanceRecord,
  getSemesterPeriod,
  saveSemesterPeriod,
  AttendanceRecord,
  SemesterPeriod 
} from "@/lib/storage-utils"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ScheduleClass {
  id: string;
  day: string;
  name: string;
  time: string;
  room?: string;
  classType?: string;
}

interface ScheduleData {
  classes: ScheduleClass[];
  pdfSchedule?: {
    name: string;
    size: number;
    uploadDate: string;
    dataUrl?: string;
    processed?: boolean;
    parsedSchedule?: {
      days: string[];
      timeSlots: string[];
      schedule: {[day: string]: {[timeSlot: string]: {
        subject: string;
        classType?: string;
        room?: string;
      }}};
    }
  };
}

export function AttendanceCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, { present: number; total: number }>>({})
  const [selectedDaySchedule, setSelectedDaySchedule] = useState<AttendanceRecord[]>([])
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [collegeStartDate, setCollegeStartDate] = useState<Date | null>(null)
  const [collegeEndDate, setCollegeEndDate] = useState<Date | null>(null)
  const [isSettingStartDate, setIsSettingStartDate] = useState(false)
  const [isSettingEndDate, setIsSettingEndDate] = useState(false)
  const [semesterPeriods, setSemesterPeriods] = useState<SemesterPeriod[]>([])
  const [currentSemester, setCurrentSemester] = useState<string>('1')
  const [showSemesterModal, setShowSemesterModal] = useState(false)

  useEffect(() => {
    // Load attendance records from localStorage
    const loadAttendanceData = () => {
      // Load user profile to get current semester
      const userProfile = getFromLocalStorage<{currentSemester: string}>('user_profile', {currentSemester: '1'});
      const currentSem = userProfile.currentSemester || '1';
      setCurrentSemester(currentSem);
      
      // Load all attendance records
      const savedRecords = getFromLocalStorage<AttendanceRecord[]>('attendance', []);
      setAttendanceRecords(savedRecords);
      
      // Also load schedule data
      const savedSchedule = getFromLocalStorage<ScheduleData>('schedule', { classes: [] });
      setScheduleData(savedSchedule);
      
      // Load semester periods
      const savedPeriods = getFromLocalStorage<SemesterPeriod[]>('semesterPeriods', []);
      setSemesterPeriods(savedPeriods);
      
      // Load semester-specific start and end dates
      const currentPeriod = getSemesterPeriod(currentSem);
      
      if (currentPeriod) {
        if (currentPeriod.startDate) {
          setCollegeStartDate(new Date(currentPeriod.startDate));
        }
        
        if (currentPeriod.endDate) {
          setCollegeEndDate(new Date(currentPeriod.endDate));
        }
      } else {
        // Fall back to legacy storage format
        const savedStartDate = getFromLocalStorage<string>('collegeStartDate', '');
        if (savedStartDate) {
          setCollegeStartDate(new Date(savedStartDate));
        }
        
        const savedEndDate = getFromLocalStorage<string>('collegeEndDate', '');
        if (savedEndDate) {
          setCollegeEndDate(new Date(savedEndDate));
        }
      }
      
      // Process attendance records for the calendar view - filter by current semester
      updateAttendanceDisplay(currentSem);
      
      setIsLoading(false);
    };
    
    loadAttendanceData();
  }, []);

  // Check for semester changes
  useEffect(() => {
    const checkSemesterChange = () => {
      const userProfile = getFromLocalStorage<{currentSemester: string}>('user_profile', {currentSemester: '1'});
      const newSemester = userProfile.currentSemester || '1';
      
      // If semester changed and we don't have a period for this semester
      if (newSemester !== currentSemester && !semesterPeriods.some(p => p.semester === newSemester)) {
        setCurrentSemester(newSemester);
        setShowSemesterModal(true);
      } else if (newSemester !== currentSemester) {
        // Just update current semester and dates
        setCurrentSemester(newSemester);
        const newPeriod = semesterPeriods.find(p => p.semester === newSemester);
        if (newPeriod) {
          setCollegeStartDate(newPeriod.startDate ? new Date(newPeriod.startDate) : null);
          setCollegeEndDate(newPeriod.endDate ? new Date(newPeriod.endDate) : null);
        }
      }
    };
    
    // Listen for specific semester change event
    const handleSemesterChanged = (event: CustomEvent<{semester: string}>) => {
      const newSemester = event.detail.semester;
      
      if (newSemester !== currentSemester) {
        setCurrentSemester(newSemester);
        
        // Check if we have dates for this semester
        const semesterPeriod = semesterPeriods.find(p => p.semester === newSemester);
        
        if (semesterPeriod) {
          // We have existing dates for this semester
          setCollegeStartDate(semesterPeriod.startDate ? new Date(semesterPeriod.startDate) : null);
          setCollegeEndDate(semesterPeriod.endDate ? new Date(semesterPeriod.endDate) : null);
        } else {
          // Need to set dates for this semester
          setCollegeStartDate(null);
          setCollegeEndDate(null);
          setShowSemesterModal(true);
        }
        
        // Update the display to show only attendance records for this semester
        updateAttendanceDisplay(newSemester);
      }
    };
    
    // Add event listeners
    window.addEventListener('settingsUpdated', checkSemesterChange);
    window.addEventListener('semesterChanged', handleSemesterChanged as EventListener);
    
    // Initial check
    checkSemesterChange();
    
    return () => {
      window.removeEventListener('settingsUpdated', checkSemesterChange);
      window.removeEventListener('semesterChanged', handleSemesterChanged as EventListener);
    };
  }, [currentSemester, semesterPeriods]);
  
  // Helper function to update attendance display based on semester
  const updateAttendanceDisplay = (semester: string) => {
    // Filter records by semester
    const semesterRecords = attendanceRecords.filter(
      record => !record.semester || record.semester === semester
    );
    
    // Process attendance records for the calendar view
    const recordsByDate: Record<string, { present: number; total: number }> = {};
    
    semesterRecords.forEach(record => {
      const dateStr = record.date;
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = { present: 0, total: 0 };
      }
      
      recordsByDate[dateStr].total += 1;
      if (record.status === 'present') {
        recordsByDate[dateStr].present += 1;
      }
    });
    
    setAttendanceByDate(recordsByDate);
  };

  const handleDayClick = (day: Date | undefined) => {
    if (day) {
      setSelectedDay(day);
      
      // Get the date string for selected day
      const dateStr = day.toISOString().split("T")[0];
      
      // Get the day name (Monday, Tuesday, etc.)
      const dayName = day.toLocaleDateString("en-US", { weekday: "long" });
      
      // Filter attendance records for the selected day and current semester
      let dayRecords = attendanceRecords.filter(
        record => record.date === dateStr && (!record.semester || record.semester === currentSemester)
      );
      
      // If no records exist for this day but we have schedule data for this weekday,
      // create placeholder attendance records from the schedule data
      if (dayRecords.length === 0 && scheduleData) {
        const classesForDay = scheduleData.classes.filter(cls => cls.day === dayName);
        
        if (classesForDay.length > 0) {
          // Create new attendance placeholders from the schedule
          dayRecords = classesForDay.map(cls => ({
            date: dateStr,
            subject: cls.name,
            status: "absent", // Default to absent
            time: cls.time,
            room: cls.room,
            classType: cls.classType,
            semester: currentSemester
          }));
          
          // We don't save these placeholders until the user actually marks attendance
        }
      }
      
      setSelectedDaySchedule(dayRecords);
    }
  }

  // Handle marking attendance for a selected day and subject
  const handleMarkAttendance = (record: AttendanceRecord, newStatus: "present" | "absent") => {
    // Update record with current semester if not already set
    const updatedRecord = { 
      ...record, 
      status: newStatus,
      semester: currentSemester 
    };
    
    // Save the updated attendance record
    saveAttendanceRecord(updatedRecord);
    
    // Reload all attendance records to update the display
    const allRecords = getFromLocalStorage<AttendanceRecord[]>('attendance', []);
    setAttendanceRecords(allRecords);
    
    // Update the selected day schedule
    if (selectedDay) {
      const dateStr = selectedDay.toISOString().split("T")[0];
      const updatedDaySchedule = allRecords.filter(
        r => r.date === dateStr && (!r.semester || r.semester === currentSemester)
      );
      setSelectedDaySchedule(updatedDaySchedule);
    }
    
    // Update the attendanceByDate record
    updateAttendanceDisplay(currentSemester);
    
    // Show success toast
    toast({
      title: `Marked ${newStatus}`,
      description: `${record.subject} has been marked as ${newStatus} for ${new Date(record.date).toLocaleDateString()} (Semester ${currentSemester}).`,
    });
  };

  // Handle setting college start date
  const handleSetStartDate = (newStartDate: Date | undefined) => {
    if (!newStartDate) return;
    
    setCollegeStartDate(newStartDate);
    
    // Update the semester period
    const existingPeriod = getSemesterPeriod(currentSemester);
    const updatedPeriod: SemesterPeriod = {
      semester: currentSemester,
      startDate: newStartDate.toISOString(),
      endDate: collegeEndDate ? collegeEndDate.toISOString() : ''
    };
    
    // Save the updated period
    saveSemesterPeriod(updatedPeriod);
    
    // For backward compatibility
    saveToLocalStorage('collegeStartDate', newStartDate.toISOString());
    
    // Show success toast
    toast({
      title: "Semester Start Date Set",
      description: `Your semester ${currentSemester} start date has been set to ${format(newStartDate, "MMMM d, yyyy")}.`,
    });
    
    setIsSettingStartDate(false);
  };

  // Handle setting college end date
  const handleSetEndDate = (newEndDate: Date | undefined) => {
    if (!newEndDate) return;
    
    setCollegeEndDate(newEndDate);
    
    // Update the semester period
    const existingPeriod = getSemesterPeriod(currentSemester);
    const updatedPeriod: SemesterPeriod = {
      semester: currentSemester,
      startDate: collegeStartDate ? collegeStartDate.toISOString() : '',
      endDate: newEndDate.toISOString()
    };
    
    // Save the updated period
    saveSemesterPeriod(updatedPeriod);
    
    // For backward compatibility
    saveToLocalStorage('collegeEndDate', newEndDate.toISOString());
    
    // Show success toast
    toast({
      title: "Semester End Date Set",
      description: `Your semester ${currentSemester} end date has been set to ${format(newEndDate, "MMMM d, yyyy")}.`,
    });
    
    setIsSettingEndDate(false);
  };

  // Initialize attendance records from start date to end date
  const initializeAttendanceFromStartDate = () => {
    if (!collegeStartDate || !scheduleData) {
      toast({
        title: "Cannot Initialize",
        description: "Please set a college start date and upload your schedule first.",
        variant: "destructive"
      });
      return;
    }
    
    const startDate = new Date(collegeStartDate);
    const endDate = collegeEndDate || new Date();
    endDate.setHours(0, 0, 0, 0);
    
    const newRecords: AttendanceRecord[] = [];
    const existingDates = new Set<string>();
    
    // Create a Set of existing date+subject+semester combinations
    attendanceRecords.forEach(record => {
      existingDates.add(`${record.date}_${record.subject}_${record.semester || ''}`);
    });
    
    // Iterate through each day from start date to end date
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.toLocaleDateString("en-US", { weekday: "long" });
      const dateStr = currentDate.toISOString().split("T")[0];
      
      // Find classes for this day of the week
      const classesForDay = scheduleData.classes.filter(cls => cls.day === dayOfWeek);
      
      // Create records for each class on this day
      classesForDay.forEach(cls => {
        const recordKey = `${dateStr}_${cls.name}_${currentSemester}`;
        
        // Only add if this record doesn't exist yet
        if (!existingDates.has(recordKey)) {
          newRecords.push({
            date: dateStr,
            subject: cls.name,
            status: "absent", // Default to absent
            time: cls.time,
            room: cls.room,
            classType: cls.classType,
            semester: currentSemester
          });
        }
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Update records
    const updatedRecords = [...attendanceRecords, ...newRecords];
    setAttendanceRecords(updatedRecords);
    
    // Save to localStorage
    saveToLocalStorage('attendance', updatedRecords);
    
    // Recalculate attendance by date for current semester
    const recordsByDate: Record<string, { present: number; total: number }> = {};
    updatedRecords
      .filter(record => !record.semester || record.semester === currentSemester)
      .forEach(record => {
        const dateStr = record.date;
        if (!recordsByDate[dateStr]) {
          recordsByDate[dateStr] = { present: 0, total: 0 };
        }
        
        recordsByDate[dateStr].total += 1;
        if (record.status === 'present') {
          recordsByDate[dateStr].present += 1;
        }
      });
    
    setAttendanceByDate(recordsByDate);
    
    toast({
      title: "Attendance Records Initialized",
      description: `Created ${newRecords.length} attendance records for semester ${currentSemester}.`
    });
  };
  
  // Reset college start date
  const handleResetStartDate = () => {
    setCollegeStartDate(null);
    
    // Update semester periods by removing the start date
    const updatedPeriods = semesterPeriods.map(period => {
      if (period.semester === currentSemester) {
        return { ...period, startDate: '' };
      }
      return period;
    }).filter(period => period.startDate || period.endDate); // Remove empty periods
    
    setSemesterPeriods(updatedPeriods);
    saveToLocalStorage('semesterPeriods', updatedPeriods);
    
    // Legacy support
    saveToLocalStorage('collegeStartDate', '');
    
    toast({
      title: "Start Date Removed",
      description: `Semester ${currentSemester} start date has been removed.`,
    });
  };

  // Reset college end date
  const handleResetEndDate = () => {
    setCollegeEndDate(null);
    
    // Update semester periods by removing the end date
    const updatedPeriods = semesterPeriods.map(period => {
      if (period.semester === currentSemester) {
        return { ...period, endDate: '' };
      }
      return period;
    }).filter(period => period.startDate || period.endDate); // Remove empty periods
    
    setSemesterPeriods(updatedPeriods);
    saveToLocalStorage('semesterPeriods', updatedPeriods);
    
    // Legacy support
    saveToLocalStorage('collegeEndDate', '');
    
    toast({
      title: "End Date Removed",
      description: `Semester ${currentSemester} end date has been removed.`,
    });
  };

  // Calculate college days from start date to end date or today
  const calculateTotalDays = (): number => {
    if (!collegeStartDate) return 0;
    
    const endDate = collegeEndDate || new Date();
    const startDate = new Date(collegeStartDate);
    
    // Ensure we're using the start of the day for both dates
    endDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    // Calculate the difference in days
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include today
    
    return Math.max(0, diffDays); // Ensure we don't return negative days
  };
  
  // Calculate overall attendance percentage for current semester
  const calculateAttendancePercentage = (): number => {
    if (!collegeStartDate) return 0;
    
    let totalClasses = 0;
    let attendedClasses = 0;
    
    const startDateStr = collegeStartDate.toISOString().split('T')[0];
    const endDateStr = collegeEndDate ? collegeEndDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Filter attendance records by semester
    const semesterRecords = attendanceRecords.filter(
      record => (!record.semester || record.semester === currentSemester)
    );
    
    // Count classes between the start date and end date for this semester
    semesterRecords.forEach(record => {
      if (record.date >= startDateStr && record.date <= endDateStr) {
        totalClasses++;
        if (record.status === 'present') {
          attendedClasses++;
        }
      }
    });
    
    if (totalClasses === 0) return 0;
    
    return Math.round((attendedClasses / totalClasses) * 100);
  };
  
  // Calculate total attended classes for current semester
  const calculateAttendedClasses = (): number => {
    if (!collegeStartDate) return 0;
    
    let attendedClasses = 0;
    const startDateStr = collegeStartDate.toISOString().split('T')[0];
    const endDateStr = collegeEndDate ? collegeEndDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Filter by semester and date range
    attendanceRecords.forEach(record => {
      if ((!record.semester || record.semester === currentSemester) && 
          record.date >= startDateStr && record.date <= endDateStr && 
          record.status === 'present') {
        attendedClasses++;
      }
    });
    
    return attendedClasses;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Calendar</CardTitle>
          <CardDescription>Loading your attendance records...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <CardTitle>Attendance Calendar</CardTitle>
              <CardDescription>View and manage your attendance by date</CardDescription>
            </div>
            <div className="text-sm bg-primary/10 px-3 py-1 rounded-full">
              Semester {currentSemester}
            </div>
          </div>
        </CardHeader>
        
        {/* College Start Date Section */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-medium">Semester {currentSemester} Start Date</h3>
                {collegeStartDate ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tracking attendance from {format(collegeStartDate, "MMMM d, yyyy")}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Set your semester start date to track attendance
                  </p>
                )}
              </div>
            </div>
            
            {isSettingStartDate ? (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {collegeStartDate ? format(collegeStartDate, "PP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={collegeStartDate || undefined}
                      onSelect={handleSetStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button size="sm" variant="ghost" onClick={() => setIsSettingStartDate(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {collegeStartDate ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setIsSettingStartDate(true)}>
                      Change
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleResetStartDate}>
                      Reset
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setIsSettingStartDate(true)}>
                    Set Start Date
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* College End Date Section */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-medium">Semester {currentSemester} End Date</h3>
                {collegeEndDate ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tracking attendance until {format(collegeEndDate, "MMMM d, yyyy")}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Set your semester end date to track attendance
                  </p>
                )}
              </div>
            </div>
            
            {isSettingEndDate ? (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {collegeEndDate ? format(collegeEndDate, "PP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={collegeEndDate || undefined}
                      onSelect={handleSetEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button size="sm" variant="ghost" onClick={() => setIsSettingEndDate(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {collegeEndDate ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setIsSettingEndDate(true)}>
                      Change
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleResetEndDate}>
                      Reset
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setIsSettingEndDate(true)}>
                    Set End Date
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(day) => {
                setDate(day)
                handleDayClick(day)
              }}
              className="rounded-md border mx-auto"
              disabled={(date) => {
                const isBeforeStartDate = collegeStartDate && date < collegeStartDate;
                const isAfterEndDate = collegeEndDate && date > collegeEndDate;
                return isBeforeStartDate || isAfterEndDate || false;
              }}
              modifiers={{
                booked: (date) => {
                  const dateStr = date.toISOString().split("T")[0]
                  return dateStr in attendanceByDate
                },
                startDate: (date) => {
                  if (!collegeStartDate) return false;
                  return date.getDate() === collegeStartDate.getDate() &&
                         date.getMonth() === collegeStartDate.getMonth() &&
                         date.getFullYear() === collegeStartDate.getFullYear()
                },
                endDate: (date) => {
                  if (!collegeEndDate) return false;
                  return date.getDate() === collegeEndDate.getDate() &&
                         date.getMonth() === collegeEndDate.getMonth() &&
                         date.getFullYear() === collegeEndDate.getFullYear()
                }
              }}
              modifiersStyles={{
                booked: {
                  fontWeight: "bold",
                },
                startDate: {
                  color: "white",
                  backgroundColor: "hsl(var(--primary))",
                  borderRadius: "100%"
                },
                endDate: {
                  color: "white",
                  backgroundColor: "hsl(var(--destructive))",
                  borderRadius: "100%"
                }
              }}
              components={{
                DayContent: ({ date }) => {
                  const dateStr = date.toISOString().split("T")[0]
                  const attendance = attendanceByDate[dateStr]
                  
                  // Check if this is the start date
                  const isStartDate = collegeStartDate && 
                    date.getDate() === collegeStartDate.getDate() &&
                    date.getMonth() === collegeStartDate.getMonth() &&
                    date.getFullYear() === collegeStartDate.getFullYear();

                  // Check if this is the end date
                  const isEndDate = collegeEndDate && 
                    date.getDate() === collegeEndDate.getDate() &&
                    date.getMonth() === collegeEndDate.getMonth() &&
                    date.getFullYear() === collegeEndDate.getFullYear();

                  if (isStartDate) {
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{date.getDate()}</span>
                        <div className="absolute bottom-0 w-full h-1 rounded-sm bg-primary" />
                      </div>
                    )
                  }

                  if (isEndDate) {
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{date.getDate()}</span>
                        <div className="absolute bottom-0 w-full h-1 rounded-sm bg-destructive" />
                      </div>
                    )
                  }

                  if (!attendance) return <span>{date.getDate()}</span>

                  const percentage = Math.round((attendance.present / attendance.total) * 100)
                  const color =
                    percentage === 100
                      ? "bg-green-100 dark:bg-green-900"
                      : percentage >= 75
                        ? "bg-yellow-100 dark:bg-yellow-900"
                        : "bg-red-100 dark:bg-red-900"

                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span>{date.getDate()}</span>
                      <div className={cn("absolute bottom-0 w-full h-1 rounded-sm", color)} />
                    </div>
                  )
                },
              }}
            />
          </div>
          
          {/* Attendance Statistics */}
          {collegeStartDate && (
            <div className="border-t border-b p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Attendance Statistics</h3>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={initializeAttendanceFromStartDate}
                  className="h-7 text-xs"
                >
                  Initialize Records
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/20 p-2 rounded text-center">
                  <div className="text-lg font-medium">{calculateTotalDays()}</div>
                  <div className="text-xs text-muted-foreground">College Days</div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded text-center">
                  <div className="text-lg font-medium">{calculateAttendancePercentage()}%</div>
                  <div className="text-xs text-muted-foreground">Attendance Rate</div>
                </div>
                <div className="bg-muted/20 p-2 rounded text-center">
                  <div className="text-lg font-medium">{calculateAttendedClasses()}</div>
                  <div className="text-xs text-muted-foreground">Classes Attended</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Statistics tracked since {format(collegeStartDate, "MMMM d, yyyy")}
              </p>
            </div>
          )}

          {selectedDay && (
            <div className="border-t p-4">
              <h3 className="font-medium mb-2">
                {selectedDay.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              {selectedDaySchedule.length > 0 ? (
                <div className="space-y-3">
                  {selectedDaySchedule.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/10 transition-colors">
                      <div className="flex items-start space-x-3">
                        {item.status === "present" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">{item.subject}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            {item.time && (
                              <span className="flex items-center gap-1">
                                <span>⏰</span> {item.time}
                              </span>
                            )}
                            {item.classType && (
                              <span className="flex items-center gap-1">
                                <span>📚</span> {item.classType}
                              </span>
                            )}
                            {item.room && (
                              <span className="flex items-center gap-1">
                                <span>🚪</span> {item.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={item.status === "present" ? "default" : "outline"}
                          className="h-8"
                          onClick={() => handleMarkAttendance(item, "present")}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={item.status === "absent" ? "default" : "outline"}
                          className="h-8"
                          onClick={() => handleMarkAttendance(item, "absent")}
                        >
                          Absent
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No classes found for this day.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add classes in the Schedule Manager to see them here
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Semester Change Modal */}
      {showSemesterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Set Dates for Semester {currentSemester}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              You've changed to semester {currentSemester}. Please set the start and end dates for this academic period.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="semesterStartDate">Semester Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" id="semesterStartDate">
                      {collegeStartDate ? format(collegeStartDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={collegeStartDate || undefined}
                      onSelect={handleSetStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="semesterEndDate">Semester End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" id="semesterEndDate">
                      {collegeEndDate ? format(collegeEndDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={collegeEndDate || undefined}
                      onSelect={handleSetEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSemesterModal(false)}>
                Skip for Now
              </Button>
              <Button onClick={() => {
                if (collegeStartDate && collegeEndDate) {
                  setShowSemesterModal(false);
                  toast({
                    title: "Semester Dates Set",
                    description: `Your semester ${currentSemester} dates have been saved successfully.`,
                  });
                } else {
                  toast({
                    title: "Missing Information",
                    description: "Please set both start and end dates for the semester.",
                    variant: "destructive"
                  });
                }
              }}>
                Save Dates
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
