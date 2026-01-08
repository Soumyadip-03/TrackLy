"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { subjectService, type Subject } from "@/lib/services/subject-service"
import { Edit, Save, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SubjectData {
  _id?: string
  id?: string
  name: string
  code: string
  classType: string
  classesPerWeek: number
  attendedClasses?: number
  totalClasses?: number
}

interface SubjectManagerProps {
  onUpdateAction?: (data: SubjectData[]) => void;
}

export function SubjectManager({ onUpdateAction }: SubjectManagerProps = {}) {
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [preparatorySubject, setPreparatorySubject] = useState<SubjectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCode, setEditCode] = useState("")
  const [isClearing, setIsClearing] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await subjectService.getAll();
      
      // Separate preparatory subject from others
      const prepSubject = data.find(s => s.classType === 'preparatory' && s.name === 'Preparatory');
      const otherSubjects = data.filter(s => !(s.classType === 'preparatory' && s.name === 'Preparatory'));
      
      setPreparatorySubject(prepSubject ? {
        _id: prepSubject._id,
        id: prepSubject._id,
        name: prepSubject.name,
        code: prepSubject.code,
        classType: prepSubject.classType,
        classesPerWeek: prepSubject.totalClasses || 0,
        attendedClasses: prepSubject.attendedClasses || 0,
        totalClasses: prepSubject.totalClasses || 0
      } : null);
      
      const formattedData = otherSubjects.map(s => ({
        _id: s._id,
        id: s._id,
        name: s.name,
        code: s.code,
        classType: s.classType,
        classesPerWeek: s.classesPerWeek || 0,
        attendedClasses: s.attendedClasses || 0,
        totalClasses: s.totalClasses || 0
      }));
      
      setSubjects(formattedData);
      onUpdateAction?.(formattedData);
    } catch (error) {
      console.error('Error loading subjects:', error);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCode = (subject: SubjectData) => {
    setEditingId(subject._id || subject.id || null)
    setEditCode(subject.code || "")
  }

  const handleSaveCode = async (subjectId: string) => {
    try {
      await subjectService.update(subjectId, { code: editCode })
      await loadSubjects()
      setEditingId(null)
      toast({
        title: "Course Code Updated",
        description: "Course code has been saved successfully.",
      })
    } catch (error) {
      console.error('Error updating course code:', error)
      toast({
        title: "Error",
        description: "Failed to update course code",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditCode("")
  }

  const handleClearAll = async () => {
    setShowClearDialog(false)
    setIsClearing(true)
    
    try {
      const success = await subjectService.clearAll();
      
      if (success) {
        setSubjects([]);
        setPreparatorySubject(null);
        toast({
          title: "All Subjects Cleared",
          description: "All subjects including Preparatory have been deleted.",
        });
      } else {
        throw new Error('Clear failed');
      }
    } catch (error) {
      console.error('Error clearing subjects:', error);
      toast({
        title: "Error",
        description: "Failed to clear subjects",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <Card>
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Subjects?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                This will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All subjects including Preparatory</li>
                  <li>All attendance records for these subjects</li>
                  <li>Schedule will remain but subjects will be cleared</li>
                </ul>
                <p className="mt-3 font-semibold text-destructive">This action cannot be undone!</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Subject List</CardTitle>
            <CardDescription>Subjects are automatically synced from your schedule</CardDescription>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => setShowClearDialog(true)}
            disabled={isClearing || (subjects.length === 0 && !preparatorySubject)}
          >
            {isClearing ? 'Clearing...' : 'Clear All Subjects'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading subjects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadSubjects} variant="outline">Retry</Button>
          </div>
        ) : subjects.length > 0 || preparatorySubject ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => {
              const isEditing = editingId === (subject._id || subject.id)
              const attendancePercentage = subject.totalClasses ? Math.round((subject.attendedClasses || 0) / subject.totalClasses * 100) : 0
              return (
              <Card key={subject._id || subject.id} className={`shadow-sm hover:shadow-md transition-shadow ${
                subject.classType === 'lecture' ? 'border-blue-200 bg-blue-50/30' :
                subject.classType === 'lab' ? 'border-green-200 bg-green-50/30' :
                subject.classType === 'tutorial' ? 'border-purple-200 bg-purple-50/30' :
                subject.classType === 'seminar' ? 'border-orange-200 bg-orange-50/30' :
                subject.classType === 'workshop' ? 'border-red-200 bg-red-50/30' :
                subject.classType === 'sports' ? 'border-yellow-200 bg-yellow-50/30' :
                subject.classType === 'yoga' ? 'border-pink-200 bg-pink-50/30' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">
                      {subject.classType === "none" || !subject.classType ? "NOT SPECIFIED" : subject.classType.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Code:</span>
                    {isEditing ? (
                      <>
                        <Input
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          placeholder="Course code"
                          className="h-7 text-sm flex-1"
                        />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleSaveCode(subject._id || subject.id || '')}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium">{subject.code || 'Not set'}</span>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEditCode(subject)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Classes Per Week:</span>
                    <span className="text-lg font-bold">{subject.classesPerWeek}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Attendance:</span>
                    <span className="text-lg font-bold">{attendancePercentage}% ({subject.attendedClasses || 0}/{subject.totalClasses || 0})</span>
                  </div>
                </CardContent>
              </Card>
            )}
            )}
            
            {preparatorySubject && (
              <Card className="shadow-md border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-amber-900">PREPARATORY</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-amber-700">Code:</span>
                    <span className="text-sm font-medium text-amber-900">{preparatorySubject.code || 'BUPRP'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-700">Total Class:</span>
                    <span className="text-lg font-bold text-amber-900">{preparatorySubject.totalClasses || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-700">Current Attendance:</span>
                    <span className="text-lg font-bold text-amber-900">
                      {preparatorySubject.totalClasses ? Math.round((preparatorySubject.attendedClasses || 0) / preparatorySubject.totalClasses * 100) : 0}% 
                      ({preparatorySubject.attendedClasses || 0}/{preparatorySubject.totalClasses || 0})
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No subjects found. Upload your schedule to create subjects.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
