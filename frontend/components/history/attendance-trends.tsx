"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
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
import { getFromLocalStorage } from "@/lib/storage-utils"
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
import { generateAutoPresentRecords, isHoliday, isOffDay } from "@/lib/attendance-utils"

interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  status: "present" | "absent";
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface WeeklyData {
  name: string;
  attendance: number;
  weekStart: string; // For sorting
}

interface MonthlyData {
  name: string;
  attendance: number;
  monthStart: string; // For sorting
}

interface SubjectData {
  [key: string]: any; // Dynamic keys for subject names
}

export function AttendanceTrends() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    // Load attendance records from localStorage with auto-present for past days
    const subjects = getFromLocalStorage<Subject[]>('subjects', []);
    
    // Get records with auto-present for past days
    const allRecords = generateAutoPresentRecords();
    
    if (allRecords.length === 0) {
      setIsLoading(false);
      return;
    }
    
    // Set hasData flag
    setHasData(true);
    
    try {
      // Convert string dates to Date objects
      const recordsWithDates = allRecords.map(record => ({
        ...record,
        dateObj: parseISO(record.date)
      }));
      
      // Filter out records for holidays and off days
      const filteredRecords = recordsWithDates.filter(record => {
        // Skip records for holidays or off days
        return !isHoliday(record.date) && !isOffDay(record.date);
      }).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      
      // Only proceed if we have filtered records
      if (filteredRecords.length === 0) {
        setIsLoading(false);
        setHasData(false);
        return;
      }
      
      // Get date range for calculations
      const oldestDate = filteredRecords[0].dateObj;
      const now = new Date();
      
      // Calculate weekly attendance data
      const weeklyAttendance = calculateWeeklyAttendance(filteredRecords, oldestDate, now);
      setWeeklyData(weeklyAttendance);
      
      // Calculate monthly attendance data
      const monthlyAttendance = calculateMonthlyAttendance(filteredRecords, oldestDate, now);
      setMonthlyData(monthlyAttendance);
      
      // Calculate subject-wise attendance data
      const subjectAttendance = calculateSubjectAttendance(filteredRecords, subjects);
      setSubjectData(subjectAttendance);
      
    } catch (error) {
      console.error("Error processing attendance data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const calculateWeeklyAttendance = (
    records: (AttendanceRecord & { dateObj: Date })[], 
    startDate: Date, 
    endDate: Date
  ): WeeklyData[] => {
    // Get all weeks in the interval, limited to last 12 weeks
    let weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
    
    // Limit to last 12 weeks at most
    if (weeks.length > 12) {
      weeks = weeks.slice(-12);
    }
    
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Filter records for this week
      const weekRecords = records.filter(record => 
        isWithinInterval(record.dateObj, { start: weekStart, end: weekEnd })
      );
      
      // Calculate attendance percentage
      const totalRecords = weekRecords.length;
      const presentRecords = weekRecords.filter(record => record.status === "present").length;
      const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
      
      return {
        name: `Week ${format(weekStart, "M/d")}`,
        attendance: attendancePercentage,
        weekStart: formatISO(weekStart)
      };
    }).filter(week => week.attendance > 0 || records.some(r => 
      isWithinInterval(r.dateObj, { 
        start: parseISO(week.weekStart), 
        end: endOfWeek(parseISO(week.weekStart), { weekStartsOn: 1 }) 
      })
    ));
  };
  
  const calculateMonthlyAttendance = (
    records: (AttendanceRecord & { dateObj: Date })[], 
    startDate: Date, 
    endDate: Date
  ): MonthlyData[] => {
    // Get all months in the interval, limited to last 6 months
    const sixMonthsAgo = subMonths(endDate, 6);
    const startMonth = startDate < sixMonthsAgo ? sixMonthsAgo : startDate;
    const months = eachMonthOfInterval({ start: startMonth, end: endDate });
    
    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      
      // Filter records for this month
      const monthRecords = records.filter(record => 
        isWithinInterval(record.dateObj, { start: monthStart, end: monthEnd })
      );
      
      // Calculate attendance percentage
      const totalRecords = monthRecords.length;
      const presentRecords = monthRecords.filter(record => record.status === "present").length;
      const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
      
      return {
        name: format(monthStart, "MMM"),
        attendance: attendancePercentage,
        monthStart: formatISO(monthStart)
      };
    }).filter(month => month.attendance > 0);
  };
  
  const calculateSubjectAttendance = (
    records: (AttendanceRecord & { dateObj: Date })[], 
    subjects: Subject[]
  ): SubjectData[] => {
    // Get all weeks for which we have attendance data
    const weeks = Array.from(new Set(
      records.map(record => {
        const weekStart = startOfWeek(record.dateObj, { weekStartsOn: 1 });
        return format(weekStart, "yyyy-MM-dd");
      })
    )).sort();
    
    // Create a map of subject ID to name for easy lookup
    const subjectMap: Record<string, string> = {};
    subjects.forEach(subject => {
      subjectMap[subject.name] = subject.name;
    });
    
    // Initialize weekly subject attendance data
    return weeks.map(weekStr => {
      const weekStart = parseISO(weekStr);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Start with the week label
      const weekData: SubjectData = {
        name: `Week ${format(weekStart, "M/d")}`,
      };
      
      // Add attendance percentage for each subject this week
      subjects.forEach(subject => {
        // Filter records for this subject and week
        const subjectWeekRecords = records.filter(record => 
          record.subject === subject.name && 
          isWithinInterval(record.dateObj, { start: weekStart, end: weekEnd })
        );
        
        // Calculate attendance percentage
        const totalRecords = subjectWeekRecords.length;
        const presentRecords = subjectWeekRecords.filter(record => record.status === "present").length;
        
        // Only add to chart data if we have records for this subject this week
        if (totalRecords > 0) {
          const attendancePercentage = Math.round((presentRecords / totalRecords) * 100);
          
          // Use the actual subject name as the property
          const safeName = subject.name.replace(/\s+/g, '_');
          weekData[safeName] = attendancePercentage;
        }
      });
      
      return weekData;
    });
  };

  const EmptyStateMessage = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
      <h3 className="text-lg font-medium mb-2">No Attendance Data</h3>
      <p className="text-sm text-muted-foreground">
        Start marking your attendance to see your trends over time.
      </p>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Trends</CardTitle>
        <CardDescription>Visualize your attendance patterns over time</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner />
        ) : hasData ? (
          <Tabs defaultValue="weekly">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="subjects">By Subject</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="h-80 mt-4">
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

            <TabsContent value="monthly" className="h-80 mt-4">
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

            <TabsContent value="subjects" className="h-80 mt-4">
              {subjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={subjectData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
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
                    <Legend />
                    {/* Generate lines dynamically based on available subjects */}
                    {subjectData.length > 0 && 
                      Object.keys(subjectData[0])
                        .filter(key => key !== 'name')
                        .map((subject, index) => {
                          const colors = ["#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#0ea5e9", "#6366f1"];
                          const colorIndex = index % colors.length;
                          
                          return (
                            <Line
                              key={subject}
                              type="monotone"
                              dataKey={subject}
                              name={subject.replace(/_/g, ' ')}
                              stroke={colors[colorIndex]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          );
                        })
                    }
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
