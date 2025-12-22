"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Area,
  AreaChart,
  ComposedChart,
  Tooltip
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { AlertCircle } from "lucide-react"
import {
  startOfWeek,
  endOfWeek,
  parseISO,
  isWithinInterval,
  format,
  formatISO,
  subWeeks,
  endOfDay,
  startOfDay,
  subMonths,
  addDays,
  getDay
} from "date-fns"
import { calculateAttendanceExcludingHolidays } from "@/lib/attendance-utils"

interface AttendanceRecord {
  id: string;
  date: string;
  classId?: string;
  className?: string;
  status: "present" | "absent";
  classType?: string;
}

interface ClassEntry {
  id: string;
  name: string;
  type: string;
}

interface WeeklyData {
  name: string;
  overall: number;
}

export function WeeklyAttendanceChart() {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });

  useEffect(() => {
    // Load attendance records from localStorage
    const attendanceRecords = getFromLocalStorage<AttendanceRecord[]>('attendance_records', []);
    
    // Get accurate attendance data using utility functions
    const accurateOverallStats = calculateAttendanceExcludingHolidays(attendanceRecords);
    setGlobalStats(accurateOverallStats);
    
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
      
      // Get the current date for calculating weekly ranges
      const today = new Date();
      
      // Generate data for the last 5 weeks
      const weeklyData: WeeklyData[] = [];
      
      for (let i = 4; i >= 0; i--) {
        const weekEnd = i === 0 ? today : endOfDay(subWeeks(today, i));
        const weekStart = startOfDay(subWeeks(weekEnd, 1));
        
        // Filter records for this specific week
        const weekRecords = recordsWithDates.filter(record => 
          record.dateObj >= weekStart && record.dateObj <= weekEnd
        );
        
        // Create the data point for this week
        const weekData: WeeklyData = {
          name: i === 0 ? "This Week" : i === 1 ? "Last Week" : `Week -${i}`,
          overall: 0, // Will be set below
        };
        
        // Get attendance data for this week from accurate calculations
        // For overall, we can use the filtered weekly records
        const totalRecords = weekRecords.length;
        let weeklyOverallPercentage = 0;
        
        if (totalRecords > 0) {
          const presentRecords = weekRecords.filter(r => r.status === "present").length;
          weeklyOverallPercentage = Math.round((presentRecords / totalRecords) * 100);
        } else {
          // If no records for this week, use the overall stats as baseline
          weeklyOverallPercentage = accurateOverallStats.percentage;
        }
        
        weekData.overall = weeklyOverallPercentage;
        
        weeklyData.push(weekData);
      }
      
      // Sort in chronological order
      setData([...weeklyData].reverse());
      setHasData(true);
    } catch (error) {
      console.error("Error processing weekly attendance data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const EmptyStateMessage = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
      <h3 className="text-lg font-medium mb-2">No Attendance Data</h3>
      <p className="text-sm text-muted-foreground">
        Start marking your attendance to see your analytics here.
      </p>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
    </div>
  );

  // Enhanced color palette for chart elements
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#ef4444", // red
    "#84cc16", // lime
    "#14b8a6", // teal
    "#f97316"  // orange
  ];

  // Custom tooltip component for better visibility and formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border shadow-lg rounded-md p-3 z-50">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs font-medium">{entry.name}</span>
                </div>
                <span className="text-xs font-bold">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Common tooltip style for all charts
  const tooltipStyle = {
    backgroundColor: "var(--background)",
    borderColor: "var(--border)",
    borderRadius: "0.5rem",
    padding: "0.75rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    border: "2px solid var(--border)"
  };

  // Legend style configuration
  const legendProps = {
    formatter: (value: string) => <span style={{ fontSize: "0.875rem" }}>{value}</span>,
    iconSize: 10,
    wrapperStyle: { paddingTop: "10px" }
  };

  return (
    <div className="transition-all duration-500 ease-in-out">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Analytics</CardTitle>
          <CardDescription>Visualize your attendance data in different formats</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : hasData ? (
            <Tabs defaultValue="bar">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                <TabsTrigger value="line">Line Chart</TabsTrigger>
                <TabsTrigger value="area">Area Chart</TabsTrigger>
                <TabsTrigger value="composed">Composed</TabsTrigger>
              </TabsList>

              <TabsContent value="bar" className="h-80">
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        content={<CustomTooltip />}
                        wrapperStyle={{ zIndex: 1000 }}
                      />
                      <Legend 
                        {...legendProps}
                      />
                      <Bar dataKey="overall" name="Overall" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="line" className="h-80">
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        content={<CustomTooltip />}
                        wrapperStyle={{ zIndex: 1000 }}
                      />
                      <Legend 
                        {...legendProps}
                      />
                      <Line
                        type="monotone"
                        dataKey="overall"
                        name="Overall"
                        stroke="#0284c7"
                        strokeWidth={3}
                        dot={{ r: 6, fill: "#0284c7" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="area" className="h-80">
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        content={<CustomTooltip />}
                        wrapperStyle={{ zIndex: 1000 }}
                      />
                      <Legend 
                        {...legendProps}
                      />
                      <Area
                        type="monotone"
                        dataKey="overall"
                        name="Overall"
                        stroke="#0284c7"
                        fill="#0284c7"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="composed" className="h-80">
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        content={<CustomTooltip />}
                        wrapperStyle={{ zIndex: 1000 }}
                      />
                      <Legend 
                        {...legendProps}
                      />
                      <Area
                        type="monotone"
                        dataKey="overall"
                        name="Overall"
                        fill="#0284c7"
                        stroke="#0284c7"
                        fillOpacity={0.1}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          ) : (
            <EmptyStateMessage />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
