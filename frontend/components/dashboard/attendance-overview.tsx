"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, AlertCircle, Book } from "lucide-react"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { Badge } from "@/components/ui/badge"

interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  className: string;
  status: "present" | "absent";
  classType?: string;
}

interface ClassEntry {
  id: string;
  name: string;
  subject?: string; // Add for backward compatibility
  classType?: string;
  type?: string;
}

interface ClassAttendance {
  name: string;
  percentage: number;
  color: string;
  classType?: string;
  classId?: string;
}

export function AttendanceOverview() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const [overallAttendance, setOverallAttendance] = useState(0)
  const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([])
  const [progress, setProgress] = useState(0)
  const [classProgress, setClassProgress] = useState<number[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Load attendance data from localStorage
  useEffect(() => {
    const attendanceRecords = getFromLocalStorage<any[]>('attendance_records', []);
    const schedule = getFromLocalStorage<{classes: ClassEntry[]}>('schedule', {classes: []});
    const classes = schedule.classes || [];
    
    console.log('AttendanceOverview - Records:', attendanceRecords.length, 'Classes:', classes.length);
    
    try {
      if (attendanceRecords.length === 0) {
        setIsLoading(false);
        setHasData(false);
        return;
      }
      
      // Calculate overall attendance
      const totalRecords = attendanceRecords.length;
      const presentRecords = attendanceRecords.filter(r => r.status === 'present').length;
      const calculatedOverall = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
      setOverallAttendance(calculatedOverall);
      
      // Group records by subject/class name
      const subjectGroups: Record<string, {
        name: string;
        classType: string;
        total: number;
        present: number;
      }> = {};
      
      attendanceRecords.forEach(record => {
        const subjectName = record.subject || record.className || 'Unknown';
        const classType = record.classType || 'Lecture';
        const key = `${subjectName.toLowerCase()}-${classType.toLowerCase()}`;
        
        if (!subjectGroups[key]) {
          subjectGroups[key] = {
            name: subjectName,
            classType: classType,
            total: 0,
            present: 0
          };
        }
        
        subjectGroups[key].total += 1;
        if (record.status === 'present') {
          subjectGroups[key].present += 1;
        }
      });
      
      // Convert to display format
      const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-yellow-500", "bg-teal-500", "bg-indigo-500", "bg-orange-500"];
      
      const calculatedClassAttendance: ClassAttendance[] = Object.entries(subjectGroups)
        .map(([key, data], index) => {
          const percentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
          return {
            name: data.name,
            percentage: percentage,
            color: colors[index % colors.length],
            classType: data.classType,
            classId: key
          };
        })
        .sort((a, b) => b.percentage - a.percentage);
      
      console.log('AttendanceOverview - Calculated classes:', calculatedClassAttendance.length);
      
      setClassAttendance(calculatedClassAttendance);
      setClassProgress(Array(calculatedClassAttendance.length).fill(0));
      setHasData(calculatedClassAttendance.length > 0);
      
    } catch (error) {
      console.error("Error processing attendance data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Animate progress bars
  useEffect(() => {
    if (isVisible && hasData) {
      const timer = setTimeout(() => {
        setProgress(overallAttendance)
      }, 300)

      // Animate class progress bars with staggered delay
      classAttendance.forEach((_, index) => {
        setTimeout(
          () => {
            setClassProgress((prev) => {
              const newProgress = [...prev]
              newProgress[index] = classAttendance[index].percentage
              return newProgress
            })
          },
          500 + index * 200,
        )
      })

      return () => clearTimeout(timer)
    }
  }, [isVisible, hasData, overallAttendance, classAttendance])

  // Intersection Observer for entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  const getAnimationClass = () => {
    return isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            <span>Class-wise Attendance</span>
          </CardTitle>
          <CardDescription>Your attendance breakdown by class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-12">
            <div key="loading-spinner" className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasData) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            <span>Class-wise Attendance</span>
          </CardTitle>
          <CardDescription>Your attendance breakdown by class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No attendance data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start marking your attendance to see your performance by class
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card ref={ref} className={`transition-all duration-700 ease-out shadow-lg hover:shadow-xl ${getAnimationClass()}`}>
      <CardHeader className="pb-2 transition-all duration-300 hover:bg-primary/5">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <BarChart className="h-5 w-5 text-primary" />
          <span>Class-wise Attendance</span>
        </CardTitle>
        <CardDescription>Your attendance breakdown by class</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2.5">
          {classAttendance.map((classItem, index) => (
            <div
              key={`class-${classItem.name}-${index}`}
              className={`transition-all duration-300 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="p-2.5 border rounded-md flex items-center justify-between overflow-hidden relative border-gray-200 bg-card hover:bg-accent/5">
                {/* Left colored bar */}
                <div className={`absolute left-0 top-0 w-1 h-full ${getStatusColor(classProgress[index])}`}></div>
                
                {/* Class info */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Book className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm uppercase text-foreground">{classItem.name}</span>
                  </div>
                  
                  <div className="flex">
                    <Badge variant="outline" className="text-xs">
                      {classItem.classType || "CLASS"}
                    </Badge>
                  </div>
                </div>
                
                {/* Percentage */}
                <div className="flex items-center">
                  <div
                    className={`font-bold text-lg ${
                      classProgress[index] >= 90
                        ? "text-green-600"
                        : classProgress[index] >= 75
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {classProgress[index]}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusColor(percentage: number): string {
  if (percentage >= 90) return "bg-green-500";
  if (percentage >= 75) return "bg-yellow-500";
  return "bg-red-500";
}
