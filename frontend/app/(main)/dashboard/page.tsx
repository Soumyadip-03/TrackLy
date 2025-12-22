"use client"

import { useAuth } from '@/lib/auth-context'
import { WeeklyAttendanceChart } from "@/components/dashboard/weekly-attendance-chart"
import { AttendanceOverviewGraph } from "@/components/dashboard/attendance-overview-graph"
import { ClassSpecificAttendance } from "@/components/dashboard/class-specific-attendance"
import { PointsCard } from "@/components/points/points-card"
import { TodaySchedule } from "@/components/dashboard/today-schedule"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, BookOpen, AlertCircle, Check, X, ArrowUp, ArrowDown, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { FORCE_RECOMPILE } from "./force-recompile.js"
import { recordSuccessfulLogin } from "@/lib/auth-utils"
import { calculateAttendanceExcludingHolidays } from "@/lib/attendance-utils"

interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  status: "present" | "absent";
}

interface ClassEntry {
  id: string;
  day: string;
  name?: string;
  subject?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  room: string;
  classType?: string;
  fromPdf?: boolean;
}

interface PointsData {
  total: number;
  streak: number;
  achievements: any[];
}

interface TodoItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy")
  
  // Stats state
  const [attendanceStats, setAttendanceStats] = useState({
    percentage: "0",
    trend: "0",
    trendDirection: "up"
  })
  const [classesToday, setClassesToday] = useState<{
    count: number;
    nextClass: string;
    nextClassInfo?: {
      name: string;
      time: string;
      classType?: string;
      status?: "present" | "absent" | null;
    };
    allClassesFinished: boolean;
  }>({
    count: 0,
    nextClass: "No upcoming classes",
    allClassesFinished: false
  })
  const [pointsStats, setPointsStats] = useState({
    total: 0,
    streak: 0
  })
  const [isDataLoading, setIsDataLoading] = useState(true)



  // Check authentication
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('No user found, redirecting to login...');
      router.push('/login?error=unauthorized');
    } else if (!isLoading && user) {
      console.log('User authenticated in dashboard:', user.id);
      setIsDataLoading(true);
    }
  }, [isLoading, user, router])

  // Get the user's first name for greeting
  const firstName = user?.user_metadata?.full_name 
    ? user.user_metadata.full_name.split(' ')[0] 
    : 'there'
    
  // Function to show welcome notification
  useEffect(() => {
    // Check if this is the first time loading the dashboard in this session
    const hasShownWelcome = sessionStorage.getItem('has_shown_welcome');
    
    if (!isLoading && !hasShownWelcome && user) {
      // Store notification in localStorage
      const existingNotifications = getFromLocalStorage<any[]>('notifications', []) || [];
      
      // Create welcome notification
      const welcomeNotification = {
        id: `welcome_${Date.now()}`,
        title: `Welcome back, ${firstName}!`,
        message: `We're glad to see you using TrackLy. Your attendance tracking journey continues.`,
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      // Add to beginning of array (newest first)
      existingNotifications.unshift(welcomeNotification);
      
      // Save back to localStorage
      saveToLocalStorage('notifications', existingNotifications);
      
      // Dispatch an event that notifications have been updated
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { newNotification: welcomeNotification }
      }));
      
      // Mark as shown in this session
      sessionStorage.setItem('has_shown_welcome', 'true');
    }
  }, [isLoading, user, firstName]);

  // Load data from localStorage
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (!isLoading && user) {
          console.log('Loading dashboard data...')
          // Get attendance records first
          const attendanceRecords = getFromLocalStorage<AttendanceRecord[]>('attendance_records', []);
          
          // 1. Calculate overall attendance using the utility function for accurate numbers
          const calculatedStats = calculateAttendanceExcludingHolidays(attendanceRecords);
          const currentPercentage = calculatedStats.percentage;
          
          // Get attendance records to analyze previous periods
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          const currentMonthRecords = attendanceRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && 
                   recordDate.getFullYear() === currentYear;
          });
          
          // Get previous month (handle January case by going to previous year's December)
          const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          
          const previousMonthRecords = attendanceRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === previousMonth && 
                   recordDate.getFullYear() === previousYear;
          });
          
          let trend = 0;
          let trendDirection = "up";
          
          if (currentMonthRecords.length > 0 && previousMonthRecords.length > 0) {
            const currentMonthPresent = currentMonthRecords.filter(r => r.status === "present").length;
            const previousMonthPresent = previousMonthRecords.filter(r => r.status === "present").length;
            
            const currentMonthPercentage = Math.round((currentMonthPresent / currentMonthRecords.length) * 100);
            const previousMonthPercentage = Math.round((previousMonthPresent / previousMonthRecords.length) * 100);
            
            trend = currentMonthPercentage - previousMonthPercentage;
            trendDirection = trend >= 0 ? "up" : "down";
          }
          
          setAttendanceStats({
            percentage: currentPercentage.toString(),
            trend: Math.abs(trend).toString(),
            trendDirection: trendDirection
          });
          
          // 2. Get today's schedule and next class
          const schedule = getFromLocalStorage<{classes: ClassEntry[]}>('schedule', {classes: []});
          const today = new Date();
          const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
          const todayFormatted = format(today, "yyyy-MM-dd");
          
          // Filter for today's classes
          const todayClasses = schedule.classes.filter(classItem => 
            classItem.day === dayOfWeek && 
            (!classItem.classType || !classItem.classType.toLowerCase().includes('break'))
          );
          
          let nextClass = "No upcoming classes";
          let nextClassInfo = undefined;
          let allClassesFinished = false;
          
          // If we have classes today
          if (todayClasses.length > 0) {
            // Sort by time
            todayClasses.sort((a, b) => {
              const timeA = a.startTime || (a.time && a.time.split(" - ")[0]) || "00:00";
              const timeB = b.startTime || (b.time && b.time.split(" - ")[0]) || "00:00";
              return timeA.localeCompare(timeB);
            });
            
            // Get the current time and find the next class
            const now = new Date();
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();
            const currentTimeInMinutes = currentHours * 60 + currentMinutes;
            
            // Find the next upcoming class
            let upcomingClass = todayClasses.find(classItem => {
              let startTime = "00:00";
              let endTime = "00:00";
              
              if (classItem.startTime) {
                startTime = classItem.startTime;
                endTime = classItem.endTime || "23:59";
              } else if (classItem.time && typeof classItem.time === 'string') {
                const timeParts = classItem.time.split(" - ");
                startTime = timeParts[0] || "00:00";
                endTime = timeParts[1] || (parseInt(startTime.split(":")[0]) + 1) + ":" + startTime.split(":")[1];
              }
              
              const [startHours, startMinutes] = startTime.split(":").map(Number);
              const classStartTimeInMinutes = startHours * 60 + startMinutes;
              
              return classStartTimeInMinutes > currentTimeInMinutes;
            });
            
            // Check if all classes for today are finished
            if (!upcomingClass) {
              // No upcoming classes, check if all are in the past
              const lastClass = todayClasses[todayClasses.length - 1];
              let endTime = "00:00";
              
              if (lastClass.endTime) {
                endTime = lastClass.endTime;
              } else if (lastClass.time && typeof lastClass.time === 'string') {
                const timeParts = lastClass.time.split(" - ");
                endTime = timeParts[1] || (parseInt(timeParts[0].split(":")[0]) + 1) + ":" + timeParts[0].split(":")[1];
              }
              
              const [endHours, endMinutes] = endTime.split(":").map(Number);
              const lastClassEndTimeInMinutes = endHours * 60 + endMinutes;
              
              // If the current time is past the end time of the last class, all classes are done
              if (currentTimeInMinutes > lastClassEndTimeInMinutes) {
                allClassesFinished = true;
                nextClass = "All classes done";
              } else {
                // Use the last class as the next class (it's in progress)
                upcomingClass = lastClass;
              }
            }
            
            if (upcomingClass) {
              // Check attendance status for this class
              const className = upcomingClass.subject || upcomingClass.name || "Unnamed class";
              
              // Get formatted time
              let timeString = "unknown time";
              if (upcomingClass.startTime) {
                timeString = upcomingClass.startTime;
              } else if (upcomingClass.time && typeof upcomingClass.time === 'string') {
                timeString = upcomingClass.time.split(" - ")[0];
              }
              
              // Check for attendance status
              const attendanceStatus = attendanceRecords.find(record => 
                record.date === todayFormatted && 
                record.subject.toLowerCase() === className.toLowerCase()
              )?.status || null;
              
              // Store detailed class info
              nextClassInfo = {
                name: className,
                time: timeString,
                classType: upcomingClass.classType,
                status: attendanceStatus
              };
              
              nextClass = `${className} at ${timeString}`;
            }
          }
          
          setClassesToday({
            count: todayClasses.length,
            nextClass,
            nextClassInfo,
            allClassesFinished
          });
          
          // 3. Get points data
          const pointsData = getFromLocalStorage<PointsData>('points', { total: 100, streak: 0, achievements: [] });
          
          setPointsStats({
            total: pointsData.total,
            streak: pointsData.streak
          });
          
          setIsDataLoading(false);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError('Failed to load dashboard data. Please refresh the page.')
        setIsDataLoading(false)
      }
    }

    loadDashboardData()
  }, [isLoading, user])

  // Show loading state
  if (isLoading || isDataLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
            <p className="text-muted-foreground">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2 text-red-600">Error</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Show unauthorized state
  if (!user) {
    return null // The useEffect will handle redirection
  }



  return (
    <div className="container py-10">

      <div className="container py-6 space-y-8">
        <div className="flex justify-between items-center">
          <PageHeader 
            title="Dashboard" 
            description={`Welcome back, ${firstName}! Here's an overview of your attendance and schedule`} 
          />
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Today is</div>
            <div className="text-lg font-medium">{currentDate}</div>
          </div>
        </div>

        {isDataLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Quick Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 transition-all duration-300 hover:shadow-md hover:border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overall Attendance</p>
                      <h3 className="text-2xl font-bold mt-1 text-primary">{attendanceStats.percentage}%</h3>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {(() => {
                          // Get attendance records and calculated stats for display
                          const records = getFromLocalStorage<AttendanceRecord[]>('attendance_records', []);
                          const stats = calculateAttendanceExcludingHolidays(records);
                          return (
                            <>
                              <p>{stats.present}/{stats.total} classes attended</p>
                              <button 
                                onClick={() => router.push('/attendance?tab=auto-marked')}
                                className="text-primary hover:underline mt-1 flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                <span>View auto-marked classes</span>
                              </button>
                            </>
                          );
                        })()}
                        {attendanceStats.trend !== "0" && (
                          <p className={attendanceStats.trendDirection === "up" ? "text-green-600" : "text-red-600"}>
                            <span className="inline-flex items-center">
                              {attendanceStats.trendDirection === "up" ? (
                                <ArrowUp className="h-3 w-3 mr-0.5" />
                              ) : (
                                <ArrowDown className="h-3 w-3 mr-0.5" />
                              )}
                              {attendanceStats.trend}% from last month
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 transition-all duration-300 hover:shadow-md hover:border-blue-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Classes Today</p>
                      <h3 className="text-2xl font-bold mt-1 text-blue-500">{classesToday.count}</h3>
                      
                      {classesToday.allClassesFinished ? (
                        // All classes done message
                        <div className="mt-1">
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="font-semibold">ALL CLASSES ARE DONE</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      ) : classesToday.nextClassInfo ? (
                        // Next class info
                        <div className="mt-1 leading-tight">
                          <div className="flex items-center gap-x-1 text-xs">
                            <span className="text-muted-foreground">Next:</span>
                            <span className="font-semibold uppercase truncate max-w-[130px]">{classesToday.nextClassInfo.name}</span>
                            {classesToday.nextClassInfo.status && (
                              <>
                                {classesToday.nextClassInfo.status === 'present' ? (
                                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                                ) : (
                                  <X className="h-3 w-3 text-red-600 flex-shrink-0" />
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <span>{classesToday.nextClassInfo.time}</span>
                            {classesToday.nextClassInfo.classType && (
                              <span className="inline-block px-1 py-0 bg-blue-100 text-blue-800 rounded uppercase font-semibold leading-[14px]">
                                {classesToday.nextClassInfo.classType}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        // No classes message
                        <p className="text-xs text-muted-foreground mt-1">No upcoming classes</p>
                      )}
                    </div>
                    <div className="h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 transition-all duration-300 hover:shadow-md hover:border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Reward Points</p>
                      <h3 className="text-2xl font-bold mt-1 text-green-500">{pointsStats.total}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{pointsStats.streak} week streak</p>
                    </div>
                    <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <UpcomingTasks />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-3 space-y-6">
                <AttendanceOverviewGraph />
              </div>
            </div>

            {/* Additional Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <ClassSpecificAttendance />
                <WeeklyAttendanceChart />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <TodaySchedule />
                <PointsCard />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 