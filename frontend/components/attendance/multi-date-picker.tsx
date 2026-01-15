"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface MultiDatePickerProps {
  selectedDates: Date[]
  onDatesChange: (dates: Date[]) => void
  minDate?: Date
}

export function MultiDatePicker({ selectedDates, onDatesChange, minDate }: MultiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const exists = selectedDates.some(d => 
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    )

    if (exists) {
      onDatesChange(selectedDates.filter(d => 
        !(d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear())
      ))
    } else {
      onDatesChange([...selectedDates, date])
    }
  }

  const removeDate = (dateToRemove: Date) => {
    onDatesChange(selectedDates.filter(d => 
      !(d.getDate() === dateToRemove.getDate() &&
        d.getMonth() === dateToRemove.getMonth() &&
        d.getFullYear() === dateToRemove.getFullYear())
    ))
  }

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDates.length && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDates.length > 0
              ? `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`
              : "Select absent dates"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={(dates) => onDatesChange(dates || [])}
            disabled={(date) => minDate ? date < minDate : false}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {selectedDates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedDates
            .sort((a, b) => a.getTime() - b.getTime())
            .map((date, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
              >
                <span>{format(date, "MMM dd, yyyy")}</span>
                <button
                  onClick={() => removeDate(date)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
