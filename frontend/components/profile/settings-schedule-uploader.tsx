"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Save, Trash2, Clock, Home, BookOpen, Plus, Copy, CalendarOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Define subject interface
interface Subject {
  id: string;
  name: string;
  code: string;
  classType: string;
  classesPerWeek: number;
}

// Add type definition for class type data
interface ClassTypeData {
  count: number;
  type: string;
}

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

interface ClassEntry {
  id: string;
  day: string;
  subject: string;
  startTime: string;
  endTime: string;
  room: string;
  classType: string;
}

interface ScheduleData {
  classes: ClassEntry[];
}

interface ScheduleUploaderProps {
  onUpdateAction: (data: ScheduleData) => void;
}

export function SettingsScheduleUploader({ onUpdateAction }: ScheduleUploaderProps) {
  const [schedule, setSchedule] = useState<ScheduleData>({ classes: [] });
  const [subjects, setSubjects] = useState<{ name: string, classType: string }[]>([]);
  const [offDays, setOffDays] = useState<string[]>([]);
  const [newEntry, setNewEntry] = useState<Omit<ClassEntry, "id">>({
    day: "",
    subject: "",
    startTime: "",
    endTime: "",
    room: "",
    classType: ""
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState("Monday");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Load schedule, off days, and subjects from localStorage
  useEffect(() => {
    const savedSchedule = getFromLocalStorage<ScheduleData>('schedule', { classes: [] });
    const savedOffDays = getFromLocalStorage<string[]>('schedule_off_days', []);
    const savedSubjects = getFromLocalStorage<any[]>('subjects', []);
    
    // Ensure schedule is always an array, never undefined
    setSchedule(savedSchedule && savedSchedule.classes ? savedSchedule : { classes: [] });
    setOffDays(Array.isArray(savedOffDays) ? savedOffDays : []);
    setSubjects(Array.isArray(savedSubjects) ? savedSubjects.map(s => ({ name: s.name, classType: s.classType || "none" })) : []);
  }, []);

  // Update parent when schedule or off days change
  useEffect(() => {
    onUpdateAction(schedule);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, offDays]);

  const handleInputChange = (field: keyof Omit<ClassEntry, "id">, value: string) => {
    // If setting classType to "break", clear the subject
    if (field === "classType" && value === "break") {
      setNewEntry(prev => ({
        ...prev,
        classType: value,
        subject: "",
        day: currentDay
      }));
    } else {
      setNewEntry(prev => ({
        ...prev,
        [field]: field === "subject" ? capitalizeSubject(value) : value,
        day: currentDay // Always set day to current selected day
      }));
    }
  };

  const handleEditChange = (id: string, field: keyof Omit<ClassEntry, "id">, value: string) => {
    // If changing class type to break, clear the subject
    if (field === "classType" && value === "break") {
      setSchedule(prev => ({
        ...prev,
        classes: prev.classes.map(entry => 
          entry.id === id ? { 
            ...entry, 
            classType: value,
            subject: ""
          } : entry
        )
      }));
    } else {
      setSchedule(prev => ({
        ...prev,
        classes: prev.classes.map(entry => 
          entry.id === id ? { 
            ...entry, 
            [field]: field === "subject" ? capitalizeSubject(value) : value 
          } : entry
        )
      }));
    }
  };

  const handleAddClass = () => {
    if (!newEntry.subject || !newEntry.startTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the subject name and start time.",
        variant: "destructive",
      });
      return;
    }

    const newClass: ClassEntry = {
      id: Math.random().toString(36).substring(2, 9),
      ...newEntry,
      day: currentDay
    };

    const updatedSchedule = {
      ...schedule,
      classes: [...schedule.classes, newClass]
    };
    
    setSchedule(updatedSchedule);
    saveToLocalStorage('schedule', updatedSchedule);
    
    // Reset the form
    setNewEntry({
      day: "",
      subject: "",
      startTime: "",
      endTime: "",
      room: "",
      classType: ""
    });
    setIsAdding(false);
    
    toast({
      title: "Class Added",
      description: `Added ${newEntry.subject} on ${currentDay}`,
    });
  };

  const handleSaveEdit = (id: string) => {
    setEditingId(null);
    saveToLocalStorage('schedule', schedule);
    
    toast({
      title: "Class Updated",
      description: "Your class schedule has been updated.",
    });
  };

  const handleDeleteClass = (id: string) => {
    const classToDelete = schedule.classes.find(c => c.id === id);
    
    const updatedSchedule = {
      ...schedule,
      classes: schedule.classes.filter(entry => entry.id !== id)
    };
    
    setSchedule(updatedSchedule);
    saveToLocalStorage('schedule', updatedSchedule);
    
    toast({
      title: "Class Removed",
      description: `Removed ${classToDelete?.subject || 'class'} on ${classToDelete?.day || 'the schedule'}`,
    });
  };

  const handleCopyClass = (id: string) => {
    const classToCopy = schedule.classes.find(c => c.id === id);
    
    if (!classToCopy) return;
    
    // Calculate next time slot
    let newStartTime = classToCopy.endTime;
    let newEndTime = "";
    
    // If we have both start and end times, calculate the next slot with the same duration
    if (classToCopy.startTime && classToCopy.endTime) {
      // Parse the times to calculate duration
      const [startHours, startMinutes] = classToCopy.startTime.split(':').map(Number);
      const [endHours, endMinutes] = classToCopy.endTime.split(':').map(Number);
      
      // Calculate duration in minutes
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      const durationMinutes = endTotalMinutes - startTotalMinutes;
      
      // Calculate new end time
      const newStartTotalMinutes = endTotalMinutes; // Start from the previous end time
      const newEndTotalMinutes = newStartTotalMinutes + durationMinutes;
      
      // Convert back to HH:MM format
      const newEndHours = Math.floor(newEndTotalMinutes / 60);
      const newEndMinutes = newEndTotalMinutes % 60;
      
      // Format with leading zeros if needed
      newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMinutes.toString().padStart(2, '0')}`;
    }
    
    // Create a new class with a new ID and adjusted time slots
    const newClass: ClassEntry = {
      ...classToCopy,
      id: Math.random().toString(36).substring(2, 9),
      startTime: newStartTime,
      endTime: newEndTime
    };
    
    const updatedSchedule = {
      ...schedule,
      classes: [...schedule.classes, newClass]
    };
    
    setSchedule(updatedSchedule);
    saveToLocalStorage('schedule', updatedSchedule);
    
    toast({
      title: "Class Copied",
      description: `Copied ${newClass.subject} to next time slot on ${newClass.day}`,
    });
  };

  const filteredClasses = (day: string) => {
    return schedule.classes.filter(entry => entry.day === day);
  };

  const renderClassList = (day: string) => {
    const classes = filteredClasses(day);
    
    if (classes.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          No classes scheduled for {day}
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Class Type</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Room</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map(entry => (
            <TableRow key={entry.id}>
              {editingId === entry.id ? (
                // Editing mode
                <>
                  <TableCell>
                    {entry.classType === "break" ? (
                      <Input 
                        value=""
                        disabled
                        className="w-full bg-muted"
                        placeholder="Break"
                      />
                    ) : (
                      <Input 
                        value={entry.subject} 
                        onChange={(e) => handleEditChange(entry.id, "subject", e.target.value)}
                        className="w-full"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={entry.classType} 
                      onValueChange={(value) => handleEditChange(entry.id, "classType", value)}
                    >
                      <SelectTrigger className="w-full">
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
                        <SelectItem value="break">BREAK</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="time"
                      value={entry.startTime} 
                      onChange={(e) => handleEditChange(entry.id, "startTime", e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="time"
                      value={entry.endTime} 
                      onChange={(e) => handleEditChange(entry.id, "endTime", e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={entry.room} 
                      onChange={(e) => handleEditChange(entry.id, "room", e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleSaveEdit(entry.id)}>
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </TableCell>
                </>
              ) : (
                // Display mode
                <>
                  <TableCell>
                    {entry.classType === "break" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      entry.subject.toUpperCase()
                    )}
                  </TableCell>
                  <TableCell>{entry.classType === "none" || !entry.classType ? "—" : entry.classType.toUpperCase()}</TableCell>
                  <TableCell>{entry.startTime}</TableCell>
                  <TableCell>{entry.endTime}</TableCell>
                  <TableCell>{entry.room ? entry.room : "Not Specified"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(entry.id)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopyClass(entry.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteClass(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Add a function to toggle off day status
  const toggleOffDay = (day: string) => {
    let updatedOffDays: string[];
    
    if (offDays.includes(day)) {
      // Remove from off days
      updatedOffDays = offDays.filter(d => d !== day);
    } else {
      // Add to off days
      updatedOffDays = [...offDays, day];
    }
    
    setOffDays(updatedOffDays);
    saveToLocalStorage('schedule_off_days', updatedOffDays);
    
    toast({
      title: offDays.includes(day) ? "Off Day Removed" : "Off Day Set",
      description: offDays.includes(day) 
        ? `${day} is no longer marked as an off day.` 
        : `${day} has been marked as an off day.`,
    });
  };

  // Add the capitalizeSubject function
  const capitalizeSubject = (text: string): string => {
    // Convert entire text to uppercase instead of just capitalizing
    return text.toUpperCase();
  };

  // Also update when subject is set to "_custom"
  useEffect(() => {
    if (newEntry.subject === "_custom") {
      handleInputChange("subject", "");
    }
  }, [newEntry.subject]);

  // Add clear schedule function
  const handleClearSchedule = () => {
    // Show confirmation dialog before clearing
    if (window.confirm("Are you sure you want to clear your entire schedule? This will also remove all associated subject data. This action cannot be undone.")) {
      // Clear schedule
      const emptySchedule: ScheduleData = { classes: [] };
      setSchedule(emptySchedule);
      setOffDays([]);
      
      // Clear localStorage - these will be automatically namespaced with user ID
      saveToLocalStorage('schedule', emptySchedule);
      saveToLocalStorage('schedule_off_days', []);
      saveToLocalStorage('subjects', []);
      
      // Notify parent component
      onUpdateAction(emptySchedule);
      
      toast({
        title: "Schedule Cleared",
        description: "Your entire schedule and associated subject data have been removed.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Schedule</CardTitle>
        <CardDescription>Manage your weekly class schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Monday" onValueChange={setCurrentDay}>
          <TabsList className="w-full grid grid-cols-7">
            {days.map(day => (
              <TabsTrigger key={day} value={day} className={offDays.includes(day) ? "bg-muted/20" : ""}>
                {day.substring(0, 3)}
                {offDays.includes(day) && <CalendarOff className="ml-1 h-3 w-3 text-muted-foreground" />}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {days.map(day => (
            <TabsContent key={day} value={day} className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">{day}'s Classes</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`offday-${day}`} 
                      checked={offDays.includes(day)} 
                      onCheckedChange={() => toggleOffDay(day)}
                    />
                    <label 
                      htmlFor={`offday-${day}`}
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Mark as off day
                    </label>
                  </div>
                </div>
                {!isAdding && !offDays.includes(day) && (
                  <Button onClick={() => setIsAdding(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Class
                  </Button>
                )}
              </div>
              
              {offDays.includes(day) ? (
                <div className="bg-muted/20 rounded-md p-6 text-center">
                  <CalendarOff className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-1">This is an off day</h3>
                  <p className="text-muted-foreground">No classes are scheduled for {day}.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => toggleOffDay(day)}
                  >
                    Remove off day status
                  </Button>
                </div>
              ) : (
                <>
                  {isAdding && currentDay === day && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Add New Class</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                                                          <div className="flex items-center">
                                <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                              {newEntry.classType === "break" ? (
                                <Input
                                  id="subject"
                                  placeholder="Break"
                                  value=""
                                  disabled
                                  className="bg-muted"
                                />
                              ) : subjects.length > 0 ? (
                                <Select 
                                  value={newEntry.subject} 
                                  onValueChange={(value) => {
                                    const selectedSubject = subjects.find(s => s.name === value);
                                    handleInputChange("subject", value);
                                    
                                    // Also set the class type if available from the selected subject
                                    if (selectedSubject && selectedSubject.classType && selectedSubject.classType !== "none") {
                                      handleInputChange("classType", selectedSubject.classType);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select subject" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subjects.map(subject => (
                                      <SelectItem key={subject.name} value={subject.name}>
                                        {subject.name}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="_custom">+ Add Custom Subject</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  id="subject"
                                  placeholder="Subject Name"
                                  value={newEntry.subject}
                                  onChange={(e) => handleInputChange("subject", e.target.value)}
                                />
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="classType">Class Type</Label>
                            <Select 
                              value={newEntry.classType} 
                              onValueChange={(value) => handleInputChange("classType", value)}
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
                                <SelectItem value="break">BREAK</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="startTime"
                                type="time"
                                value={newEntry.startTime}
                                onChange={(e) => handleInputChange("startTime", e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="endTime">End Time</Label>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="endTime"
                                type="time"
                                value={newEntry.endTime}
                                onChange={(e) => handleInputChange("endTime", e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="room">Room</Label>
                            <div className="flex items-center">
                              <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="room"
                                placeholder="Room Number"
                                value={newEntry.room}
                                onChange={(e) => handleInputChange("room", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button onClick={handleAddClass}>Add Class</Button>
                      </CardFooter>
                    </Card>
                  )}
                  
                  {renderClassList(day)}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Your schedule is automatically saved to your device
          </p>
          <Button 
            variant="outline"
            className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleClearSchedule}
          >
            Clear Schedule
          </Button>
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              const classCount = schedule.classes.length;
              const offDayCount = offDays.length;
              toast({
                title: "Schedule Saved",
                description: `You have ${classCount} classes and ${offDayCount} off days in your weekly schedule.`
              });
            }}
          >
            <Save className="mr-2 h-4 w-4" /> Save Schedule
          </Button>
          <Button 
            variant="default"
            onClick={() => {
              // Extract unique subject-classType combinations from the schedule (excluding breaks)
              const subjectMap = new Map();
              
              // First, collect all unique subjects
              schedule.classes.forEach(cls => {
                // Skip classes with break type
                if (cls.classType === "break") return;
                
                const subjectLower = cls.subject.toLowerCase();
                
                if (!subjectMap.has(subjectLower)) {
                  subjectMap.set(subjectLower, {
                    name: cls.subject.toUpperCase(),
                    classTypes: new Map()
                  });
                }
              });
              
              // Then, for each subject, count classes by class type
              subjectMap.forEach((subjectData, subjectKey) => {
                // For each unique subject, count occurrences by class type
                schedule.classes.forEach(cls => {
                  if (cls.classType === "break") return;
                  if (cls.subject.toLowerCase() !== subjectKey) return;
                  
                  const classType = cls.classType || "none";
                  
                  if (!subjectData.classTypes.has(classType)) {
                    subjectData.classTypes.set(classType, {
                      count: 1,
                      type: classType
                    });
                  } else {
                    const typeData = subjectData.classTypes.get(classType);
                    typeData.count++;
                  }
                });
              });
              
              // Now convert to uniqueSubjects map with the right format
              const uniqueSubjects = new Map();
              
              subjectMap.forEach((subjectData, subjectKey) => {
                let totalClasses = 0;
                let primaryClassType = "none";
                let maxClassTypeCount = 0;
                
                // Find the most common class type for this subject
                subjectData.classTypes.forEach((typeData: ClassTypeData, classType: string) => {
                  totalClasses += typeData.count;
                  
                  if (typeData.count > maxClassTypeCount) {
                    maxClassTypeCount = typeData.count;
                    primaryClassType = classType;
                  }
                });
                
                uniqueSubjects.set(subjectKey, {
                  name: subjectData.name,
                  classType: primaryClassType,
                  count: totalClasses,
                  classTypeBreakdown: Object.fromEntries(subjectData.classTypes)
                });
              });
              
              // Get existing subjects from localStorage
              const savedSubjects = getFromLocalStorage<Subject[]>('subjects', []);
              const existingSubjectMap = new Map(
                savedSubjects.map(s => [s.name.toLowerCase(), s])
              );
              
              // Merge new subjects with existing ones
              const updatedSubjects: Subject[] = [...savedSubjects];
              
              // Update existing subjects with new data
              uniqueSubjects.forEach((data: any, key: string) => {
                if (existingSubjectMap.has(key)) {
                  // Update existing subject
                  const index = updatedSubjects.findIndex(
                    s => s.name.toLowerCase() === key
                  );
                  if (index !== -1) {
                    updatedSubjects[index] = {
                      ...updatedSubjects[index],
                      classesPerWeek: data.count,
                      // Only update class type if not already set
                      classType: updatedSubjects[index].classType === "none" ? 
                                data.classType : updatedSubjects[index].classType
                    };
                  }
                } else {
                  // Add new subject
                  updatedSubjects.push({
                    id: Math.random().toString(36).substring(2, 9),
                    name: data.name,
                    code: "", // User will need to fill this in
                    classType: data.classType,
                    classesPerWeek: data.count
                  });
                }
              });
              
              // Save updated subjects to localStorage
              saveToLocalStorage('subjects', updatedSubjects);
              
              const newSubjectsCount = uniqueSubjects.size - existingSubjectMap.size;
              
              toast({
                title: "Schedule Uploaded to Subjects",
                description: `Updated ${existingSubjectMap.size} subjects and added ${newSubjectsCount > 0 ? newSubjectsCount : 0} new subjects.`
              });
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" /> Upload to Subjects
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 