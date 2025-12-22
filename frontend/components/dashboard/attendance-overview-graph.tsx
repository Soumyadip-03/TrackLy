"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, ArrowUp, ArrowDown, AlertCircle } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { parseISO, format, startOfWeek, endOfWeek, isWithinInterval, subDays, isSameDay, getDay, subMonths } from "date-fns"
import { calculateAttendanceExcludingHolidays } from "@/lib/attendance-utils"

interface AttendanceRecord {
  id: string;
  date: string; // ISO date string
  classId: string;
  className: string;
  status: "present" | "absent";
  classType?: string;
}

interface DailyData {
  name: string;
  present: number;
  absent: number;
  total: number;
  attendance: number;
  date?: string; // For sorting
}

interface WeeklyData {
  name: string;
  present: number;
  absent: number;
  total: number;
  attendance: number;
  weekStart?: string; // For sorting
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b"]

export function AttendanceOverviewGraph() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<WeeklyData[]>([]);
  const [animatedData, setAnimatedData] = useState<DailyData[] | WeeklyData[]>([]);
  const [activeTab, setActiveTab] = useState("weekly");
  const [overallAttendance, setOverallAttendance] = useState(0);
  const [trend, setTrend] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });

  // Load attendance data from localStorage
  useEffect(() => {
    const attendanceRecords = getFromLocalStorage<AttendanceRecord[]>('attendance_records', []);
    
    // Get accurate overall stats using the utility function
    const accurateStats = calculateAttendanceExcludingHolidays(attendanceRecords);
    setGlobalStats(accurateStats);
    setOverallAttendance(accurateStats.percentage);
    
    if (attendanceRecords.length === 0) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Convert string dates to Date objects and sort
      const recordsWithDates = attendanceRecords.map(record => ({
        ...record,
        dateObj: parseISO(record.date)
      })).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      
      // Get date range (last 7 days for weekly, last 4 weeks for monthly)
      const today = new Date();
      const sevenDaysAgo = subDays(today, 6);
      
      // Process weekly data (last 7 days)
      const daily: DailyData[] = [];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Initialize daily data for the past 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayName = days[getDay(date)];
        daily.push({
          name: dayName,
          present: 0,
          absent: 0,
          total: 0,
          attendance: 0,
          date: format(date, 'yyyy-MM-dd')
        });
      }
      
      // Fill in attendance data
      recordsWithDates.forEach(record => {
        const recordDate = record.dateObj;
        // Check if this record is within the last 7 days
        if (recordDate >= sevenDaysAgo && recordDate <= today) {
          // Find the matching day
          const dayIndex = daily.findIndex(day => 
            isSameDay(parseISO(day.date!), recordDate)
          );
          
          if (dayIndex !== -1) {
            daily[dayIndex].total += 1;
            if (record.status === 'present') {
              daily[dayIndex].present += 1;
            } else {
              daily[dayIndex].absent += 1;
            }
          }
        }
      });
      
      // Calculate attendance percentages
      daily.forEach(day => {
        day.attendance = day.total > 0 ? Math.round((day.present / day.total) * 100) : 0;
      });
      
      setWeeklyData(daily);
      
      // Process monthly data (last 4 weeks)
      const weekly: WeeklyData[] = [];
      
      // Calculate the previous 4 weeks
      for (let i = 0; i < 4; i++) {
        const weekEnd = i === 0 ? today : subDays(today, i * 7);
        const weekStart = subDays(weekEnd, 6);
        
        weekly.push({
          name: i === 0 ? "This Week" : i === 1 ? "Last Week" : `Week -${i}`,
          present: 0,
          absent: 0,
          total: 0,
          attendance: 0,
          weekStart: format(weekStart, 'yyyy-MM-dd')
        });
      }
      
      // Count records for each week
      recordsWithDates.forEach(record => {
        const recordDate = record.dateObj;
        
        for (let i = 0; i < weekly.length; i++) {
          const weekStart = parseISO(weekly[i].weekStart!);
          const weekEnd = subDays(i === 0 ? today : subDays(today, i * 7), 0);
          
          if (recordDate >= weekStart && recordDate <= weekEnd) {
            weekly[i].total += 1;
            if (record.status === 'present') {
              weekly[i].present += 1;
            } else {
              weekly[i].absent += 1;
            }
            break; // Each record should only belong to one week
          }
        }
      });
      
      // Calculate attendance percentages for weeks
      weekly.forEach(week => {
        week.attendance = week.total > 0 ? Math.round((week.present / week.total) * 100) : 0;
      });
      
      // Reverse the weekly data for chronological display
      setMonthlyData([...weekly].reverse());
      
      // Calculate monthly trend
      if (weekly.length >= 2) {
        const currentWeek = weekly[0];
        const previousWeek = weekly[1];
        
        if (currentWeek.total > 0 && previousWeek.total > 0) {
          setTrend(currentWeek.attendance - previousWeek.attendance);
        }
      }
      
      setPresentCount(weekly.reduce((sum, week) => sum + week.present, 0));
      setAbsentCount(weekly.reduce((sum, week) => sum + week.absent, 0));
      setTotalCount(weekly.reduce((sum, week) => sum + week.total, 0));
      
      setHasData(attendanceRecords.length > 0);
      
    } catch (error) {
      console.error("Error processing attendance data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Animation for chart data
  useEffect(() => {
    // Reset data when tab changes
    setAnimatedData([]);

    // Only animate if we have data
    if ((activeTab === "weekly" && weeklyData.length > 0) || 
        (activeTab === "monthly" && monthlyData.length > 0)) {
      // Animate the data with staggered delay
      const timer = setTimeout(() => {
        const dataToAnimate = activeTab === "weekly" ? weeklyData : monthlyData;
        dataToAnimate.forEach((item, index) => {
          setTimeout(() => {
            setAnimatedData((prev) => [...prev, item]);
          }, index * 100);
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, weeklyData, monthlyData]);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Attendance Overview</CardTitle>
          </div>
          <CardDescription>Your attendance patterns and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Attendance Overview</CardTitle>
          </div>
          <CardDescription>Your attendance patterns and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No attendance data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start marking your attendance to see your attendance patterns
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Attendance Overview</CardTitle>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid grid-cols-2 h-8">
              <TabsTrigger value="weekly" className="text-xs px-3">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-3">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>Your attendance patterns and statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={animatedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tickCount={5} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Attendance"]}
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
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAttendance)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <div className="bg-primary/5 rounded-lg p-4 h-[95px]">
              <div className="text-sm text-muted-foreground">Overall Attendance</div>
              <div className="flex items-end justify-between mt-1">
                <div className="text-3xl font-bold text-primary">{globalStats.percentage}%</div>
                <div className={`flex items-center text-sm ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {trend >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                  {Math.abs(trend)}%
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {globalStats.present}/{globalStats.total} classes attended
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Present</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {globalStats.present}
            </div>
            <div className="text-xs text-muted-foreground">Classes</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Absent</div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {globalStats.absent}
            </div>
            <div className="text-xs text-muted-foreground">Classes</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {globalStats.total}
            </div>
            <div className="text-xs text-muted-foreground">Classes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
