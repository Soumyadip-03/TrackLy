"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Save, Trash2, Clock, Home, BookOpen, Plus, Copy, CalendarOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { subjectService } from "@/lib/services/subject-service"
import { fetchWithAuth } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

interface ScheduleManagerProps {
  onUpdateAction?: (data: ScheduleData) => void;
}

export function ScheduleManager({ onUpdateAction }: ScheduleManagerProps = {}) {
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

  // Load schedule from database on mount
  useEffect(() => {
    loadScheduleFromDB();
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getAll();
      setSubjects(data.map(s => ({ name: s.name, classType: s.classType || "none" })));
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadScheduleFromDB = async () => {
    try {
      const response = await fetchWithAuth('/schedule');
      if (response.ok) {
        const data = await response.json();
        const scheduleData = data.data || { classes: [] };
        
        // Ensure each class has an id field
        if (scheduleData.classes) {
          scheduleData.classes = scheduleData.classes.map((cls: any) => ({
            ...cls,
            id: cls.id || cls._id || Math.random().toString(36).substring(2, 9)
          }));
        }
        
        setSchedule(scheduleData);
        setOffDays(scheduleData?.offDays || []);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  };

  const saveScheduleToDB = async (scheduleData: ScheduleData, offDaysData?: string[]) => {
    try {
      console.log('Saving schedule to DB:', scheduleData);
      const response = await fetchWithAuth('/schedule', {
        method: 'POST',
        body: JSON.stringify({ classes: scheduleData.classes, offDays: offDaysData || offDays })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Schedule saved successfully:', result);
      } else {
        console.error('Failed to save schedule:', response.status);
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: "Failed to save schedule.",
        variant: "destructive"
      });
    }
  };

  // Update parent when schedule or off days change
  useEffect(() => {
    onUpdateAction?.(schedule);
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
    saveScheduleToDB(updatedSchedule);
    
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
    saveScheduleToDB(schedule);
    
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
    saveScheduleToDB(updatedSchedule);
    
    toast({
      title: "Class Removed",
      description: `Removed ${classToDelete?.subject || 'class'} on ${classToDelete?.day || 'the schedule'}`,
    });
  };

  const handleCopyClass = (id: string) => {
    const classToCopy = schedule.classes.find(c => c.id === id);
    
    if (!classToCopy) return;
    
    let newStartTime = classToCopy.endTime;
    let newEndTime = "";
    
    if (classToCopy.startTime && classToCopy.endTime) {
      const [startHours, startMinutes] = classToCopy.startTime.split(':').map(Number);
      const [endHours, endMinutes] = classToCopy.endTime.split(':').map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      const durationMinutes = endTotalMinutes - startTotalMinutes;
      
      const newStartTotalMinutes = endTotalMinutes;
      const newEndTotalMinutes = newStartTotalMinutes + durationMinutes;
      
      const newEndHours = Math.floor(newEndTotalMinutes / 60);
      const newEndMinutes = newEndTotalMinutes % 60;
      
      newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMinutes.toString().padStart(2, '0')}`;
    }
    
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
    saveScheduleToDB(updatedSchedule);
    
    toast({
      title: "Class Copied",
      description: `Copied ${newClass.subject} to next time slot on ${newClass.day}`,
    });
  };

  const getClassCount = (day: string) => {
    return schedule.classes.filter(entry => entry.day === day).length;
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
            <TableHead className="w-[30%]">Subject</TableHead>
            <TableHead className="w-[15%]">Class Type</TableHead>
            <TableHead className="w-[12%]">Start Time</TableHead>
            <TableHead className="w-[12%]">End Time</TableHead>
            <TableHead className="w-[12%]">Bl-Room</TableHead>
            <TableHead className="w-[19%] text-right">Actions</TableHead>
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

  const toggleOffDay = (day: string) => {
    let updatedOffDays: string[];
    
    if (offDays.includes(day)) {
      updatedOffDays = offDays.filter(d => d !== day);
    } else {
      updatedOffDays = [...offDays, day];
    }
    
    setOffDays(updatedOffDays);
    saveScheduleToDB(schedule, updatedOffDays);
    
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

  const handleClearSchedule = async () => {
    if (window.confirm("Are you sure you want to clear your entire schedule? This action cannot be undone.")) {
      const emptySchedule: ScheduleData = { classes: [] };
      setSchedule(emptySchedule);
      setOffDays([]);
      
      try {
        await fetchWithAuth('/schedule', {
          method: 'DELETE'
        });
        
        onUpdateAction?.(emptySchedule);
        
        toast({
          title: "Schedule Cleared",
          description: "Your schedule has been cleared.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to clear schedule.",
          variant: "destructive"
        });
      }
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
            {days.map(day => {
              const classCount = getClassCount(day);
              return (
                <TabsTrigger key={day} value={day} className={offDays.includes(day) ? "bg-muted/20" : ""}>
                  <div className="flex flex-col items-center">
                    <span>{day.substring(0, 3)}</span>
                    {classCount > 0 && !offDays.includes(day) && (
                      <span className="text-xs text-muted-foreground">({classCount})</span>
                    )}
                    {offDays.includes(day) && <CalendarOff className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </TabsTrigger>
              );
            })}
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
                            <Label htmlFor="room">Building-Room</Label>
                            <div className="flex items-center">
                              <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="room"
                                placeholder="e.g., 4-101"
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
          <Button 
            variant="outline"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleClearSchedule}
          >
            Clear Schedule
          </Button>
        </div>
        <div className="space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default"
                  onClick={async () => {
              try {
                const subjectMap = new Map();
                
                schedule.classes.forEach(cls => {
                  if (cls.classType === "break") return;
                  
                  const subjectLower = cls.subject.toLowerCase();
                  
                  if (!subjectMap.has(subjectLower)) {
                    subjectMap.set(subjectLower, {
                      name: cls.subject.toUpperCase(),
                      classTypes: new Map()
                    });
                  }
                  
                  const classType = cls.classType || "none";
                  const subjectData = subjectMap.get(subjectLower);
                  
                  if (!subjectData.classTypes.has(classType)) {
                    subjectData.classTypes.set(classType, 1);
                  } else {
                    subjectData.classTypes.set(classType, subjectData.classTypes.get(classType) + 1);
                  }
                });
                
                const existingSubjects = await subjectService.getAll();
                const existingMap = new Map(
                  existingSubjects.map(s => [s.name.toLowerCase(), s])
                );
                
                let created = 0;
                let updated = 0;
                
                for (const [key, data] of subjectMap) {
                  let totalClasses = 0;
                  let primaryClassType = "none";
                  let maxCount = 0;
                  
                  data.classTypes.forEach((count: number, type: string) => {
                    totalClasses += count;
                    if (count > maxCount) {
                      maxCount = count;
                      primaryClassType = type;
                    }
                  });
                  
                  const existing = existingMap.get(key);
                  
                  if (existing) {
                    await subjectService.update(existing._id, {
                      classesPerWeek: totalClasses,
                      classType: existing.classType === "none" ? primaryClassType : existing.classType
                    });
                    updated++;
                  } else {
                    await subjectService.create({
                      name: data.name,
                      code: "",
                      classType: primaryClassType,
                      classesPerWeek: totalClasses,
                      semester: 1
                    });
                    created++;
                  }
                }
                
                toast({
                  title: "Uploaded to Subjects",
                  description: `Created ${created} new, updated ${updated} existing.`
                });
                
                await loadSubjects();
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to upload subjects.",
                  variant: "destructive"
                });
              }
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" /> Upload to Subjects
          </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>Automatically create or update subjects from your schedule. This will extract all unique subjects and their class counts.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
} 