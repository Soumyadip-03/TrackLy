"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Calendar, BookOpen } from "lucide-react"
import { format } from "date-fns"
import { fetchWithAuth } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

interface SubjectStat {
  name: string
  code: string
  classType: string
  attendedClasses: number
  totalClasses: number
  percentage: number
}

interface ArchivedSemester {
  semester: string
  startDate: string
  endDate: string
  totalAttended: number
  totalClasses: number
  overallPercentage: number
  subjects: SubjectStat[]
}

export function PreviousSemesters() {
  const [semesters, setSemesters] = useState<ArchivedSemester[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadArchivedSemesters()
  }, [])

  const loadArchivedSemesters = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetchWithAuth('/academic-period/archived/all')
      const data = await response.json()
      
      if (data.success) {
        setSemesters(data.data || [])
      }
    } catch (error) {
      console.error("Error loading archived semesters:", error)
      toast({
        title: "Error",
        description: "Failed to load previous semesters",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (semesters.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">No previous semesters found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Completed semesters will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {semesters.map((semester) => (
        <Card key={semester.semester} className="shadow-md hover:shadow-lg transition-all">
          <CardHeader className="pb-2 pt-3 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Semester {semester.semester}</CardTitle>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(semester.startDate), "dd/MM/yyyy")} - {format(new Date(semester.endDate), "dd/MM/yyyy")}
                </span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-3 pb-3 px-4">
            {/* Overall Attendance */}
            <div className="mb-3 p-2 bg-muted/50 rounded border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs">Total Attendance</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-base font-bold ${getPercentageColor(semester.overallPercentage)}`}>
                    {semester.totalAttended}/{semester.totalClasses}
                  </span>
                  <span className={`text-sm font-semibold ${getPercentageColor(semester.overallPercentage)}`}>
                    ({semester.overallPercentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Subjects List - Two Columns */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-xs">Subjects</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {semester.subjects.map((subject, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-1.5 rounded border hover:bg-accent/50 transition-colors text-xs"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="font-medium truncate">
                        {subject.name} {subject.code && `[${subject.code}]`}
                      </div>
                      {subject.classType !== 'none' && (
                        <div className="text-[10px] text-muted-foreground uppercase">
                          {subject.classType}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`text-xs font-semibold ${getPercentageColor(subject.percentage)}`}>
                        {subject.attendedClasses}/{subject.totalClasses}
                      </span>
                      <span className={`text-xs font-semibold ${getPercentageColor(subject.percentage)}`}>
                        ({subject.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
