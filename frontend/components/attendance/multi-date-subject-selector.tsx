"use client"

import { useState, useEffect } from "react"
import { format, addDays, isBefore, isAfter, parseISO } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getFromLocalStorage } from "@/lib/storage-utils"

interface Subject {
  id: string;
  name: string;
  code?: string;
  schedule?: number[]; // Days of week (1 = Monday)
}

interface ScheduleClass {
  id: string;
  day: string;
  name: string;
  time: string;
  room?: string;
}

interface ScheduleData {
  classes: ScheduleClass[];
}

// Extract weekday schedule from class schedule or user preferences
function getSubjectSchedule(subject: Subject): number[] {
  // If subject has a schedule property, use it
  if (subject.schedule && Array.isArray(subject.schedule)) {
    return subject.schedule;
  }
  
  // Check if there's any schedule data in localStorage
  const scheduleData = getFromLocalStorage<ScheduleData>('schedule', { classes: [] });
  
  if (scheduleData && scheduleData.classes) {
    // Find classes for this subject
    const subjectClasses = scheduleData.classes.filter(
      (cls) => cls.name === subject.name
    );
    
    // Extract days from classes
    if (subjectClasses.length > 0) {
      const dayMap: {[key: string]: number} = {
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6,
        'Sunday': 7
      };
      
      // Create an array of day numbers based on class schedule
      const days = subjectClasses
        .map(cls => {
          // Ensure day is a valid key in dayMap
          const day = cls.day;
          return dayMap[day] || 0;
        })
        .filter(day => day > 0);
        
      // Remove duplicates and return
      return Array.from(new Set(days));
    }
  }
  
  // Default: show every weekday (1-5, Mon-Fri)
  return [1, 2, 3, 4, 5];
}

type DateSubjectSelection = {
  [date: string]: string[] // date -> array of subject IDs
}

interface MultiDateSubjectSelectorProps {
  startDate: Date
  endDate: Date
  onSelectionChangeAction: (selection: DateSubjectSelection) => void
}

export function MultiDateSubjectSelector({ startDate, endDate, onSelectionChangeAction }: MultiDateSubjectSelectorProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(format(startDate, "yyyy-MM-dd"));
  const [selection, setSelection] = useState<DateSubjectSelection>({});
  const [currentView, setCurrentView] = useState<"calendar" | "subjects">("calendar");

  // Load subjects from localStorage
  useEffect(() => {
    const loadSubjects = () => {
      const savedSubjects = getFromLocalStorage<Subject[]>('subjects', []);
      
      // Process each subject to ensure it has a schedule
      const processedSubjects = savedSubjects.map(subject => ({
        ...subject,
        schedule: getSubjectSchedule(subject)
      }));
      
      setSubjects(processedSubjects);
      setIsLoading(false);
    };
    
    loadSubjects();
  }, []);

  // Generate dates between start and end
  const dateRange: Date[] = []
  let currentDate = startDate
  while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
    dateRange.push(currentDate)
    currentDate = addDays(currentDate, 1)
  }

  // Get day of week (0-6, where 0 is Sunday)
  const getDayOfWeek = (date: Date) => {
    const day = date.getDay()
    return day === 0 ? 7 : day // Convert Sunday from 0 to 7 to match our schedule format
  }

  // Get subjects scheduled for a specific date
  const getSubjectsForDate = (date: Date) => {
    const dayOfWeek = getDayOfWeek(date)
    return subjects.filter((subject) => subject.schedule?.includes(dayOfWeek))
  }

  // Toggle subject selection for a date
  const toggleSubject = (date: string, subjectId: string) => {
    setSelection((prev) => {
      const newSelection = { ...prev }
      if (!newSelection[date]) {
        newSelection[date] = [subjectId]
      } else if (newSelection[date].includes(subjectId)) {
        newSelection[date] = newSelection[date].filter((id) => id !== subjectId)
        if (newSelection[date].length === 0) {
          delete newSelection[date]
        }
      } else {
        newSelection[date] = [...newSelection[date], subjectId]
      }
      return newSelection
    })
  }

  // Check if a subject is selected for a date
  const isSubjectSelected = (date: string, subjectId: string) => {
    return selection[date]?.includes(subjectId) || false
  }

  // Get count of selected subjects for a date
  const getSelectedCount = (date: string) => {
    return selection[date]?.length || 0
  }

  // Navigate to previous/next date
  const navigateDate = (direction: "prev" | "next") => {
    const current = parseISO(selectedDate)
    const newDate = direction === "prev" ? addDays(current, -1) : addDays(current, 1)

    // Don't go before start date or after end date
    if (isBefore(newDate, startDate) || isAfter(newDate, endDate)) {
      return
    }

    setSelectedDate(format(newDate, "yyyy-MM-dd"))
  }

  // Update parent component when selection changes
  useEffect(() => {
    onSelectionChangeAction(selection)
  }, [selection, onSelectionChangeAction])

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Multi-Date Subject Selection</CardTitle>
          <CardDescription>Loading subject data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // No subjects found
  if (subjects.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Multi-Date Subject Selection</CardTitle>
          <CardDescription>No subjects available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No subjects found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please add subjects in your profile settings
            </p>
            <Button 
              className="mt-4"
              variant="outline"
              onClick={() => window.location.href = '/settings/profile'}
            >
              Go to Profile Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Multi-Date Subject Selection</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView("calendar")}
              className={cn("h-8 w-8 p-0", currentView === "calendar" && "bg-primary/10 text-primary")}
            >
              <Calendar className="h-4 w-4" />
              <span className="sr-only">Calendar View</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView("subjects")}
              className={cn("h-8 w-8 p-0", currentView === "subjects" && "bg-primary/10 text-primary")}
            >
              <CheckCircle className="h-4 w-4" />
              <span className="sr-only">Subject View</span>
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Select subjects to mark as absent for each date between {format(startDate, "MMM d")} and{" "}
          {format(endDate, "MMM d")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {currentView === "calendar" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate("prev")}
                disabled={selectedDate === format(startDate, "yyyy-MM-dd")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h3 className="text-lg font-medium">{format(parseISO(selectedDate), "EEEE, MMMM d")}</h3>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate("next")}
                disabled={selectedDate === format(endDate, "yyyy-MM-dd")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="p-4">
                <Label className="mb-2 block">Scheduled Subjects</Label>
                <div className="space-y-2">
                  {getSubjectsForDate(parseISO(selectedDate)).length > 0 ? (
                    getSubjectsForDate(parseISO(selectedDate)).map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-3 w-3 rounded-full",
                              isSubjectSelected(selectedDate, subject.id) ? "bg-red-500" : "bg-green-500",
                            )}
                          />
                          <span>{subject.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSubject(selectedDate, subject.id)}
                          className={cn("gap-1", isSubjectSelected(selectedDate, subject.id) && "text-red-500")}
                        >
                          {isSubjectSelected(selectedDate, subject.id) ? (
                            <>
                              <XCircle className="h-4 w-4" />
                              <span>Mark Present</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              <span>Mark Absent</span>
                            </>
                          )}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground">
                      No subjects scheduled for this date
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Label className="mb-2 block">Date Overview</Label>
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 space-y-2">
                {dateRange.map((date) => {
                  const dateStr = format(date, "yyyy-MM-dd")
                  const formattedDate = format(date, "EEE, MMM d")
                  const subjectsForDate = getSubjectsForDate(date)
                  const selectedCount = getSelectedCount(dateStr)

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        "rounded-md border p-3 transition-all hover:bg-muted/50",
                        selectedDate === dateStr && "border-primary bg-primary/5",
                        selectedCount > 0 && "border-red-200 dark:border-red-800",
                      )}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formattedDate}</span>
                          {selectedCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {selectedCount} absent
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {subjectsForDate.length > 0 ? (
                            <Badge variant="outline">{subjectsForDate.length} subjects</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted/50">
                              No classes
                            </Badge>
                          )}
                        </div>
                      </div>

                      {subjectsForDate.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {subjectsForDate.map((subject) => (
                            <Badge
                              key={subject.id}
                              variant={isSubjectSelected(dateStr, subject.id) ? "destructive" : "secondary"}
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSubject(dateStr, subject.id)
                              }}
                            >
                              {subject.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t p-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Total dates with absences: <span className="font-medium">{Object.keys(selection).length}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Total subjects marked absent:{" "}
            <span className="font-medium">
              {Object.values(selection).reduce((total, subjects) => total + subjects.length, 0)}
            </span>
          </p>
        </div>
        <Button variant="default" size="sm" disabled={Object.keys(selection).length === 0}>
          Apply Selection
        </Button>
      </CardFooter>
    </Card>
  )
}
