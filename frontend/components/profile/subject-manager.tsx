"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { subjectService, type Subject } from "@/lib/services/subject-service"
import { Edit, Save, X } from "lucide-react"

interface SubjectData {
  _id?: string
  id?: string
  name: string
  code: string
  classType: string
  classesPerWeek: number
}

interface SubjectManagerProps {
  onUpdateAction?: (data: SubjectData[]) => void;
}

export function SubjectManager({ onUpdateAction }: SubjectManagerProps = {}) {
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCode, setEditCode] = useState("")

  // Load subjects from database
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await subjectService.getAll();
      const formattedData = data.map(s => ({
        _id: s._id,
        id: s._id,
        name: s.name,
        code: s.code,
        classType: s.classType,
        classesPerWeek: s.classesPerWeek || 0
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

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Subject List</CardTitle>
          <CardDescription>Subjects are automatically synced from your schedule</CardDescription>
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
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => {
              const isEditing = editingId === (subject._id || subject.id)
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{subject.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
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
                        {subject.code && <span className="text-sm text-muted-foreground">{subject.code}</span>}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEditCode(subject)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <span className="text-xs px-2 py-1 rounded-full bg-muted ml-auto">
                      {subject.classType === "none" || !subject.classType ? "NOT SPECIFIED" : subject.classType.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-medium">Classes Per Week:</span>
                    <span className="text-xl font-bold">{subject.classesPerWeek}</span>
                  </div>
                </CardContent>
              </Card>
            )})
            }
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-2">No subjects added yet.</p>
            <p className="text-sm">Go to the <strong>Schedule</strong> tab and click <strong>"Upload to Subjects"</strong> to sync your subjects.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 