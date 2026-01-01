"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Calendar } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { buildApiUrl } from "@/lib/api"

interface Holiday {
  id: string
  day: number
  month: number
  year: number
  reason?: string
  semester: string
  createdAt: string
}

interface HolidayListProps {
  currentSemester: string
  onRefresh?: () => void
}

export function HolidayList({ currentSemester, onRefresh }: HolidayListProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([])

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const loadHolidays = async () => {
    try {
      const response = await fetch(buildApiUrl('/holidays'), {
        headers: {
          'Authorization': `Bearer ${getFromLocalStorage('trackly_token', '')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const semesterHolidays = data.data.filter((h: any) => h.semester === currentSemester)
        setHolidays(semesterHolidays)
      }
    } catch (error) {
      console.error('Error loading holidays:', error)
    }
  }

  useEffect(() => {
    if (currentSemester) {
      loadHolidays()
    }
  }, [currentSemester])

  const isDateInPast = (day: number, month: number, year: number) => {
    const holidayDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return holidayDate < today
  }

  const removeHoliday = async (holiday: Holiday) => {
    if (isDateInPast(holiday.day, holiday.month, holiday.year)) {
      toast({
        title: "Error",
        description: "Cannot remove holiday for past dates",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(buildApiUrl(`/holidays/${holiday.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getFromLocalStorage('trackly_token', '')}`
        }
      })

      if (response.ok) {
        await loadHolidays()
        onRefresh?.()
        toast({
          title: "Success",
          description: "Holiday removed successfully"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove holiday",
        variant: "destructive"
      })
    }
  }

  const sortedHolidays = holidays.sort((a, b) => {
    const dateA = new Date(a.year, a.month - 1, a.day)
    const dateB = new Date(b.year, b.month - 1, b.day)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Holiday List
        </CardTitle>
        <CardDescription>
          Manage holidays for Semester {currentSemester}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedHolidays.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No holidays added yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedHolidays.map((holiday) => {
              const isPast = isDateInPast(holiday.day, holiday.month, holiday.year)
              return (
                <div 
                  key={holiday.id} 
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    isPast ? 'bg-muted/50 opacity-75' : 'bg-background'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={isPast ? "secondary" : "default"}>
                        {holiday.day} {months[holiday.month - 1]}
                      </Badge>
                      {isPast && (
                        <Badge variant="outline" className="text-xs">
                          Past
                        </Badge>
                      )}
                    </div>
                    {holiday.reason && (
                      <p className="text-sm text-muted-foreground">{holiday.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!isPast && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHoliday(holiday)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}