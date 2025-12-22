"use client"

import { useEffect, useState, useRef } from "react"
import { Clock, MapPin, Calendar, CheckCircle, CheckSquare, Check, X, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { format, isToday, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface ClassEntry {
  id: string;
  day: string;
  name?: string;  // Make name optional since we might use subject instead
  subject?: string; // Add subject field for compatibility with settings-schedule-uploader
  time?: string;    // Original format "09:00 - 10:30"
  startTime?: string; // Alternative format: separate start and end times
  endTime?: string;   // Alternative format: separate start and end times
  room: string;
  fromPdf?: boolean;
  classType?: string;
}

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  labels?: string[];
}

interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  status: "present" | "absent";
  classType?: string;
  time?: string;
  room?: string;
  autoMarked?: boolean;
}

interface ScheduleData {
  classes: ClassEntry[];
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

// Creative messages for off days
const OFF_DAY_MESSAGES = [
  { message: "NO CLASSES TODAY", suggestion: "Perfect time to catch up on assignments!" },
  { message: "FREE DAY", suggestion: "How about working on that project you've been postponing?" },
  { message: "SCHEDULE CLEAR", suggestion: "Great day to review your lecture notes." },
  { message: "DAY OFF", suggestion: "Consider joining a study group or helping a classmate!" },
  { message: "NO LECTURES", suggestion: "Try completing some practice problems for upcoming exams." },
  { message: "REST DAY", suggestion: "Take some time for self-care and rejuvenation." },
  { message: "BREAK DAY", suggestion: "Visit the library and explore additional reading materials." },
  { message: "OPEN SCHEDULE", suggestion: "Perfect opportunity to prepare for next week's classes." },
  { message: "FREE CALENDAR", suggestion: "Why not organize your notes and materials?" },
  { message: "TIME TO FOCUS", suggestion: "Create a study plan for the upcoming tests!" }
];

// Track auto attendance interval
const AUTO_ATTENDANCE_CHECK_INTERVAL = 60000; // Check every minute

// Add a function to filter out break-type classes
const filterNonBreakClasses = (classes: ClassEntry[]): ClassEntry[] => {
  return classes.filter(item => !item.classType || !item.classType.toLowerCase().includes('break'));
};

export function TodaySchedule() {
  const [schedule, setSchedule] = useState<ClassEntry[]>([]);
  const [todayTodos, setTodayTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fromPdf, setFromPdf] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const [offDayMessage, setOffDayMessage] = useState<{message: string, suggestion: string}>({
    message: "",
    suggestion: ""
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  // Interval reference for auto-attendance
  const autoAttendanceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current day information
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const todayFormatted = format(today, "yyyy-MM-dd");

  useEffect(() => {
    // Select a random message for off days
    const randomIndex = Math.floor(Math.random() * OFF_DAY_MESSAGES.length);
    setOffDayMessage(OFF_DAY_MESSAGES[randomIndex]);
    
    // Load schedule data from localStorage
    const savedSchedule = getFromLocalStorage<ScheduleData>("schedule", { classes: [] });
    
    // Check if the schedule was processed from a PDF
    if (savedSchedule.pdfSchedule?.processed) {
      setFromPdf(true);
      setPdfName(savedSchedule.pdfSchedule.name);
    }
    
    // Filter classes for today, excluding break-type classes
    const todayClasses = filterNonBreakClasses(
      savedSchedule.classes.filter(classItem => classItem.day === dayOfWeek)
    );
    
    // Sort by time (considering both time formats)
    todayClasses.sort((a, b) => {
      // Get start time from either the unified time field or the separate startTime field
      const timeA = a.startTime || (a.time && a.time.split(" - ")[0]) || "00:00";
      const timeB = b.startTime || (b.time && b.time.split(" - ")[0]) || "00:00";
      return timeA.localeCompare(timeB);
    });
    
    setSchedule(todayClasses);
    
    // Load todos due today
    const todos = getFromLocalStorage<TodoItem[]>("todos", []);
    
    // Filter todos that are due today
    const todaysTodos = todos.filter(todo => {
      if (!todo.dueDate) return false;
      
      // Handle different date formats
      try {
        // Try to parse the date
        const dueDate = parseISO(todo.dueDate);
        return format(dueDate, "yyyy-MM-dd") === todayFormatted;
      } catch (e) {
        // If parsing fails, try a direct string comparison
        return todo.dueDate.includes(todayFormatted);
      }
    });
    
    // Sort todos by priority
    todaysTodos.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    setTodayTodos(todaysTodos);
    
    // Load attendance records
    const savedAttendance = getFromLocalStorage<AttendanceRecord[]>("attendance_records", []);
    setAttendanceRecords(savedAttendance);
    
    // Setup auto-attendance checking
    setupAutoAttendance();
    
    setIsLoading(false);
    
    // Cleanup on unmount
    return () => {
      if (autoAttendanceIntervalRef.current) {
        clearInterval(autoAttendanceIntervalRef.current);
      }
    };
  }, [dayOfWeek, todayFormatted]);
  
  // Function to auto-mark attendance for finished classes
  const autoMarkAttendance = () => {
    const currentTime = new Date();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    
    // Check each class
    let updatedRecords = false;
    let updatedAttendanceRecords = [...attendanceRecords];
    
    // Only process non-break classes
    filterNonBreakClasses(schedule).forEach(classEntry => {
      // Skip if attendance is already marked
      const subjectName = classEntry.subject || classEntry.name || "";
      if (!subjectName) return;
      
      // Check if we already have a record for this class today
      const existingRecord = attendanceRecords.find(record => 
        record.date === todayFormatted && 
        record.subject.toLowerCase() === subjectName.toLowerCase()
      );
      
      // Skip if already marked
      if (existingRecord) return;
      
      // Get class end time
      const classStatus = getClassStatus(classEntry);
      
      // If class is finished, auto-mark as present
      if (classStatus === "FINISHED") {
        // Create a unique ID for the attendance record
        const recordId = `${todayFormatted}-${subjectName.toLowerCase().replace(/\s+/g, '-')}`;
        
        // Create the attendance record (default to present)
        const attendanceRecord: AttendanceRecord = {
          id: recordId,
          date: todayFormatted,
          subject: subjectName,
          status: "present", // Default to present
          classType: classEntry.classType,
          time: getFormattedTimeString(classEntry),
          room: classEntry.room,
          autoMarked: true // Flag that this was auto-marked
        };
        
        // Add new record
        updatedAttendanceRecords.push(attendanceRecord);
        updatedRecords = true;
      }
    });
    
    // Save updated records if any were added
    if (updatedRecords) {
      setAttendanceRecords(updatedAttendanceRecords);
      saveToLocalStorage('attendance_records', updatedAttendanceRecords);
      
      // Show a subtle toast notification
      toast({
        title: "Attendance Auto-Marked",
        description: "Attendance for finished classes has been automatically marked as present",
        duration: 3000,
      });
    }
  };
  
  // Setup interval for auto-attendance
  const setupAutoAttendance = () => {
    // First check immediately
    autoMarkAttendance();
    
    // Then set interval
    if (autoAttendanceIntervalRef.current) {
      clearInterval(autoAttendanceIntervalRef.current);
    }
    
    autoAttendanceIntervalRef.current = setInterval(() => {
      autoMarkAttendance();
    }, AUTO_ATTENDANCE_CHECK_INTERVAL);
  };

  // Function to get a formatted time string for display and status calculation
  const getFormattedTimeString = (classEntry: ClassEntry): string => {
    if (classEntry.time && typeof classEntry.time === 'string') {
      return classEntry.time.toUpperCase(); // Format in uppercase
    } else if (classEntry.startTime) {
      // Construct time string from separate fields
      const endTimePart = classEntry.endTime ? ` - ${classEntry.endTime}` : '';
      return `${classEntry.startTime}${endTimePart}`.toUpperCase();
    }
    return ""; // Return empty string if no time info available
  };

  // Function to determine if a class is happening now, next, or later
  const getClassStatus = (classEntry: ClassEntry, index?: number): string => {
    // Get formatted time string
    const timeRange = getFormattedTimeString(classEntry);
    
    if (!timeRange) {
      return "UNKNOWN";
    }

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Extract time from the range (e.g., "08:00 - 09:30" -> "08:00")
    let startTime: string;
    let endTime: string | null = null;
    
    // Check if we have separate start/end times or a combined time range
    if (classEntry.startTime) {
      startTime = classEntry.startTime;
      endTime = classEntry.endTime || null;
    } else {
      // Extract from combined format
      const timeParts = timeRange.split(" - ");
      if (!timeParts || !timeParts[0]) {
        return "UNKNOWN";
      }
      
      startTime = timeParts[0];
      endTime = timeParts.length > 1 ? timeParts[1] : null;
    }
    
    const startComponents = startTime.split(":");
    if (startComponents.length < 2) {
      return "UNKNOWN";
    }
    
    const [startHours, startMinutes] = startComponents.map(Number);
    
    // Convert current and class times to minutes since midnight for comparison
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const classStartTimeInMinutes = startHours * 60 + startMinutes;
    
    // End time if available
    let classEndTimeInMinutes = Infinity;
    if (endTime) {
      const endComponents = endTime.split(":");
      if (endComponents.length >= 2) {
        const [endHours, endMinutes] = endComponents.map(Number);
        classEndTimeInMinutes = endHours * 60 + endMinutes;
      }
    } else {
      // If no end time provided, assume class is 1 hour long
      classEndTimeInMinutes = classStartTimeInMinutes + 60;
    }
    
    // Check if the class is happening now (current time is between start and end)
    if (currentTimeInMinutes >= classStartTimeInMinutes && currentTimeInMinutes < classEndTimeInMinutes) {
      return "NOW";
    }
    
    // Check if the class is already over
    if (currentTimeInMinutes >= classEndTimeInMinutes) {
      return "FINISHED";
    }
    
    // Check for the next upcoming class
    if (classStartTimeInMinutes > currentTimeInMinutes) {
      // Find all classes that are still upcoming today
      const upcomingClasses = schedule
        .filter(cls => {
          // Get start time from proper field
          let classStartTime: string;
          if (cls.startTime) {
            classStartTime = cls.startTime;
          } else if (cls.time && typeof cls.time === 'string') {
            const parts = cls.time.split(" - ");
            if (!parts || !parts[0]) return false;
            classStartTime = parts[0];
          } else {
            return false;
          }
          
          const components = classStartTime.split(":");
          if (components.length < 2) return false;
          
          const [h, m] = components.map(Number);
          return h * 60 + m > currentTimeInMinutes;
        })
        .sort((a, b) => {
          // Get start time from proper field for both classes
          let aStartTime: string;
          let bStartTime: string;
          
          if (a.startTime) {
            aStartTime = a.startTime;
          } else if (a.time && typeof a.time === 'string') {
            aStartTime = a.time.split(" - ")[0] || "00:00";
          } else {
            aStartTime = "00:00";
          }
          
          if (b.startTime) {
            bStartTime = b.startTime;
          } else if (b.time && typeof b.time === 'string') {
            bStartTime = b.time.split(" - ")[0] || "00:00";
          } else {
            bStartTime = "00:00";
          }
          
          const aComponents = aStartTime.split(":");
          const bComponents = bStartTime.split(":");
          
          if (aComponents.length < 2 || bComponents.length < 2) return 0;
          
          const [aH, aM] = aComponents.map(Number);
          const [bH, bM] = bComponents.map(Number);
          return (aH * 60 + aM) - (bH * 60 + bM);
        });
      
      // If this is the first upcoming class
      if (upcomingClasses.length > 0) {
        const firstUpcomingTime = getFormattedTimeString(upcomingClasses[0]);
        const currentTime = getFormattedTimeString(classEntry);
        
        if (firstUpcomingTime === currentTime) {
          return "NEXT";
        }
      }
    }
    
    return "LATER";
  };

  // Check if attendance can be marked for this class
  const canMarkAttendance = (classStatus: string): boolean => {
    // Only allow marking attendance if class is happening NOW or FINISHED
    return classStatus === "NOW" || classStatus === "FINISHED";
  };

  // Map day to color
  const getClassColor = (classEntry: ClassEntry) => {
    // Get the class subject/name
    const subject = classEntry.subject || classEntry.name || "";
    const classType = classEntry.classType || "";
    
    // First check by class type if available
    if (classType) {
      const typeColors = {
        "lecture": "border-blue-500",
        "Lecture": "border-blue-500",
        "lab": "border-purple-500",
        "Lab": "border-purple-500",
        "tutorial": "border-green-500",
        "Tutorial": "border-green-500",
        "seminar": "border-yellow-500",
        "Seminar": "border-yellow-500",
        "workshop": "border-red-500",
        "Workshop": "border-red-500",
        "practical": "border-teal-500",
        "Practical": "border-teal-500",
        "break": "border-gray-500",
        "Break": "border-gray-500"
      };
      
      const color = typeColors[classType as keyof typeof typeColors];
      if (color) {
        return color;
      }
    }
    
    // Fallback to subject-based colors
    const colors = {
      "Mathematics": "border-blue-500",
      "Computer Science": "border-purple-500",
      "Physics": "border-green-500",
      "English": "border-yellow-500",
      "Chemistry": "border-red-500",
      "Biology": "border-teal-500",
      "History": "border-orange-500",
      "Geography": "border-indigo-500",
    };
    
    return colors[subject as keyof typeof colors] || "border-gray-500";
  };

  // Get priority color for todos
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-amber-500";
      case "low":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  // Check attendance status for a class
  const getAttendanceStatus = (classEntry: ClassEntry): "present" | "absent" | null => {
    const subjectName = classEntry.subject || classEntry.name || "";
    if (!subjectName) return null;
    
    // Find matching attendance record for today and this class
    const record = attendanceRecords.find(record => 
      record.date === todayFormatted && 
      record.subject.toLowerCase() === subjectName.toLowerCase()
    );
    
    if (!record) return null;
    return record.status;
  };

  // Mark attendance for a class
  const markAttendance = (classEntry: ClassEntry, status: "present" | "absent") => {
    const subjectName = classEntry.subject || classEntry.name || "";
    if (!subjectName) return;
    
    // Create a unique ID for the attendance record
    const recordId = `${todayFormatted}-${subjectName.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Check if we already have a record for this class today
    const existingRecordIndex = attendanceRecords.findIndex(record => 
      record.date === todayFormatted && 
      record.subject.toLowerCase() === subjectName.toLowerCase()
    );
    
    let updatedRecords = [...attendanceRecords];
    
    // Create the attendance record
    const attendanceRecord: AttendanceRecord = {
      id: recordId,
      date: todayFormatted,
      subject: subjectName,
      status: status,
      classType: classEntry.classType,
      time: getFormattedTimeString(classEntry),
      room: classEntry.room,
      autoMarked: false // This was manually marked
    };
    
    // Update or add the record
    if (existingRecordIndex !== -1) {
      // Update existing record
      updatedRecords[existingRecordIndex] = attendanceRecord;
    } else {
      // Add new record
      updatedRecords.push(attendanceRecord);
    }
    
    // Save to state and localStorage
    setAttendanceRecords(updatedRecords);
    saveToLocalStorage('attendance_records', updatedRecords);
    
    // Show confirmation toast
    toast({
      title: status === "present" ? "Marked Present" : "Marked Absent",
      description: `Attendance for ${subjectName} has been updated.`,
      duration: 2000,
    });
  };

  // Check if all classes for the day are complete
  const areAllClassesFinished = (): boolean => {
    // If there are no classes today, return false (we'll show the "off day" message instead)
    if (schedule.length === 0) {
      return false;
    }
    
    // Check if all classes have status "FINISHED"
    return schedule.every(classEntry => getClassStatus(classEntry) === "FINISHED");
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <span>TODAY'S SCHEDULE</span>
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>{formattedDate.toUpperCase()}</span>
          <span className="text-xs text-muted-foreground">(Auto-marks as present)</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Classes Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase text-muted-foreground">Classes</h3>
                {schedule.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {schedule.length} {schedule.length === 1 ? 'CLASS' : 'CLASSES'}
                  </span>
                )}
              </div>
              
              {schedule.length > 0 ? (
                areAllClassesFinished() ? (
                  // Show "all classes done" message when all classes are finished
                  <div className="text-center py-5 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">
                      ALL CLASSES ARE DONE FOR {format(today, 'MMMM d, yyyy').toUpperCase()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1 max-w-xs mx-auto">
                      Great job completing all your classes for today! Time to relax or catch up on assignments.
                    </p>
                  </div>
                ) : (
                  // Regular class schedule display
                  schedule.map((item, index) => {
                    const attendanceStatus = getAttendanceStatus(item);
                    const classStatus = getClassStatus(item, index);
                    
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start p-2 rounded-md border-l-4 ${getClassColor(item)} bg-card hover:bg-accent/50 transition-colors duration-200 animate-slide-in`}
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        {/* Attendance Icons */}
                        <div className="flex flex-col items-center mr-2 pt-1 relative">
                          {attendanceStatus ? (
                            <>
                              {attendanceStatus === 'present' ? (
                                <Check className={`h-4 w-4 text-green-600 ${attendanceRecords.find(r => r.subject === (item.subject || item.name) && r.autoMarked)?.autoMarked ? 'opacity-70' : ''}`} />
                              ) : (
                                <X className="h-4 w-4 text-red-600" />
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col space-y-1">
                              {canMarkAttendance(classStatus) ? (
                                <>
                                  <button 
                                    onClick={() => markAttendance(item, 'present')}
                                    className="text-gray-400 hover:text-green-600 transition-colors"
                                    title="Mark present"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => markAttendance(item, 'absent')}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    title="Mark absent"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <div 
                                  className="text-gray-300 cursor-not-allowed" 
                                  title={classStatus === "NEXT" || classStatus === "LATER" ? 
                                    "Will be auto-marked as present after class ends" : 
                                    "Class status unknown"}
                                >
                                  <Clock className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-sm uppercase truncate">
                              {(item.subject || item.name || "UNTITLED CLASS").toUpperCase()}
                              {item.fromPdf && (
                                <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded inline-block">
                                  PDF
                                </span>
                              )}
                            </p>
                            <div className={`text-xs px-1.5 py-0.5 rounded-full ml-1 whitespace-nowrap 
                              ${classStatus === "NOW" ? "bg-green-100 text-green-700" : 
                                classStatus === "FINISHED" ? "bg-gray-100 text-gray-700" :
                                "bg-primary/10 text-primary"}`}>
                              {classStatus}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> 
                              {getFormattedTimeString(item)}
                            </p>
                            {item.classType && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 uppercase">
                                <span>📚</span> {item.classType.toUpperCase()}
                              </p>
                            )}
                            {item.room && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 uppercase">
                                <MapPin className="h-3 w-3" /> {item.room.toUpperCase()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                <div className="text-center py-3 bg-muted/30 rounded-md">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs font-bold text-primary">{offDayMessage.message}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    {offDayMessage.suggestion}
                  </p>
                </div>
              )}
            </div>
            
            {/* Today's Todos Section */}
            <div className="mt-3 border-t pt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium uppercase text-muted-foreground">Today's Tasks</h3>
                {todayTodos.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {todayTodos.length} {todayTodos.length === 1 ? 'TASK' : 'TASKS'}
                  </span>
                )}
              </div>
              
              {todayTodos.length > 0 ? (
                <div className="space-y-1.5">
                  {todayTodos.map((todo, index) => (
                    <div
                      key={todo.id}
                      className="flex items-start p-1.5 rounded-md border border-border hover:bg-accent/30 transition-colors"
                    >
                      <div className={`mr-1.5 mt-0.5 ${todo.completed ? 'text-green-500' : getPriorityColor(todo.priority)}`}>
                        {todo.completed ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          <CheckSquare className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-xs truncate ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {todo.title.toUpperCase()}
                        </p>
                        {todo.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {todo.description}
                          </p>
                        )}
                        {todo.labels && todo.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {todo.labels.slice(0, 2).map(label => (
                              <span key={label} className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded">
                                {label.toUpperCase()}
                              </span>
                            ))}
                            {todo.labels.length > 2 && (
                              <span className="text-xs bg-muted text-muted-foreground px-1 py-0 rounded">
                                +{todo.labels.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={`text-xs px-1 py-0.5 rounded ${getPriorityColor(todo.priority)} bg-opacity-10`}>
                        {todo.priority.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 rounded-md bg-muted/20">
                  <CheckSquare className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <p className="font-medium text-xs text-muted-foreground">NO TASKS DUE TODAY</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
