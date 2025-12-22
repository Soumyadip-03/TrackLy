"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface SubjectData {
  id: string
  name: string
  code: string
  classType: string
  classesPerWeek: number
  isEditing?: boolean
}

interface ScheduleClassEntry {
  id: string;
  day: string;
  subject: string;
  startTime: string;
  endTime: string;
  room: string;
  classType: string;
}

interface ScheduleData {
  classes: ScheduleClassEntry[];
}

interface SubjectListProps {
  onUpdateAction: (data: SubjectData[]) => void;
}

export function SettingsSubjectList({ onUpdateAction }: SubjectListProps) {
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [schedule, setSchedule] = useState<ScheduleData>({ classes: [] });

  // Load initial data from localStorage - fix to prevent infinite loop
  useEffect(() => {
    const savedSubjects = getFromLocalStorage<SubjectData[]>('subjects', []);
    const savedSchedule = getFromLocalStorage<ScheduleData>('schedule', { classes: [] });
    setSubjects(savedSubjects);
    setSchedule(savedSchedule);
    
    // Only call onUpdateAction on initial mount, not on every re-render
    // when onUpdateAction changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count classes per subject from the schedule - updated to count by subject and class type
  useEffect(() => {
    if (schedule.classes.length > 0) {
      // First group all schedule entries by subject-classType combination
      const subjectClassTypeMap = new Map<string, { count: number, classType: string, name: string }>();
      
      // Process all non-break schedule entries
      schedule.classes.forEach(cls => {
        if (cls.classType !== "break" && cls.subject) {
          // Create a unique key for this subject-classType combination
          const subjectKey = `${cls.subject.toLowerCase()}_${cls.classType || 'none'}`;
          
          if (!subjectClassTypeMap.has(subjectKey)) {
            subjectClassTypeMap.set(subjectKey, { 
              count: 1, 
              classType: cls.classType || 'none',
              name: cls.subject
            });
          } else {
            const entry = subjectClassTypeMap.get(subjectKey)!;
            entry.count++;
          }
        }
      });
      
      // Update existing subjects and create any missing ones
      let updatedSubjects = [...subjects];
      
      // Update existing subjects with matching subject-classType
      updatedSubjects = updatedSubjects.map(subject => {
        const key = `${subject.name.toLowerCase()}_${subject.classType || 'none'}`;
        const scheduleEntry = subjectClassTypeMap.get(key);
        
        if (scheduleEntry) {
          // Remove this entry from the map since we've processed it
          subjectClassTypeMap.delete(key);
          
          return {
            ...subject,
            classesPerWeek: scheduleEntry.count
          };
        }
        return subject;
      });
      
      // Add new subjects for remaining entries
      if (subjectClassTypeMap.size > 0) {
        subjectClassTypeMap.forEach((data, key) => {
          const existingWithSameName = updatedSubjects.find(
            s => s.name.toLowerCase() === data.name.toLowerCase() &&
                s.classType === data.classType
          );
          
          if (!existingWithSameName) {
            // Get the code from any existing subject with the same name
            const codeFromExisting = updatedSubjects.find(
              s => s.name.toLowerCase() === data.name.toLowerCase()
            )?.code || "";
            
            updatedSubjects.push({
              id: Math.random().toString(36).substring(2, 9),
              name: data.name.toUpperCase(),
              code: codeFromExisting,
              classType: data.classType,
              classesPerWeek: data.count,
              isEditing: false
            });
          }
        });
      }
      
      if (JSON.stringify(updatedSubjects) !== JSON.stringify(subjects)) {
        setSubjects(updatedSubjects);
        saveToLocalStorage('subjects', updatedSubjects);
      }
    }
  }, [schedule, subjects]);

  // Separate effect to handle updating the parent when our subjects change
  useEffect(() => {
    // Only update parent when subjects actually change
    onUpdateAction(subjects);
    // This will only run when subjects change, not when onUpdateAction changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  const [newSubject, setNewSubject] = useState<Partial<SubjectData>>({
    name: "",
    code: "",
    classType: "",
    classesPerWeek: 0,
  })

  const [isAddingNew, setIsAddingNew] = useState(false)

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

  const handleSaveNewSubject = () => {
    if (!newSubject.name) {
      toast({
        title: "Error",
        description: "Subject name is required.",
        variant: "destructive",
      })
      return
    }

    const newId = Math.random().toString(36).substring(2, 9)
    const newSubjectWithId: SubjectData = { 
      id: newId, 
      name: capitalizeSubject(newSubject.name || ""), 
      code: newSubject.code || "", 
      classType: newSubject.classType || "none", // Default to "none" if not specified
      classesPerWeek: newSubject.classesPerWeek || 0 
    }
    
    const updatedSubjects = [...subjects, newSubjectWithId]
    setSubjects(updatedSubjects)
    
    // Save to localStorage
    saveToLocalStorage('subjects', updatedSubjects);
    
    setIsAddingNew(false)
    onUpdateAction(updatedSubjects) // Send updated data to parent

    toast({
      title: "Subject Added",
      description: `${newSubject.name} (${(newSubject.classType || "none").toUpperCase()}) has been added.`,
    })
  }

  const handleEdit = (id: string) => {
    setSubjects((prev) => prev.map((subject) => (subject.id === id ? { ...subject, isEditing: true } : subject)))
  }

  const handleEditChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedSubjects = subjects.map((subject) =>
      subject.id === id
        ? {
            ...subject,
            [name]: name === "classesPerWeek" ? Number.parseInt(value) || 0 : 
                   name === "name" ? capitalizeSubject(value) : value,
          }
        : subject
    );
    
    setSubjects(updatedSubjects);
    
    // Save to localStorage with each edit change
    saveToLocalStorage('subjects', updatedSubjects);
    
    onUpdateAction(updatedSubjects); // Send updated data to parent
  }

  const handleEditSelectChange = (id: string, value: string) => {
    const updatedSubjects = subjects.map((subject) =>
      subject.id === id
        ? {
            ...subject,
            classType: value,
          }
        : subject
    );
    
    setSubjects(updatedSubjects);
    saveToLocalStorage('subjects', updatedSubjects);
    onUpdateAction(updatedSubjects);
  }

  const handleSaveEdit = (id: string) => {
    const updatedSubjects = subjects.map((subject) => 
      subject.id === id ? { ...subject, isEditing: false } : subject
    );
    
    setSubjects(updatedSubjects);
    
    // Save to localStorage
    saveToLocalStorage('subjects', updatedSubjects);
    
    onUpdateAction(updatedSubjects); // Send updated data to parent

    toast({
      title: "Subject Updated",
      description: "Subject information has been updated successfully.",
    })
  }

  const handleDelete = (id: string) => {
    // Log for debugging
    console.log("Deleting subject with ID:", id);
    
    // Find the subject for toast message
    const subjectToDelete = subjects.find(s => s.id === id);
    
    if (!subjectToDelete) {
      toast({
        title: "Error",
        description: "Subject not found",
        variant: "destructive",
      });
      return;
    }
    
    // Create new array without the deleted subject
    const updatedSubjects = subjects.filter(subject => subject.id !== id);
    
    // Update state with the new array
    setSubjects(updatedSubjects);
    
    // Explicitly save to localStorage to ensure deletion persists
    saveToLocalStorage('subjects', updatedSubjects);
    console.log("Saved updated subjects to localStorage after deletion");
    
    // Notify parent component
    onUpdateAction(updatedSubjects);

    // Show confirmation toast
    toast({
      title: "Subject Deleted",
      description: `${subjectToDelete.name} has been removed`,
    });
  }

  // New function to clear all subjects
  const handleClearAllSubjects = () => {
    // Show confirmation dialog before clearing
    if (window.confirm("Are you sure you want to clear all subjects? This action cannot be undone.")) {
      // Clear subjects
      setSubjects([]);
      
      // Clear localStorage - this will automatically be namespaced with user ID
      saveToLocalStorage('subjects', []);
      
      // Update parent
      onUpdateAction([]);
      
      toast({
        title: "All Subjects Cleared",
        description: "All subjects have been removed.",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subject List</CardTitle>
          <CardDescription>Manage your semester subjects</CardDescription>
        </div>
        <Button onClick={handleAddNew} disabled={isAddingNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </CardHeader>
      <CardContent>
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <Card key={subject.id} className={`shadow-sm hover:shadow-md transition-shadow ${
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
            <p>No subjects added yet. Add your first subject to get started.</p>
          </div>
        )}

        {isAddingNew && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Add New Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Subject Name"
                    value={newSubject.name || ""}
                    onChange={handleNewSubjectChange}
                  />
                </div>
                <div>
                  <Label htmlFor="code">Subject Code</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="Subject Code"
                    value={newSubject.code || ""}
                    onChange={handleNewSubjectChange}
                  />
                </div>
                <div>
                  <Label htmlFor="classType">Class Type</Label>
                  <Select 
                    value={newSubject.classType} 
                    onValueChange={handleNewSubjectSelectChange}
                  >
                    <SelectTrigger id="classType" className="w-full">
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
                  <Label htmlFor="classesPerWeek">Classes Per Week</Label>
                  <Input
                    id="classesPerWeek"
                    name="classesPerWeek"
                    type="number"
                    placeholder="0"
                    value={newSubject.classesPerWeek || ""}
                    onChange={handleNewSubjectChange}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelAdd}>Cancel</Button>
                <Button onClick={handleSaveNewSubject}>
                  <Save className="h-4 w-4 mr-2" /> Save Subject
                </Button>
              </div>
            </CardContent>
          </Card>
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