"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

interface Subject {
  id: string;
  name: string;
  code?: string;
  attendedClasses?: number;
  totalClasses?: number;
}

export function SubjectAttendanceAnalytics() {
  const [subjects, setSubjects] = useState<{
    name: string;
    percentage: number;
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { fetchWithAuth } = await import('@/lib/api');
        const subjectsRes = await fetchWithAuth('/subject');
        
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          const subjectsArray = subjectsData.data || [];
          
          const formattedSubjects = subjectsArray.map((subject: Subject) => ({
            name: subject.name,
            percentage: (subject.totalClasses || 0) > 0 
              ? Math.round((subject.attendedClasses || 0) / (subject.totalClasses || 1) * 100) 
              : 0
          }));
          
          setSubjects(formattedSubjects);
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubjects();

    const handleSubjectUpdate = () => loadSubjects();
    window.addEventListener('subjectsUpdated', handleSubjectUpdate);
    window.addEventListener('attendanceUpdated', handleSubjectUpdate);
    
    return () => {
      window.removeEventListener('subjectsUpdated', handleSubjectUpdate);
      window.removeEventListener('attendanceUpdated', handleSubjectUpdate);
    };
  }, []);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500/20 border-green-500";
    if (percentage >= 75) return "bg-blue-500/20 border-blue-500";
    if (percentage >= 60) return "bg-yellow-500/20 border-yellow-500";
    return "bg-red-500/20 border-red-500";
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-700 dark:text-green-300";
    if (percentage >= 75) return "text-blue-700 dark:text-blue-300";
    if (percentage >= 60) return "text-yellow-700 dark:text-yellow-300";
    return "text-red-700 dark:text-red-300";
  };

  if (isLoading) {
    return (
      <Card className="shadow-md h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Attendance Analytics
          </CardTitle>
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
      <Card className="shadow-md h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Attendance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            No subjects found. Add subjects to see analytics.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Attendance Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-5rem)] pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full content-start">
          {subjects.map((subject, index) => (
            <div
              key={index}
              className={`relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${getStatusColor(subject.percentage)}`}
            >
              <div className="flex flex-col gap-2">
                <div className={`text-xs font-medium uppercase truncate ${getTextColor(subject.percentage)}`} title={subject.name}>
                  {subject.name}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getTextColor(subject.percentage)}`}>{subject.percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
