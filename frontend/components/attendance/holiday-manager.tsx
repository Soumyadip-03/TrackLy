"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar, Plus } from "lucide-react"
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

interface HolidayManagerProps {
  currentSemester: string
  startDate?: Date
  endDate?: Date
  onHolidayAdded?: () => void
}

export function HolidayManager({ currentSemester, startDate, endDate, onHolidayAdded }: HolidayManagerProps) {
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ]

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const getValidYears = () => {
    if (!startDate || !endDate) return []
    const years = []
    for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
      years.push(year)
    }
    return years
  }

  const getDaysForSelectedMonth = () => {
    if (!selectedMonth || !startDate) return []
    const month = parseInt(selectedMonth)
    const years = getValidYears()
    const year = years.length > 0 ? years[0] : new Date().getFullYear()
    const daysInMonth = getDaysInMonth(month, year)
    
    return Array.from({ length: daysInMonth }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString()
    }))
  }

  const isDateInPast = (day: number, month: number) => {
    if (!startDate || !endDate) return false
    
    const years = getValidYears()
    if (years.length === 0) return false
    
    const holidayDate = new Date(years[0], month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return holidayDate < today
  }

  const isDateInRange = (day: number, month: number) => {
    if (!startDate || !endDate) return false
    
    const years = getValidYears()
    if (years.length === 0) return false
    
    const holidayDate = new Date(years[0], month - 1, day)
    return holidayDate >= startDate && holidayDate <= endDate
  }

  const addHoliday = async () => {
    if (!selectedDay || !selectedMonth) {
      toast({
        title: "Error",
        description: "Please select both day and month",
        variant: "destructive"
      })
      return
    }

    const day = parseInt(selectedDay)
    const month = parseInt(selectedMonth)
    
    if (!isDateInRange(day, month)) {
      toast({
        title: "Error", 
        description: "Holiday date must be within the academic period",
        variant: "destructive"
      })
      return
    }

    if (isDateInPast(day, month)) {
      toast({
        title: "Error",
        description: "Cannot add holiday for past dates",
        variant: "destructive"
      })
      return
    }

    const existingHoliday = false // We'll let the backend handle duplicate checking

    setIsLoading(true)
    try {
      const years = getValidYears()
      const year = years.length > 0 ? years[0] : new Date().getFullYear()
      
      const response = await fetch(buildApiUrl('/holidays'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getFromLocalStorage('trackly_token', '')}`
        },
        body: JSON.stringify({
          day,
          month,
          year,
          reason: reason || undefined,
          semester: currentSemester
        })
      })

      if (response.ok) {
        onHolidayAdded?.()
        setSelectedDay("")
        setSelectedMonth("")
        setReason("")
        toast({
          title: "Success",
          description: "Holiday added successfully"
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add holiday')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add holiday",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!startDate || !endDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Holiday Management
          </CardTitle>
          <CardDescription>
            Please save your academic period first to manage holidays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Academic period must be set before adding holidays
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Holiday Management
        </CardTitle>
        <CardDescription>
          Add holidays for {currentSemester ? `Semester ${currentSemester}` : 'current semester'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Day</Label>
            <Select value={selectedDay} onValueChange={setSelectedDay} disabled={!selectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {getDaysForSelectedMonth().map(day => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Reason (Optional)</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for holiday"
          />
        </div>

        <Button 
          onClick={addHoliday} 
          disabled={!selectedDay || !selectedMonth || isLoading}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Holiday
        </Button>
      </CardContent>
    </Card>
  )
}