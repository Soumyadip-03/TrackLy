"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { 
  showSuccessNotification,
  showInfoNotification,
  showWarningNotification
} from "@/components/ui/notification-popup"
import { saveToLocalStorage, getFromLocalStorage } from "@/lib/storage-utils"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { format, isToday, isBefore, startOfDay, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon, Check, X, BookOpen, Map, Clock, CheckCircle, XCircle, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  sendEmail, 
  sendDailySummary,
  saveEmailPreferences 
} from "@/lib/email-utils"

interface ClassEntry {
  id: string;
  day: string;
  name?: string;
  subject?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  room: string;
  fromPdf?: boolean;
  classType?: string;
}

import { attendanceService, type AttendanceRecord as ServiceAttendanceRecord } from "@/lib/services/attendance-service"

type AttendanceRecord = ServiceAttendanceRecord;

const filterNonBreakClasses = (classes: ClassEntry[]): ClassEntry[] => {
  return classes.filter(item => !item.classType || !item.classType.toLowerCase().includes('break'));
};

const sendNotification = async (title: string, body: string) => {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(title, { body });
    }
  }
};

const formatBreakTime = (classItem: ClassEntry): string => {
  if (classItem.time) return classItem.time;
  if (classItem.startTime && classItem.endTime) return `${classItem.startTime} - ${classItem.endTime}`;
  return "Time not specified";
};

export function VisualAttendanceForm() {
  const [date, setDate] = useState<Date>(new Date())
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true)
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [todaySchedule, setTodaySchedule] = useState<ClassEntry[]>([])
  const [existingRecords, setExistingRecords] = useState<Record<string, any>>({})
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassEntry | null>(null)
  const [status, setStatus] = useState<"present" | "absent">("present")
  const [scheduleData, setScheduleData] = useState<any>(null)
  const [upcomingBreaks, setUpcomingBreaks] = useState<ClassEntry[]>([])
  const [userEmail, setUserEmail] = useState<string>("")
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState<boolean>(false)
  const [emailPreferences, setEmailPreferences] = useState({
    attendanceReminders: true,
    breakReminders: true,
    lowAttendanceAlerts: true,
    upcomingDeadlines: true,
    dailySummary: true
  });

  useEffect(() => {
    const loadData = async () => {
      const schedule = getFromLocalStorage<{classes: ClassEntry[]}>('schedule', {classes: []});
      setScheduleData(schedule);
      
      try {
        const records = await attendanceService.getAll();
        setAllRecords(records);
      } catch (error) {
        console.error('Failed to load attendance:', error);
      }
      
      updateScheduleForSelectedDate(date, schedule.classes);
      setIsLoadingSchedule(false);
    };
    
    loadData();
    window.addEventListener('scheduleUpdated', loadData);
    return () => window.removeEventListener('scheduleUpdated', loadData);
  }, []);
  
  useEffect(() => {
    const email = getFromLocalStorage<string>('user_email', '');
    const enableNotifications = getFromLocalStorage<boolean>('enable_notifications', false);
    const enableEmailNotifications = getFromLocalStorage<boolean>('enable_email_notifications', false);
    
    setUserEmail(email);
    setNotificationsEnabled(enableNotifications);
    setEmailNotificationsEnabled(enableEmailNotifications);
    
    if (enableNotifications && "Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);
  
  useEffect(() => {
    const savedPreferences = getFromLocalStorage('email_preferences', {
      attendanceReminders: true,
      breakReminders: true,
      lowAttendanceAlerts: true,
      upcomingDeadlines: true,
      dailySummary: true
    });
    setEmailPreferences(savedPreferences);
  }, []);

  useEffect(() => {
    if (isToday(date) && todaySchedule.length > 0) {
      const breaks = todaySchedule.filter(item => 
        item.classType && item.classType.toLowerCase().includes('break')
      );
      
      setUpcomingBreaks(breaks);
      const notificationTimers: NodeJS.Timeout[] = [];
      
      breaks.forEach(breakClass => {
        const breakTime = breakClass.startTime || (breakClass.time && breakClass.time.split(" - ")[0]);
        if (breakTime) {
          const [hours, minutes] = breakTime.split(":").map(Number);
          const breakDate = new Date();
          breakDate.setHours(hours, minutes, 0, 0);
          const notificationDate = new Date(breakDate);
          notificationDate.setMinutes(notificationDate.getMinutes() - 15);
          const now = new Date();
          const timeUntilNotification = notificationDate.getTime() - now.getTime();
          
          if (timeUntilNotification > 0) {
            const timer = setTimeout(() => {
              const breakName = breakClass.name || breakClass.subject || "Break";
              const breakRoom = breakClass.room || "Not specified";
              const breakTimeStr = formatBreakTime(breakClass);
              
              if (notificationsEnabled) {
                sendNotification("Break Coming Up!", `${breakName} in 15 minutes (${breakTimeStr}) at ${breakRoom}`);
              }
              
              if (emailNotificationsEnabled && userEmail) {
                sendEmail("Break Reminder - TrackLy", `Your break "${breakName}" is coming up in 15 minutes (${breakTimeStr}) at ${breakRoom}.`, userEmail);
              }
              
              toast({
                title: "Break Coming Up!",
                description: `${breakName} in 15 minutes (${breakTimeStr}) at ${breakRoom}`,
                variant: "default",
              });
            }, timeUntilNotification);
            
            notificationTimers.push(timer);
          }
        }
      });
      
      return () => notificationTimers.forEach(timer => clearTimeout(timer));
    }
  }, [todaySchedule, date, notificationsEnabled, emailNotificationsEnabled, userEmail]);
  
  const handleNotificationPreferenceChange = (type: 'browser' | 'email', enabled: boolean) => {
    if (type === 'browser') {
      setNotificationsEnabled(enabled);
      saveToLocalStorage('enable_notifications', enabled);
      if (enabled && "Notification" in window) {
        Notification.requestPermission();
      }
    } else {
      setEmailNotificationsEnabled(enabled);
      saveToLocalStorage('enable_email_notifications', enabled);
    }
  };
  
  const handleSaveEmail = (email: string) => {
    setUserEmail(email);
    saveToLocalStorage('user_email', email);
    toast({
      title: "Email Saved",
      description: "Your email has been saved for notifications.",
      variant: "default",
    });
  };
  
  useEffect(() => {
    const schedule = getFromLocalStorage<{classes: ClassEntry[]}>('schedule', {classes: []});
    updateScheduleForSelectedDate(date, schedule.classes);
    checkExistingAttendance(date);
  }, [date, allRecords]);

  const checkExistingAttendance = (selectedDate: Date) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const recordsForDate = allRecords.filter((record: AttendanceRecord) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === dateStr;
    });
    
    const recordMap: Record<string, AttendanceRecord> = {};
    recordsForDate.forEach((record: AttendanceRecord) => {
      const recordId = record.classId || record.subjectId;
      if (recordId) {
        recordMap[recordId] = { 
          id: record.id || `${dateStr}-${recordId}`,
          date: record.date || dateStr,
          classId: recordId,
          className: record.className || "Unknown Class",
          classType: record.classType,
          status: record.status as "present" | "absent", 
          notes: record.notes || "",
          isAutoGenerated: record.isAutoGenerated || false,
          subjectId: record.subjectId
        };
      }
    });
    setExistingRecords(recordMap);
  };
  
  const updateScheduleForSelectedDate = (selectedDate: Date, classes: ClassEntry[]) => {
    const dayOfWeek = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
    const classesForDay = filterNonBreakClasses(classes.filter(item => item.day === dayOfWeek));
    
    if (classesForDay.length === 0) {
      setTodaySchedule([]);
    } else {
      classesForDay.sort((a, b) => {
        const timeA = a.startTime || (a.time && a.time.split(" - ")[0]) || "00:00";
        const timeB = b.startTime || (b.time && b.time.split(" - ")[0]) || "00:00";
        return timeA.localeCompare(timeB);
      });
      setTodaySchedule(classesForDay);
    }
  };
  
  const saveAttendanceToDb = async (updatedRecords: AttendanceRecord[]) => {
    try {
      await attendanceService.save(updatedRecords);
      setAllRecords(updatedRecords);
      window.dispatchEvent(new Event('attendanceUpdated'));
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast({
        title: "Error",
        description: "Failed to save attendance to database.",
        variant: "destructive"
      });
    }
  };

  const handleAllDay = async (allDayStatus: "present" | "absent") => {
    const nonBreakClasses = filterNonBreakClasses(todaySchedule);
    
    if (nonBreakClasses.length === 0) {
      toast({
        title: "No Classes",
        description: "There are no classes scheduled for this day.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updatedRecords = [...allRecords];
      const localStateUpdates: Record<string, any> = { ...existingRecords };
      
      for (const classEntry of nonBreakClasses) {
        const className = classEntry.name || classEntry.subject || "Unknown Class";
        const classId = classEntry.id;
        const classType = classEntry.classType || "Unknown";
        
        if (!className || !classId) continue;
        
        const attendanceRecord = {
          id: crypto.randomUUID(),
          date: date.toISOString(),
          classId: classId,
          className: className,
          classType: classType,
          time: classEntry.time || (classEntry.startTime && classEntry.endTime 
            ? `${classEntry.startTime} - ${classEntry.endTime}` 
            : undefined),
          room: classEntry.room,
          status: allDayStatus,
          notes: allDayStatus === "absent" ? "Marked absent for entire day" : "Marked present for entire day",
          isAutoGenerated: false,
          subjectId: classId
        };
        
        const existingIndex = updatedRecords.findIndex(r => 
          r.date === attendanceRecord.date && r.classId === classId
        );
        
        if (existingIndex >= 0) {
          updatedRecords[existingIndex] = attendanceRecord;
        } else {
          updatedRecords.push(attendanceRecord);
        }
        
        localStateUpdates[classId] = attendanceRecord;
      }
      
      await saveAttendanceToDb(updatedRecords);
      setNotes("");
      setExistingRecords(localStateUpdates);
      
      toast({
        title: "Success",
        description: `All classes for ${format(date, 'EEE, MMM d')} marked as ${allDayStatus === "present" ? "present" : "absent"}`,
        variant: allDayStatus === "present" ? "default" : "destructive"
      });
      
      if (allDayStatus === "present") {
        showSuccessNotification("All Marked Present", `All ${nonBreakClasses.length} classes for ${format(date, 'EEE, MMM d')} have been marked as present.`);
      } else {
        showWarningNotification("All Marked Absent", `All ${nonBreakClasses.length} classes for ${format(date, 'EEE, MMM d')} have been marked as absent.`, {
          action: {
            label: "Undo",
            onClick: () => handleAllDay("present")
          }
        });
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectAttendance = async (classId: string, attendanceStatus: "present" | "absent") => {
    setIsSaving(true);
    
    try {
      const classEntry = todaySchedule.find(item => item.id === classId);
      if (!classEntry) throw new Error("Class not found");
      
      const updatedRecords = [...allRecords];
      const formattedDate = format(date, 'yyyy-MM-dd');
      const recordId = `${formattedDate}-${classId}`;
      
      const existingIndex = updatedRecords.findIndex(record => 
        record.id === recordId || (record.date === formattedDate && record.classId === classId)
      );
      
      const isToggle = existingIndex >= 0 && updatedRecords[existingIndex].status === attendanceStatus;
      const updatedStateRecords = { ...existingRecords };
      
      if (isToggle) {
        if (existingIndex >= 0) updatedRecords.splice(existingIndex, 1);
        delete updatedStateRecords[classId];
        await saveAttendanceToDb(updatedRecords);
        setExistingRecords(updatedStateRecords);
        toast({
          title: "Reset Attendance",
          description: `Attendance for ${classEntry.name || classEntry.subject || "Unknown Class"} has been reset`,
          variant: "default"
        });
      } else {
        const className = classEntry.name || classEntry.subject || "Unknown Class";
        const classType = classEntry.classType || "Unknown";
        
        const attendanceRecord = {
          id: recordId,
          date: formattedDate,
          classId: classId,
          className: className,
          classType: classType,
          time: classEntry.time || (classEntry.startTime && classEntry.endTime 
            ? `${classEntry.startTime} - ${classEntry.endTime}` 
            : undefined),
          room: classEntry.room,
          status: attendanceStatus,
          notes: notes,
          createdAt: new Date().toISOString(),
          subjectId: classId
        };
        
        if (existingIndex >= 0) {
          updatedRecords[existingIndex] = attendanceRecord;
        } else {
          updatedRecords.push(attendanceRecord);
        }
        
        await saveAttendanceToDb(updatedRecords);
        updatedStateRecords[classId] = attendanceRecord;
        setExistingRecords(updatedStateRecords);
        
        toast({
          title: "Attendance Recorded",
          description: `Marked ${attendanceStatus} for ${className}`,
          variant: attendanceStatus === "present" ? "default" : "destructive"
        });
      }
    } catch (error) {
      console.error("Error recording attendance:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record attendance",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const autoMarkEndOfDayAttendance = () => {
    if (!isBefore(date, startOfDay(new Date())) || todaySchedule.length === 0) return;
    
    const records = getFromLocalStorage<any[]>('attendance_records', []);
    const formattedDate = format(date, 'yyyy-MM-dd');
    let addedRecords = false;
    const updatedRecords: Record<string, any> = { ...existingRecords };
    
    todaySchedule.forEach(classEntry => {
      const classId = classEntry.id;
      if (existingRecords[classId]) return;
      
      const className = classEntry.name || classEntry.subject || "Unknown Class";
      const recordId = `${formattedDate}-${classId}`;
      
      const attendanceRecord = {
        id: recordId,
        date: formattedDate,
        classId: classId,
        className: className,
        classType: classEntry.classType || "Lecture",
        time: classEntry.time || (classEntry.startTime && classEntry.endTime 
          ? `${classEntry.startTime} - ${classEntry.endTime}` 
          : undefined),
        room: classEntry.room,
        status: "present",
        notes: "Automatically marked as present at end of day",
        isAutoGenerated: true,
        createdAt: new Date().toISOString(),
        subjectId: classId
      };
      
      records.push(attendanceRecord);
      updatedRecords[classId] = attendanceRecord;
      addedRecords = true;
    });
    
    if (addedRecords) {
      saveToLocalStorage('attendance_records', records);
      setExistingRecords(updatedRecords);
      toast({
        title: "Auto Attendance",
        description: `Unmarked classes for ${format(date, 'EEE, MMM d')} were automatically marked as present`,
        variant: "default"
      });
      showInfoNotification("Auto-Attendance Applied", `Unmarked classes for ${format(date, 'EEE, MMM d')} were automatically marked as present.`);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => autoMarkEndOfDayAttendance(), 10 * 60 * 1000);
    autoMarkEndOfDayAttendance();
    return () => clearInterval(interval);
  }, []);
  
  const handleManualAttendanceRecord = () => {
    const selectedClassId = selectedClass?.id;
    if (!selectedClassId || !selectedClass) {
      toast({
        title: "No Class Selected",
        description: "Please select a class to record attendance for",
        variant: "destructive",
      });
      return;
    }
    handleDirectAttendance(selectedClassId, status);
  };

  useEffect(() => {
    if (!emailPreferences.attendanceReminders || !userEmail) return;
    const sendReminders = async () => {
      if (isToday(date) || isBefore(date, new Date())) return;
      if (todaySchedule.length > 0) {
        try {
          const formattedDate = format(date, 'EEEE, MMMM d, yyyy');
          const subjectList = todaySchedule.map(subject => `- ${subject.name || subject.subject || 'Unknown Class'} (${subject.time || 'Time not specified'})`).join('\n');
          const existingNotifications = getFromLocalStorage<any[]>('notifications', []) || [];
          const newNotification = {
            id: `notification_${Date.now()}`,
            title: `Classes Reminder for ${formattedDate}`,
            message: `This is a reminder about your classes for ${formattedDate}.\n\nScheduled Classes:\n${subjectList}\n\nPlease remember to mark your attendance for these classes.`,
            type: 'attendance',
            isRead: false,
            createdAt: new Date().toISOString()
          };
          existingNotifications.unshift(newNotification);
          localStorage.setItem('notifications', JSON.stringify(existingNotifications));
          toast({
            title: "Reminder Set",
            description: `Reminder set for classes on ${formattedDate}`,
            variant: "default"
          });
        } catch (error) {
          console.error('Error creating attendance reminder:', error);
        }
      }
    };
    sendReminders();
  }, [date, todaySchedule, emailPreferences.attendanceReminders, userEmail]);

  useEffect(() => {
    if (!emailPreferences.dailySummary || !userEmail) return;
    const sendEndOfDaySummary = async () => {
      if (!isBefore(date, new Date())) return;
      const records = Object.values(existingRecords);
      await sendDailySummary(date, records, []);
    };
    const lastSummaryDate = getFromLocalStorage<string>('last_summary_date', '');
    const today = new Date().toISOString().split('T')[0];
    if (lastSummaryDate !== today) {
      sendEndOfDaySummary();
      saveToLocalStorage('last_summary_date', today);
    }
  }, [date, existingRecords, emailPreferences.dailySummary, userEmail]);

  const handleEmailPreferenceChange = (key: string, value: boolean) => {
    const updatedPreferences = { ...emailPreferences, [key]: value };
    setEmailPreferences(updatedPreferences);
    saveEmailPreferences(updatedPreferences);
  };

  return (
    <div className="w-full">
      <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="w-full">
          <CardContent className="pt-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => setDate(newDate || new Date())}
              className="border rounded-md p-4"
            />
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Selected date: <span className="font-medium">{format(date, 'PPP')}</span>
                {isToday(date) && <Badge className="ml-2 bg-blue-500">Today</Badge>}
              </p>
              
              <div className="mt-4">
                {todaySchedule.length > 0 ? (
                  <>
                    <p className="text-sm font-medium mb-2">{`${todaySchedule.length} classes scheduled`}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {todaySchedule.map((classItem, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{classItem.name || classItem.subject}{classItem.classType && ` (${classItem.classType})`}</span>
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-4 px-2 border border-dashed rounded-lg border-muted-foreground/20">
                    <p className="text-base font-medium text-muted-foreground">Off Day</p>
                    <p className="text-sm text-muted-foreground mt-1">According to your uploaded schedule, {format(date, 'EEEE')} is an off day</p>
                    <p className="text-xs text-muted-foreground mt-1">No classes are scheduled on this day in your timetable</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="pt-6 space-y-5">
            {todaySchedule.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <p className="text-xl font-medium text-muted-foreground">Off Day</p>
                <div className="mt-5 p-5 border rounded-lg text-center bg-muted/5 max-w-md">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">No Classes Available</h4>
                  <p className="text-sm text-muted-foreground">According to your uploaded schedule, {format(date, 'EEEE')} is an off day</p>
                  <p className="text-xs text-muted-foreground mt-2">No classes are scheduled for this day in your academic timetable</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-base font-medium">Classes</Label>
                  <div className="mt-2">
                    <h3 className="text-sm font-medium mb-3 text-center">
                      Classes for {format(date, 'EEEE, MMMM d')} 
                      <Badge variant="outline" className="ml-2">{todaySchedule.length} classes</Badge>
                      {isBefore(date, startOfDay(new Date())) && (
                        <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700 border-blue-300">Past Day</Badge>
                      )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {todaySchedule.map((classItem, index) => {
                        const className = classItem.name || classItem.subject || "Unnamed Class";
                        const classId = classItem.id;
                        const hasAttendance = Boolean(existingRecords[classId]);
                        const attendanceStatus = hasAttendance ? existingRecords[classId]?.status : null;
                        const isAutoGenerated = hasAttendance && Boolean(existingRecords[classId]?.isAutoGenerated);
                        const isSelected = selectedClass?.id === classId;
                        
                        return (
                          <div 
                            key={index}
                            className={cn(
                              "border rounded-md p-3 transition-all relative overflow-hidden cursor-pointer",
                              hasAttendance 
                                ? attendanceStatus === "present" 
                                  ? isAutoGenerated ? "bg-blue-50 border-blue-300" : "bg-green-50 border-green-300"
                                  : "bg-red-50 border-red-300" 
                                : "bg-background hover:bg-muted/50 border-border",
                              isSelected && "ring-2 ring-primary ring-offset-1"
                            )}
                            onClick={() => setSelectedClass(classItem)}
                          >
                            {hasAttendance && (
                              <div className={cn(
                                "absolute top-0 left-0 w-1 h-full",
                                attendanceStatus === "present" 
                                  ? isAutoGenerated ? "bg-blue-500" : "bg-green-500" 
                                  : "bg-red-500"
                              )}/>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col overflow-hidden">
                                <div className="flex items-center">
                                  <div className={cn(
                                    "w-3 h-3 rounded-full mr-2 flex-shrink-0",
                                    hasAttendance
                                      ? attendanceStatus === "present" 
                                        ? isAutoGenerated ? "bg-blue-500" : "bg-green-500" 
                                        : "bg-red-500"
                                      : "bg-gray-300"
                                  )}/>
                                  <span className={cn(
                                    "font-medium text-sm truncate",
                                    hasAttendance
                                      ? attendanceStatus === "present" 
                                        ? isAutoGenerated ? "text-blue-800" : "text-green-800" 
                                        : "text-red-800"
                                      : ""
                                  )}>{className}</span>
                                  {hasAttendance && (
                                    <span className={cn(
                                      "ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold",
                                      attendanceStatus === "present" 
                                        ? isAutoGenerated ? "bg-blue-200 text-blue-800" : "bg-green-200 text-green-800" 
                                        : "bg-red-200 text-red-800"
                                    )}>
                                      {attendanceStatus === "present" 
                                        ? isAutoGenerated ? "Auto-Present" : "Present" 
                                        : "Absent"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-5 mt-1">
                                  {classItem.classType && (
                                    <Badge variant="outline" className={cn(
                                      "text-xs px-1 py-0 h-4",
                                      hasAttendance
                                        ? attendanceStatus === "present" 
                                          ? isAutoGenerated ? "border-blue-300 text-blue-800 bg-blue-100" : "border-green-300 text-green-800 bg-green-100" 
                                          : "border-red-300 text-red-800 bg-red-100"
                                        : ""
                                    )}>{classItem.classType}</Badge>
                                  )}
                                  {classItem.time && (
                                    <span className={cn(
                                      "text-xs ml-1 flex items-center",
                                      hasAttendance
                                        ? attendanceStatus === "present" 
                                          ? isAutoGenerated ? "text-blue-700" : "text-green-700" 
                                          : "text-red-700"
                                        : "text-muted-foreground"
                                    )}>
                                      <CalendarIcon className="h-3 w-3 mr-1 inline" />{classItem.time}
                                    </span>
                                  )}
                                  {classItem.room && (
                                    <span className={cn(
                                      "text-xs ml-1 flex items-center",
                                      hasAttendance
                                        ? attendanceStatus === "present" 
                                          ? isAutoGenerated ? "text-blue-700" : "text-green-700" 
                                          : "text-red-700"
                                        : "text-muted-foreground"
                                    )}>
                                      <Map className="h-3 w-3 mr-1 inline" />{classItem.room}
                                    </span>
                                  )}
                                  {isAutoGenerated && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-xs ml-1 flex items-center text-blue-600">
                                          <Clock className="h-3 w-3 mr-1 inline" />Auto
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Automatically marked as present because this is a past class</p></TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Click on a class to select it, then use the Record Attendance section below
                      {isBefore(date, startOfDay(new Date())) && (
                        <span className="block mt-1 text-blue-600">
                          <Clock className="h-3 w-3 inline mr-1" />Past classes are automatically marked as present unless manually changed
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Quick Actions</Label>
                  <div className="flex items-center justify-between mb-4 space-x-2">
                    <div className="flex items-center gap-2">
                      <LoadingButton 
                        onClick={() => handleAllDay("present")}
                        variant="default" 
                        size="sm" 
                        className="flex items-center gap-1"
                        loadingText="Marking..."
                        successText="Marked All Present!"
                      >
                        <CheckCircle className="h-4 w-4" /> Mark All Present
                      </LoadingButton>
                      <LoadingButton 
                        onClick={() => handleAllDay("absent")}
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
                        loadingText="Marking..."
                        successText="Marked All Absent!"
                      >
                        <XCircle className="h-4 w-4" /> Mark All Absent
                      </LoadingButton>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 border rounded-md">
                    <h3 className="text-sm font-medium mb-2">Manual Attendance Recording</h3>
                    <p className="text-xs text-muted-foreground mb-3">Select a class above, then choose an attendance status and click Record</p>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center">
                        <Button
                          type="button"
                          size="sm"
                          variant={status === "present" ? "default" : "outline"}
                          className={cn("flex-1", status === "present" && "bg-green-600 hover:bg-green-700")}
                          onClick={() => setStatus("present")}
                        >
                          <Check className="mr-1 h-4 w-4" />Present
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={status === "absent" ? "default" : "outline"}
                          className={cn("flex-1 ml-1", status === "absent" && "bg-red-600 hover:bg-red-700")}
                          onClick={() => setStatus("absent")}
                        >
                          <X className="mr-1 h-4 w-4" />Absent
                        </Button>
                      </div>
                      <LoadingButton
                        type="button"
                        onClick={handleManualAttendanceRecord}
                        disabled={!selectedClass || isSaving}
                        className="whitespace-nowrap"
                        loadingText="Recording..."
                        successText="Recorded!"
                      >
                        Record Attendance
                      </LoadingButton>
                    </div>
                    
                    <p className="text-xs mt-2 text-center text-muted-foreground">
                      {selectedClass ? `Selected: ${selectedClass.name || selectedClass.subject || "Unknown Class"}` : "No class selected"}
                    </p>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2 text-center">Click the same attendance button twice to clear the attendance status</p>
                </div>

                {isToday(date) && (
                  <div>
                    <Label className="text-base font-medium">Break Notifications</Label>
                    {upcomingBreaks.length > 0 ? (
                      <div className="mt-2 border rounded-md p-3 bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-1 mb-3">
                          <Bell className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Scheduled Breaks ({upcomingBreaks.length})</span>
                        </div>
                        <div className="space-y-2 mb-3">
                          {upcomingBreaks.map((breakItem, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs p-2 bg-blue-100 rounded border border-blue-200">
                              <div className="flex flex-col">
                                <span className="font-medium">{breakItem.name || breakItem.subject || "Break"}</span>
                                <div className="flex items-center gap-1 mt-0.5 text-blue-700">
                                  <Clock className="h-3 w-3" /><span>{formatBreakTime(breakItem)}</span>
                                  <Map className="h-3 w-3 ml-2" /><span>{breakItem.room || "No room"}</span>
                                </div>
                              </div>
                              <Badge className="bg-blue-200 border-blue-300 text-blue-800">Break</Badge>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3 pt-2 border-t border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              Browser Notifications
                              <p className="text-xs text-blue-600">Popup alerts 15 minutes before breaks</p>
                            </div>
                            <Button
                              size="sm" 
                              variant={notificationsEnabled ? "default" : "outline"}
                              className={notificationsEnabled ? "bg-blue-600" : ""}
                              onClick={() => handleNotificationPreferenceChange('browser', !notificationsEnabled)}
                            >
                              {notificationsEnabled ? "Enabled" : "Enable"}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              Email Notifications
                              <p className="text-xs text-blue-600">Receive email alerts for breaks</p>
                            </div>
                            <Button
                              size="sm" 
                              variant={emailNotificationsEnabled ? "default" : "outline"}
                              className={emailNotificationsEnabled ? "bg-blue-600" : ""}
                              onClick={() => handleNotificationPreferenceChange('email', !emailNotificationsEnabled)}
                            >
                              {emailNotificationsEnabled ? "Enabled" : "Enable"}
                            </Button>
                          </div>
                          {emailNotificationsEnabled && (
                            <div className="flex items-center gap-2">
                              <Input 
                                type="email"
                                placeholder="Enter your email address"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                className="text-sm h-8"
                              />
                              <Button 
                                size="sm"
                                onClick={() => handleSaveEmail(userEmail)}
                                disabled={!userEmail || !userEmail.includes('@')}
                              >
                                Save
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 border border-dashed rounded-md p-3 text-center">
                        <p className="text-sm text-muted-foreground">No breaks scheduled for today</p>
                        <p className="text-xs text-muted-foreground mt-1">Break times would appear here if scheduled</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Daily Class Reminders</p>
                        <p className="text-xs text-muted-foreground">Get reminders about upcoming classes</p>
                      </div>
                      <Button
                        size="sm"
                        variant={emailPreferences.attendanceReminders ? "default" : "outline"}
                        onClick={() => handleEmailPreferenceChange('attendanceReminders', !emailPreferences.attendanceReminders)}
                      >
                        {emailPreferences.attendanceReminders ? "Enabled" : "Enable"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Break Notifications</p>
                        <p className="text-xs text-muted-foreground">Receive alerts before breaks</p>
                      </div>
                      <Button
                        size="sm"
                        variant={emailPreferences.breakReminders ? "default" : "outline"}
                        onClick={() => handleEmailPreferenceChange('breakReminders', !emailPreferences.breakReminders)}
                      >
                        {emailPreferences.breakReminders ? "Enabled" : "Enable"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Low Attendance Alerts</p>
                        <p className="text-xs text-muted-foreground">Receive warnings when attendance is low</p>
                      </div>
                      <Button
                        size="sm"
                        variant={emailPreferences.lowAttendanceAlerts ? "default" : "outline"}
                        onClick={() => handleEmailPreferenceChange('lowAttendanceAlerts', !emailPreferences.lowAttendanceAlerts)}
                      >
                        {emailPreferences.lowAttendanceAlerts ? "Enabled" : "Enable"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Daily Summary</p>
                        <p className="text-xs text-muted-foreground">Get a daily summary of your attendance</p>
                      </div>
                      <Button
                        size="sm"
                        variant={emailPreferences.dailySummary ? "default" : "outline"}
                        onClick={() => handleEmailPreferenceChange('dailySummary', !emailPreferences.dailySummary)}
                      >
                        {emailPreferences.dailySummary ? "Enabled" : "Enable"}
                      </Button>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => {
                            saveToLocalStorage('user_email', userEmail);
                            toast({
                              title: "Email Saved",
                              description: "Your email has been saved for notifications.",
                            });
                          }}
                          disabled={!userEmail || !userEmail.includes('@')}
                        >
                          Save Email
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Enter your email address to receive notifications</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Label htmlFor="notes" className="text-base font-medium">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about today's classes"
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      </TooltipProvider>
    </div>
  );
}
