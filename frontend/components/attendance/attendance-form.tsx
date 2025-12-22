"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { SaveButton } from "@/components/ui/save-button"
import { saveToLocalStorage, getFromLocalStorage } from "@/lib/storage-utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon, PlusCircle } from "lucide-react"
import { useAuth } from '@/lib/auth-context'
import { fetchWithAuth } from '@/lib/api'

interface Subject {
  id: string;
  name: string;
  code?: string;
}

export function AttendanceForm() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [status, setStatus] = useState<"present" | "absent">("present")
  const [notes, setNotes] = useState("")

  // Load subjects from localStorage
  useEffect(() => {
    const savedSubjects = getFromLocalStorage<Subject[]>('subjects', []);
    setSubjects(savedSubjects || []);
    setIsLoadingSubjects(false);
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      if (!date || !selectedSubject) {
        throw new Error("Please select both date and subject")
      }
      
      const subject = subjects.find(s => s.id === selectedSubject);
      
      if (!subject) {
        throw new Error("Selected subject not found");
      }
      
      const attendanceRecord = {
        id: crypto.randomUUID(),
        date: date.toISOString(),
        subject: subject.name,
        subjectId: subject.id,
        status,
        notes: notes.trim(),
        userId: user?.id
      }
      
      const existingRecords = getFromLocalStorage<any[]>('attendance_records', [])
      const updatedRecords = [...existingRecords, attendanceRecord]
      saveToLocalStorage('attendance_records', updatedRecords)
      
      try {
        const response = await fetchWithAuth('/attendance', {
          method: 'POST',
          body: JSON.stringify({
            date: date.toISOString(),
            subjectId: subject.id,
            status,
            notes: notes.trim()
          })
        });

        if (response.ok) {
          window.dispatchEvent(new Event('attendanceUpdated'));
          
          toast({
            title: "Attendance Recorded",
            description: `You marked ${status} for ${subject.name} on ${format(date, 'PPP')}`,
          });
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        toast({
          title: "Attendance Saved Locally",
          description: `Attendance saved locally. Will sync when connection is restored.`,
          variant: "default"
        });
      }
      
      setNotes("")
    } catch (error: any) {
      console.error("Error recording attendance:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to record attendance",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSubject = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/settings/profile';
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Record Attendance</CardTitle>
        <CardDescription>Track your class attendance</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            {isLoadingSubjects ? (
              <div className="flex items-center space-x-2 h-10">
                <div className="w-4 h-4 rounded-full border-2 border-primary border-r-transparent animate-spin"></div>
                <span className="text-sm text-muted-foreground">Loading subjects...</span>
              </div>
            ) : subjects.length > 0 ? (
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="border rounded-md p-3 text-center space-y-2">
                <p className="text-sm text-muted-foreground">No subjects found</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddSubject}
                  className="flex items-center text-xs w-full justify-center"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Subject
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "present" | "absent")}>
              <SelectTrigger>
                <SelectValue placeholder="Present or Absent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input 
              id="notes"
              value={notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this class"
            />
          </div>
        </CardContent>
        <CardFooter>
          <SaveButton 
            isSaving={isSaving} 
            variant="primary"
            text="Record Attendance"
            loadingText="Recording..."
            disabled={isLoadingSubjects || subjects.length === 0}
          />
        </CardFooter>
      </form>
    </Card>
  )
}
