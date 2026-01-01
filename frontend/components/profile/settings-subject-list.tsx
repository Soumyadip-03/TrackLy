"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { subjectService, type Subject } from "@/lib/services/subject-service"

interface SubjectData {
  _id?: string
  id?: string
  name: string
  code: string
  classType: string
  classesPerWeek: number
  isEditing?: boolean
}

interface SubjectListProps {
  onUpdateAction: (data: SubjectData[]) => void;
}

export function SettingsSubjectList({ onUpdateAction }: SubjectListProps) {
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newSubject, setNewSubject] = useState<Partial<SubjectData>>({
    name: "",
    code: "",
    classType: "",
    classesPerWeek: 0,
  })

  // Load subjects from database
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
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
      onUpdateAction(formattedData);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true)
    setNewSubject({
      name: "",
      code: "",
      classType: "",
      classesPerWeek: 0,
    })
  }

  const handleCancelAdd = () => {
    setIsAddingNew(false)
  }

  const handleNewSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewSubject((prev) => ({
      ...prev,
      [name]: name === "classesPerWeek" ? Number.parseInt(value) || 0 : 
              name === "name" ? capitalizeSubject(value) : value,
    }))
  }

  const handleNewSubjectSelectChange = (value: string) => {
    setNewSubject((prev) => ({
      ...prev,
      classType: value,
    }))
  }

  const capitalizeSubject = (text: string): string => {
    // Convert entire text to uppercase instead of just capitalizing
    return text.toUpperCase();
  }

  const handleSaveNewSubject = async () => {
    if (!newSubject.name) {
      toast({
        title: "Error",
        description: "Subject name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const created = await subjectService.create({
        name: capitalizeSubject(newSubject.name || ""),
        code: newSubject.code || "",
        classType: newSubject.classType || "none",
        classesPerWeek: newSubject.classesPerWeek || 0,
        semester: 1
      });

      await loadSubjects();
      setIsAddingNew(false);

      toast({
        title: "Subject Added",
        description: `${newSubject.name} (${(newSubject.classType || "none").toUpperCase()}) has been added.`,
      });
    } catch (error) {
      console.error('Error creating subject:', error);
      toast({
        title: "Error",
        description: "Failed to create subject",
        variant: "destructive",
      });
    }
  }

  const handleEdit = (id: string) => {
    setSubjects((prev) => prev.map((subject) => ((subject.id === id || subject._id === id) ? { ...subject, isEditing: true } : subject)))
  }

  const handleEditChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedSubjects = subjects.map((subject) =>
      (subject.id === id || subject._id === id)
        ? {
            ...subject,
            [name]: name === "classesPerWeek" ? Number.parseInt(value) || 0 : 
                   name === "name" ? capitalizeSubject(value) : value,
          }
        : subject
    );
    
    setSubjects(updatedSubjects);
    onUpdateAction(updatedSubjects);
  }

  const handleEditSelectChange = (id: string, value: string) => {
    const updatedSubjects = subjects.map((subject) =>
      (subject.id === id || subject._id === id)
        ? {
            ...subject,
            classType: value,
          }
        : subject
    );
    
    setSubjects(updatedSubjects);
    onUpdateAction(updatedSubjects);
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const subject = subjects.find(s => s.id === id || s._id === id);
      if (!subject) return;

      await subjectService.update(subject._id || subject.id || '', {
        name: subject.name,
        code: subject.code,
        classType: subject.classType,
        classesPerWeek: subject.classesPerWeek
      });

      await loadSubjects();

      toast({
        title: "Subject Updated",
        description: "Subject information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      toast({
        title: "Error",
        description: "Failed to update subject",
        variant: "destructive",
      });
    }
  }

  const handleDelete = async (id: string) => {
    const subjectToDelete = subjects.find(s => s.id === id || s._id === id);
    
    if (!subjectToDelete) {
      toast({
        title: "Error",
        description: "Subject not found",
        variant: "destructive",
      });
      return;
    }

    try {
      await subjectService.delete(subjectToDelete._id || subjectToDelete.id || '');
      await loadSubjects();

      toast({
        title: "Subject Deleted",
        description: `${subjectToDelete.name} has been removed`,
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: "Failed to delete subject",
        variant: "destructive",
      });
    }
  }

  // New function to clear all subjects
  const handleClearAllSubjects = async () => {
    if (window.confirm("Are you sure you want to clear all subjects? This action cannot be undone.")) {
      try {
        // Delete all subjects one by one
        for (const subject of subjects) {
          await subjectService.delete(subject._id || subject.id || '');
        }
        
        await loadSubjects();
        
        toast({
          title: "All Subjects Cleared",
          description: "All subjects have been removed.",
        });
      } catch (error) {
        console.error('Error clearing subjects:', error);
        toast({
          title: "Error",
          description: "Failed to clear all subjects",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Subject List</CardTitle>
          <CardDescription>Manage your semester subjects</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading subjects...</p>
          </div>
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
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
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{subject.name}</CardTitle>
                      <div className="inline-flex items-center mt-1">
                        {subject.code && <span className="text-sm text-muted-foreground mr-2">{subject.code}</span>}
                        <span className="text-xs px-2 py-1 rounded-full bg-muted">
                          {subject.classType === "none" || !subject.classType ? "NOT SPECIFIED" : subject.classType.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(subject.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {subject.isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`name-${subject.id}`}>Subject Name</Label>
                        <Input 
                          id={`name-${subject.id}`}
                          name="name" 
                          value={subject.name || ""} 
                          onChange={(e) => handleEditChange(subject.id, e)} 
                        />
                      </div>
                      <div>
                        <Label htmlFor={`code-${subject.id}`}>Subject Code</Label>
                        <Input 
                          id={`code-${subject.id}`}
                          name="code" 
                          value={subject.code || ""} 
                          onChange={(e) => handleEditChange(subject.id, e)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`type-${subject.id}`}>Class Type</Label>
                        <Select 
                          value={subject.classType} 
                          onValueChange={(value) => handleEditSelectChange(subject.id, value)}
                        >
                          <SelectTrigger id={`type-${subject.id}`} className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">NOT SPECIFIED</SelectItem>
                            <SelectItem value="lecture">LECTURE</SelectItem>
                            <SelectItem value="lab">LAB</SelectItem>
                            <SelectItem value="tutorial">TUTORIAL</SelectItem>
                            <SelectItem value="seminar">SEMINAR</SelectItem>
                            <SelectItem value="workshop">WORKSHOP</SelectItem>
                            <SelectItem value="sports">SPORTS</SelectItem>
                            <SelectItem value="yoga">YOGA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`classes-${subject.id}`}>Total Classes</Label>
                        <Input
                          id={`classes-${subject.id}`}
                          name="classesPerWeek"
                          type="number"
                          value={subject.classesPerWeek || 0}
                          onChange={(e) => handleEditChange(subject.id, e)}
                        />
                      </div>
                      <Button onClick={() => handleSaveEdit(subject.id)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-medium">Classes Per Week:</span>
                      <span className="text-xl font-bold">{subject.classesPerWeek}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No subjects added yet. Use "Upload to Subjects" from the Schedule tab.</p>
          </div>
        )}

      </CardContent>
      
      {/* Add Clear All button in footer */}
      <div className="p-6 border-t flex justify-end">
        <Button 
          variant="outline" 
          onClick={handleClearAllSubjects}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          Clear All Subjects
        </Button>
      </div>
    </Card>
  )
} 