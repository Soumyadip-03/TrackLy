"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Check, X, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchWithAuth } from "@/lib/api"
import { format } from "date-fns"
import useToastNotification from "@/hooks/use-toast-notification"

interface ClassSlot {
  id: string
  subjectId: string
  subject: string
  classType: string
  startTime: string
  endTime: string
  building?: string
  room?: string
  status?: "present" | "absent" | null
}

interface Holiday {
  _id: string
  name: string
  date: string
}

export function VisualAttendanceForm() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [classes, setClasses] = useState<ClassSlot[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [preparatorySubject, setPreparatorySubject] = useState<string>("")
  const [preparatoryStatus, setPreparatoryStatus] = useState<"present" | "absent" | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { success, error } = useToastNotification()

  useEffect(() => {
    loadClassesForDate(selectedDate)
    loadLocalAttendance()
  }, [selectedDate])

  useEffect(() => {
    loadHolidaysForMonth(selectedDate)
  }, [selectedDate.getMonth(), selectedDate.getFullYear()])

  const getLocalStorageKey = (date: Date) => {
    return `attendance_${format(date, 'yyyy-MM-dd')}`
  }

  const loadLocalAttendance = () => {
    const key = getLocalStorageKey(selectedDate)
    const stored = localStorage.getItem(key)
    if (stored) {
      const localData = JSON.parse(stored)
      setClasses(prev => prev.map(cls => {
        const localStatus = localData[cls.subjectId + '_' + cls.id]
        return localStatus ? { ...cls, status: localStatus } : cls
      }))
      if (localData.preparatory) {
        setPreparatorySubject(localData.preparatory.subjectId)
        setPreparatoryStatus(localData.preparatory.status)
      }
    }
  }

  const saveToLocalStorage = (updatedClasses: ClassSlot[], prepSubject?: string, prepStatus?: "present" | "absent" | null) => {
    const key = getLocalStorageKey(selectedDate)
    const data: any = {}
    updatedClasses.forEach(cls => {
      if (cls.status) data[cls.subjectId + '_' + cls.id] = cls.status
    })
    if (prepSubject && prepStatus) {
      data.preparatory = { subjectId: prepSubject, status: prepStatus }
    }
    localStorage.setItem(key, JSON.stringify(data))
  }

  const loadClassesForDate = async (date: Date) => {
    try {
      setLoading(true)
      const response = await fetchWithAuth('/schedule')
      const data = await response.json()
      
      if (data.success && data.data) {
        const dayName = format(date, 'EEEE')
        
        const subjectsResponse = await fetchWithAuth('/subject')
        const subjectsData = await subjectsResponse.json()
        const subjects = subjectsData.data || []
        
        const scheduleClasses = data.data.classes || []
        
        const scheduledClasses = scheduleClasses.filter(
          (cls: any) => cls.day === dayName
        ).map((cls: any) => {
          const matchedSubject = subjects.find((s: any) => s.name === cls.subject)
          return {
            ...cls,
            subjectId: cls.subjectId || matchedSubject?._id
          }
        })
        
        const dateStr = format(date, 'yyyy-MM-dd')
        const attendanceResponse = await fetchWithAuth(`/attendance/range?startDate=${dateStr}&endDate=${dateStr}`)
        const attendanceData = await attendanceResponse.json()
        
        const classesWithStatus = scheduledClasses.map((cls: any) => {
          const dbAttendance = attendanceData.data?.find((a: any) => 
            a.subject?._id === cls.subjectId && 
            a.scheduleClassId === cls.id && 
            !a.isPreparatory
          )
          return {
            ...cls,
            status: dbAttendance?.status || null
          }
        })
        
        setClasses(classesWithStatus)
        
        // Load local storage after setting DB data
        setTimeout(() => loadLocalAttendance(), 100)
      } else {
        setClasses([])
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const loadHolidaysForMonth = async (date: Date) => {
    try {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const response = await fetchWithAuth(`/holidays?year=${year}&month=${month}`)
      const data = await response.json()
      if (data.success) {
        setHolidays(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load holidays:', error)
    }
  }

  const markAttendance = (classSlot: ClassSlot, status: "present" | "absent") => {
    if (!classSlot.subjectId) return
    
    const updatedClasses = classes.map(cls => {
      if (cls.id === classSlot.id) {
        // Toggle if clicking same status
        return { ...cls, status: cls.status === status ? null : status }
      }
      return cls
    })
    setClasses(updatedClasses)
    saveToLocalStorage(updatedClasses, preparatorySubject, preparatoryStatus)
  }

  const markAllAttendance = (status: "present" | "absent") => {
    const updatedClasses = classes.map(cls => ({ ...cls, status }))
    setClasses(updatedClasses)
    saveToLocalStorage(updatedClasses, preparatorySubject, preparatoryStatus)
  }

  const markPreparatoryAttendance = (status: "present" | "absent") => {
    if (!preparatorySubject) return
    
    setPreparatoryStatus(status)
    const updatedClasses = classes.filter(cls => cls.subjectId !== preparatorySubject)
    setClasses(updatedClasses)
    saveToLocalStorage(updatedClasses, preparatorySubject, status)
  }

  const uploadAttendance = async () => {
    try {
      setUploading(true)
      let successCount = 0
      let errorCount = 0
      
      const subjectsResponse = await fetchWithAuth('/subject')
      const subjectsData = await subjectsResponse.json()
      const allSubjects = subjectsData.data || []
      
      // Upload each class slot individually
      for (const cls of classes) {
        if (cls.status && cls.subjectId) {
          // Find subject by name AND classType
          const matchedSubject = allSubjects.find((s: any) => 
            (s._id === cls.subjectId || s.name === cls.subject) && 
            s.classType === cls.classType
          )
          
          if (!matchedSubject) {
            console.error(`No subject found for ${cls.subject} (${cls.classType})`)
            errorCount++
            continue
          }
          
          try {
            const response = await fetchWithAuth('/attendance/per-subject', {
              method: 'POST',
              body: JSON.stringify({
                date: format(selectedDate, 'yyyy-MM-dd'),
                subjectId: matchedSubject._id,
                status: cls.status,
                classType: cls.classType,
                scheduleClassId: cls.id
              })
            })
            
            if (response.ok) {
              successCount++
            } else {
              errorCount++
              console.error(`Failed to upload ${cls.subject}:`, await response.text())
            }
          } catch (err) {
            errorCount++
            console.error(`Error uploading ${cls.subject}:`, err)
          }
        }
      }
      
      // Upload preparatory if marked
      if (preparatorySubject && preparatoryStatus) {
        try {
          const prepSubjectResponse = await fetchWithAuth('/subject')
          const prepSubjectData = await prepSubjectResponse.json()
          let prepSubject = prepSubjectData.data?.find((s: any) => s.classType === 'preparatory')
          
          if (!prepSubject) {
            const createResponse = await fetchWithAuth('/subject', {
              method: 'POST',
              body: JSON.stringify({
                name: 'Preparatory Paper',
                code: 'BUPRP',
                classType: 'preparatory',
                semester: 1
              })
            })
            const createData = await createResponse.json()
            prepSubject = createData.data
          }
          
          const response = await fetchWithAuth('/attendance/per-subject', {
            method: 'POST',
            body: JSON.stringify({
              date: format(selectedDate, 'yyyy-MM-dd'),
              subjectId: prepSubject._id,
              status: preparatoryStatus,
              classType: 'preparatory',
              isPreparatory: true,
              linkedSubjectId: preparatorySubject
            })
          })
          
          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (err) {
          errorCount++
          console.error('Error uploading preparatory:', err)
        }
      }
      
      if (successCount > 0) {
        success(
          'Attendance Uploaded!',
          `Successfully uploaded ${successCount} record${successCount > 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed.` : ''}`
        )
        // Don't clear localStorage - keep UI state
      } else {
        error('Upload Failed', 'No attendance records were uploaded. Please try again.')
      }
    } catch (err) {
      console.error('Failed to upload attendance:', err)
      error('Upload Failed', 'An error occurred while uploading attendance.')
    } finally {
      setUploading(false)
    }
  }

  const monthName = format(selectedDate, 'MMMM')
  const hasHolidays = holidays.length > 0

  return (
    <div className="w-full h-[calc(100vh-12rem)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left Column */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          {/* Calendar Card */}
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-3 flex flex-col h-full">
              <Button 
                variant="outline" 
                className="mb-2 w-full h-9 rounded-lg border-2 font-semibold hover:bg-primary hover:text-primary-foreground text-xs"
              >
                Auto-Attendance
              </Button>
              <div className="flex-1 flex items-center justify-center w-full">
                <div className="w-full max-w-sm mx-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border-0 p-0 m-0 w-full [&>div]:w-full [&_table]:w-full [&_td]:p-2 [&_th]:p-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holiday List Card */}
          <Card className="h-32 overflow-hidden">
            <CardContent className="p-3 h-full flex flex-col">
              <h3 className="text-base font-semibold mb-2">Holidays</h3>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {hasHolidays ? (
                  <ul className="space-y-1">
                    {holidays.map(holiday => (
                      <li key={holiday._id} className="text-sm text-muted-foreground">
                        <span className="font-medium">{format(new Date(holiday.date), 'dd MMM')}</span> - {holiday.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No holiday in {monthName} month</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <Card className="h-full overflow-hidden">
          <CardContent className="p-3 flex flex-col h-full gap-3">
            <h3 className="text-base font-semibold">Classes</h3>
            
            {/* Subjects Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground text-sm">Loading classes...</p>
                </div>
              ) : classes.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground text-sm">No classes scheduled for this day</p>
                </div>
              ) : (
                classes.map((cls, index) => (
                  <div 
                    key={cls.id || `class-${index}`} 
                    className={`border-2 rounded-lg p-3 flex items-center justify-between transition-all ${
                      cls.status === 'present' ? 'bg-green-50 border-green-400 dark:bg-green-950 dark:border-green-600' : 
                      cls.status === 'absent' ? 'bg-red-50 border-red-400 dark:bg-red-950 dark:border-red-600' : 
                      'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-sm font-semibold">{cls.subject}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {cls.classType && <span className="capitalize">{cls.classType} • </span>}
                        {cls.startTime} - {cls.endTime}
                        {cls.room && ` • ${cls.room}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => markAttendance(cls, 'present')}
                        className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                          cls.status === 'present' 
                            ? 'bg-green-600' 
                            : 'hover:bg-green-100 dark:hover:bg-green-900'
                        }`}
                      >
                        <Check className={`h-4 w-4 ${
                          cls.status === 'present' ? 'text-white' : 'text-green-600'
                        }`} />
                      </button>
                      <button 
                        onClick={() => markAttendance(cls, 'absent')}
                        className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                          cls.status === 'absent' 
                            ? 'bg-red-600' 
                            : 'hover:bg-red-100 dark:hover:bg-red-900'
                        }`}
                      >
                        <X className={`h-4 w-4 ${
                          cls.status === 'absent' ? 'text-white' : 'text-red-600'
                        }`} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Preparatory Class Card */}
            {classes.length > 0 && (
              <div className={`border-2 rounded-lg p-3 flex items-center justify-between transition-colors ${
                preparatoryStatus === 'present' ? 'bg-green-50 border-green-400 dark:bg-green-950 dark:border-green-600' :
                preparatoryStatus === 'absent' ? 'bg-red-50 border-red-400 dark:bg-red-950 dark:border-red-600' :
                'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950'
              }`}>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">Preparatory Class</span>
                  {preparatorySubject && (
                    <span className="text-xs text-amber-700 dark:text-amber-300 font-bold">
                      {classes.find(c => c.subjectId === preparatorySubject)?.subject}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={preparatorySubject}
                    onChange={(e) => {
                      setPreparatorySubject(e.target.value)
                      setPreparatoryStatus(null)
                    }}
                    className="h-8 px-2 text-xs border-2 border-amber-600 rounded-md bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 font-medium"
                  >
                    <option value="">Select</option>
                    {classes.map((cls, index) => (
                      <option key={cls.id || `prep-${index}`} value={cls.subjectId}>
                        {cls.subject} • {cls.startTime} - {cls.endTime}
                      </option>
                    ))}
                  </select>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-md"
                    onClick={() => markPreparatoryAttendance('present')}
                    disabled={!preparatorySubject}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-md"
                    onClick={() => markPreparatoryAttendance('absent')}
                    disabled={!preparatorySubject}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full h-11 rounded-lg border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-semibold transition-colors"
                  onClick={() => markAllAttendance('present')}
                  disabled={classes.length === 0}
                >
                  Mark all Present
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-11 rounded-lg border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold transition-colors"
                  onClick={() => markAllAttendance('absent')}
                  disabled={classes.length === 0}
                >
                  Mark all Absent
                </Button>
              </div>
              <Button 
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors"
                onClick={uploadAttendance}
                disabled={classes.length === 0 || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Attendance'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
