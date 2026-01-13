"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { fetchWithAuth } from "@/lib/api"

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

export function HolidayManager({ currentSemester, startDate: periodStart, endDate: periodEnd, onHolidayAdded }: HolidayManagerProps) {
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
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

  const getValidMonths = () => {
    if (!startDate || !endDate) return []
    
    const startMonth = startDate.getMonth() + 1 // 0-indexed to 1-indexed
    const endMonth = endDate.getMonth() + 1
    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()
    
    // If same year, return months between start and end
    if (startYear === endYear) {
      return months.filter(m => {
        const monthNum = parseInt(m.value)
        return monthNum >= startMonth && monthNum <= endMonth
      })
    }
    
    // If different years, return all months (academic period spans multiple years)
    return months
  }

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
    if (!startDate) {
      toast({
        title: "Error",
        description: "Please select start date",
        variant: "destructive"
      })
      return
    }

    if (!reason || reason.trim() === '') {
      toast({
        title: "Error",
        description: "Please provide a reason for the holiday",
        variant: "destructive"
      })
      return
    }

    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date(startDate)
    
    if (start > end) {
      toast({
        title: "Error",
        description: "Start date cannot be after end date",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetchWithAuth('/holidays/range', {
        method: 'POST',
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          reason: reason || undefined,
          semester: currentSemester
        })
      })

      if (response.ok) {
        const data = await response.json()
        onHolidayAdded?.()
        setStartDate("")
        setEndDate("")
        setReason("")
        toast({
          title: "Success",
          description: `${data.count} holiday(s) added successfully`
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

  if (!periodStart || !periodEnd) {
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
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-0 pt-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Calendar className="h-5 w-5" />
          Holiday Management
        </CardTitle>
        <CardDescription className="text-sm">
          Add holidays for {currentSemester ? `Semester ${currentSemester}` : 'current semester'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5 flex-1 min-h-0 overflow-hidden pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-sm">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={periodStart ? new Date(periodStart).toISOString().split('T')[0] : undefined}
              max={periodEnd ? new Date(periodEnd).toISOString().split('T')[0] : undefined}
            />
          </div>
          
          <div className="space-y-1">
            <Label className="text-sm">End Date (Optional)</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || (periodStart ? new Date(periodStart).toISOString().split('T')[0] : undefined)}
              max={periodEnd ? new Date(periodEnd).toISOString().split('T')[0] : undefined}
              disabled={!startDate}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Reason</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Durga Puja"
            required
          />
        </div>

        <Button 
          onClick={addHoliday} 
          disabled={!startDate || !reason || isLoading}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Holiday{endDate && endDate !== startDate ? 's' : ''}
        </Button>
      </CardContent>
    </Card>
  )
}