"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, AlertCircle, Book } from "lucide-react"
import { getFromLocalStorage } from "@/lib/storage-utils"

interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  status: "present" | "absent";
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  attendedClasses?: number;
  totalClasses?: number;
}

export function SubjectAttendanceList() {
  const [isLoading, setIsLoading] = useState(true)
  const [subjects, setSubjects] = useState<{
    name: string;
    code: string;
    percentage: number;
  }[]>([])

  useEffect(() => {
    // Load subjects and attendance records from localStorage
    const savedSubjects = getFromLocalStorage<Subject[]>('subjects', []);
    const attendanceRecords = getFromLocalStorage<AttendanceRecord[]>('attendance_records', []);
    
    if (savedSubjects.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      // Calculate attendance percentage for each subject
      const subjectsWithAttendance = savedSubjects.map(subject => {
        // Find records for this subject
        const subjectRecords = attendanceRecords.filter(
          record => record.subject.toLowerCase() === subject.name.toLowerCase()
        );
        
        const totalRecords = subjectRecords.length;
        const presentRecords = subjectRecords.filter(record => record.status === "present").length;
        
        // Calculate percentage
        const percentage = totalRecords > 0
          ? Math.round((presentRecords / totalRecords) * 100)
          : 0;
        
        return {
          name: subject.name,
          code: subject.code || '',
          percentage
        };
      });
      
      // Sort by percentage (highest first)
      subjectsWithAttendance.sort((a, b) => b.percentage - a.percentage);
      
      setSubjects(subjectsWithAttendance);
    } catch (error) {
      console.error("Error calculating subject attendance:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to determine status color
  const getStatusColor = (percentage: number) => {
    if (percentage === 0) return "bg-gray-300";
    if (percentage >= 95) return "bg-green-500";
    if (percentage >= 90) return "bg-blue-500";
    if (percentage >= 85) return "bg-yellow-500";
    if (percentage >= 80) return "bg-orange-500";
    return "bg-red-500";
  };

  // Helper function to determine status text
  const getStatusText = (percentage: number) => {
    if (percentage === 0) return "No records";
    if (percentage >= 95) return "Excellent";
    if (percentage >= 90) return "Good";
    if (percentage >= 85) return "Average";
    if (percentage >= 80) return "At risk";
    return "Critical";
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            <span>Subject Attendance</span>
          </CardTitle>
          <CardDescription>Attendance for all your subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subjects.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            <span>Subject Attendance</span>
          </CardTitle>
          <CardDescription>Attendance for all your subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No subjects found</p>
            <p className="text-xs text-muted-foreground mt-2">
              Add your subjects in the Profile section
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Book className="h-5 w-5 text-primary" />
          <span>Subject Attendance</span>
        </CardTitle>
        <CardDescription>Attendance for all your subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {subjects.map((subject, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-2 border-l-4 rounded-md border-primary/60 bg-card hover:bg-accent/50 transition-colors duration-200"
            >
              <div>
                <p className="font-medium text-sm">{subject.name}</p>
                {subject.code && (
                  <p className="text-xs text-muted-foreground">{subject.code}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {getStatusText(subject.percentage)}
                </span>
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full text-white ${getStatusColor(subject.percentage)}`}>
                    {subject.percentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 