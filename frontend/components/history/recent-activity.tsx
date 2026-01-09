"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, XCircle, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subDays, compareDesc } from "date-fns"
import { fetchWithAuth } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

type Activity = {
  id: string
  type: "present" | "absent"
  subject: string
  description: string
  timestamp: Date
}

export function RecentActivity() {
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all")
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("week")
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      setIsLoading(true)
      
      // Fetch attendance from database
      const response = await fetchWithAuth('/attendance/history')
      const data = await response.json()
      const records = data.data || []
      
      // Convert to activities
      const newActivities: Activity[] = records.map((record: any) => ({
        id: record._id,
        type: record.status,
        subject: record.subjectName,
        description: `Marked ${record.status} in ${record.subjectName}`,
        timestamp: new Date(record.date)
      }))
      
      // Sort by timestamp, newest first
      newActivities.sort((a, b) => compareDesc(a.timestamp, b.timestamp))
      
      setActivities(newActivities)
    } catch (error) {
      console.error("Error loading activities:", error)
      toast({
        title: "Error",
        description: "Failed to load recent activity",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    // Filter by type
    if (filter !== "all") {
      if (filter === "present" && activity.type !== "present") return false
      if (filter === "absent" && activity.type !== "absent") return false
    }

    // Filter by time range
    if (timeRange !== "all") {
      const now = new Date()
      const activityDate = activity.timestamp
      
      if (timeRange === "today") {
        return activityDate.toDateString() === now.toDateString()
      } else if (timeRange === "week") {
        const weekAgo = subDays(now, 7)
        return activityDate >= weekAgo
      } else if (timeRange === "month") {
        const monthAgo = subDays(now, 30)
        return activityDate >= monthAgo
      }
    }

    return true
  })

  const getActivityIcon = (type: string) => {
    if (type === "present") {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getActivityColor = (type: string) => {
    if (type === "present") {
      return "bg-green-100 dark:bg-green-900/30"
    } else {
      return "bg-red-100 dark:bg-red-900/30"
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const today = new Date()
    
    if (timestamp.toDateString() === today.toDateString()) {
      return `Today, ${format(timestamp, "h:mm a")}`
    } else if (timestamp.toDateString() === subDays(today, 1).toDateString()) {
      return `Yesterday, ${format(timestamp, "h:mm a")}`
    } else {
      return format(timestamp, "MMM d, h:mm a")
    }
  }

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
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
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
        <CardDescription>Your latest attendance updates</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-4 p-3 rounded-lg border ${
                    index !== filteredActivities.length - 1 ? "border-b" : ""
                  }`}
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
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No activities to display for the selected filters</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
