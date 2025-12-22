"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, XCircle, Filter, CalendarDays, ListChecks, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subDays, compareDesc } from "date-fns"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"

type ActivityType = "present" | "absent" | "calculator" | "todo_completed" | "todo_added" | "calendar_event" | "points" | "subject_added"

type Activity = {
  id: string
  type: ActivityType
  subject?: string
  description: string
  timestamp: Date | string // Date for runtime, string when stored
  relatedId?: string // ID of related item (todo, event, etc.)
}

export function RecentActivity() {
  const [filter, setFilter] = useState<"all" | "attendance" | "todo" | "calendar" | "other">("all")
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("week")
  const [activities, setActivities] = useState<Activity[]>([])

  // Load and process user activity data
  useEffect(() => {
    // Get activity log from localStorage or initialize if it doesn't exist
    let activityLog = getFromLocalStorage<Activity[]>('activity_log', []);
    
    // Ensure timestamps are Date objects (they're stored as strings in localStorage)
    activityLog = activityLog.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp)
    }));
    
    // Generate any new activities based on user data
    const newActivities = generateActivitiesFromUserData(activityLog);
    
    // Combine existing and new activities, avoiding duplicates
    const combinedActivities = [...activityLog];
    
    newActivities.forEach(newActivity => {
      // Check if this activity already exists by comparing ID or content
      const exists = combinedActivities.some(existing => 
        existing.id === newActivity.id || 
        (existing.type === newActivity.type && 
         existing.description === newActivity.description &&
         existing.relatedId === newActivity.relatedId)
      );
      
      if (!exists) {
        combinedActivities.push(newActivity);
      }
    });
    
    // Sort by timestamp, newest first
    combinedActivities.sort((a, b) => {
      const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return compareDesc(dateA, dateB);
    });
    
    // Update state and save back to localStorage
    setActivities(combinedActivities);
    
    // Convert Date objects to strings for storage
    const activitiesForStorage = combinedActivities.map(activity => ({
      ...activity,
      timestamp: activity.timestamp instanceof Date ? activity.timestamp.toISOString() : activity.timestamp
    }));
    
    saveToLocalStorage('activity_log', activitiesForStorage);
  }, []);

  // Generate activities from various user data sources
  const generateActivitiesFromUserData = (existingActivities: Activity[]): Activity[] => {
    const newActivities: Activity[] = [];
    const now = new Date();
    
    // 1. Process attendance records
    const attendanceRecords = getFromLocalStorage<any[]>('attendance_records', []);
    attendanceRecords.forEach(record => {
      if (!record.id || !record.date || !record.subject) return;
      
      // Skip if we already have this attendance record in our activities
      if (existingActivities.some(a => a.relatedId === record.id)) return;
      
      const recordDate = new Date(record.date);
      
      newActivities.push({
        id: `attendance-${record.id}`,
        type: record.status === 'present' ? 'present' : 'absent',
        subject: record.subject,
        description: `Marked ${record.status} in ${record.subject}`,
        timestamp: recordDate,
        relatedId: record.id
      });
    });
    
    // 2. Process completed todos
    const todos = getFromLocalStorage<any[]>('todos', []);
    todos.forEach(todo => {
      if (!todo.id) return;
      
      // Check for completed todos not already in activities
      if (todo.completed && !existingActivities.some(a => a.relatedId === `todo-completed-${todo.id}`)) {
        const completionDate = todo.completedAt ? new Date(todo.completedAt) : now;
        
        newActivities.push({
          id: `todo-completed-${todo.id}-${completionDate.getTime()}`,
          type: 'todo_completed',
          description: `Completed task: "${todo.title}"`,
          timestamp: completionDate,
          relatedId: `todo-completed-${todo.id}`
        });
      }
      
      // Check for newly added todos
      const creationDate = todo.createdAt ? new Date(todo.createdAt) : now;
      if (!existingActivities.some(a => a.relatedId === `todo-added-${todo.id}`)) {
        newActivities.push({
          id: `todo-added-${todo.id}`,
          type: 'todo_added',
          description: `Added new task: "${todo.title}"`,
          timestamp: creationDate,
          relatedId: `todo-added-${todo.id}`
        });
      }
    });
    
    // 3. Process calendar events
    const calendarEvents = getFromLocalStorage<any[]>('calendar_todos', []);
    calendarEvents.forEach(event => {
      if (!event.id) return;
      
      // Skip if we already have this calendar event in our activities
      if (existingActivities.some(a => a.relatedId === `calendar-${event.id}`)) return;
      
      newActivities.push({
        id: `calendar-${event.id}`,
        type: 'calendar_event',
        subject: event.subject,
        description: `Added calendar event: "${event.title}"`,
        timestamp: event.createdAt ? new Date(event.createdAt) : now,
        relatedId: `calendar-${event.id}`
      });
    });
    
    // 4. Process subject additions
    const subjects = getFromLocalStorage<any[]>('subjects', []);
    subjects.forEach(subject => {
      if (!subject.id) return;
      
      // Skip if we already have this subject in our activities
      if (existingActivities.some(a => a.relatedId === `subject-${subject.id}`)) return;
      
      newActivities.push({
        id: `subject-${subject.id}`,
        type: 'subject_added',
        subject: subject.name,
        description: `Added subject: ${subject.name}`,
        timestamp: now,
        relatedId: `subject-${subject.id}`
      });
    });
    
    return newActivities;
  };

  // Filter activities based on selected filter and time range
  const filteredActivities = activities.filter((activity) => {
    // Filter by type
    if (filter !== "all") {
      if (filter === "attendance" && activity.type !== "present" && activity.type !== "absent") return false;
      if (filter === "todo" && activity.type !== "todo_completed" && activity.type !== "todo_added") return false;
      if (filter === "calendar" && activity.type !== "calendar_event") return false;
      if (filter === "other" && 
          (activity.type === "present" || 
           activity.type === "absent" || 
           activity.type === "todo_completed" || 
           activity.type === "todo_added" || 
           activity.type === "calendar_event")) return false;
    }

    // Filter by time range
    if (timeRange !== "all") {
      const now = new Date();
      const activityDate = activity.timestamp instanceof Date ? 
        activity.timestamp : new Date(activity.timestamp);
      
      if (timeRange === "today") {
        return activityDate.toDateString() === now.toDateString();
      } else if (timeRange === "week") {
        const weekAgo = subDays(now, 7);
        return activityDate >= weekAgo;
      } else if (timeRange === "month") {
        const monthAgo = subDays(now, 30);
        return activityDate >= monthAgo;
      }
    }

    return true;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "present":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "todo_completed":
      case "todo_added":
        return <ListChecks className="h-4 w-4 text-indigo-600" />;
      case "calendar_event":
        return <CalendarDays className="h-4 w-4 text-blue-600" />;
      case "points":
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "present":
        return "bg-green-100 dark:bg-green-900/30";
      case "absent":
        return "bg-red-100 dark:bg-red-900/30";
      case "todo_completed":
      case "todo_added":
        return "bg-indigo-100 dark:bg-indigo-900/30";
      case "calendar_event":
        return "bg-blue-100 dark:bg-blue-900/30";
      case "points":
        return "bg-yellow-100 dark:bg-yellow-900/30";
      case "subject_added":
        return "bg-purple-100 dark:bg-purple-900/30";
      case "calculator":
        return "bg-blue-100 dark:bg-blue-900/30";
      default:
        return "bg-gray-100 dark:bg-gray-800";
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (date.toDateString() === subDays(today, 1).toDateString()) {
      return `Yesterday, ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Recent Activity</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="todo">Todo Items</SelectItem>
                <SelectItem value="calendar">Calendar</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>Your latest attendance updates and activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex items-start gap-4 p-3 rounded-lg border ${
                  index !== filteredActivities.length - 1 ? "border-b" : ""
                } animate-fadeIn`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`h-8 w-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</p>
                </div>
                {activity.subject && (
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    {activity.subject}
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No activities to display for the selected filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
