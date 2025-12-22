"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Save, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ClassEntry {
  id: string;
  day: string;
  name: string;
  time: string;
  room: string;
}

interface ScheduleData {
  classes: ClassEntry[];
}

export function ScheduleUploader() {
  const [schedule, setSchedule] = useState<ScheduleData>({ classes: [] });
  const [newEntry, setNewEntry] = useState<Omit<ClassEntry, "id">>({
    day: "",
    name: "",
    time: "",
    room: ""
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load initial schedule data from localStorage
  useEffect(() => {
    const savedSchedule = getFromLocalStorage<ScheduleData>('schedule', { classes: [] });
    if (savedSchedule && savedSchedule.classes.length > 0) {
      setSchedule(savedSchedule);
    }
  }, []);

  const handleInputChange = (field: keyof Omit<ClassEntry, "id">, value: string) => {
    setNewEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditChange = (id: string, field: keyof Omit<ClassEntry, "id">, value: string) => {
    setSchedule(prev => ({
      ...prev,
      classes: prev.classes.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const saveScheduleData = (data: ScheduleData) => {
    saveToLocalStorage('schedule', data);
  };

  const handleAddClass = () => {
    if (!newEntry.day || !newEntry.name || !newEntry.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the day, subject name, and time.",
        variant: "destructive",
      });
      return;
    }

    const newClass: ClassEntry = {
      id: Math.random().toString(36).substring(2, 9),
      ...newEntry
    };

    const updatedSchedule = {
      classes: [...schedule.classes, newClass]
    };
    
    setSchedule(updatedSchedule);
    saveScheduleData(updatedSchedule);
    
    // Reset the form
    setNewEntry({
      day: "",
      name: "",
      time: "",
      room: ""
    });
    setIsAdding(false);
    
    toast({
      title: "Class Added",
      description: `Added ${newEntry.name} on ${newEntry.day}`,
    });
  };

  const handleSaveEdit = (id: string) => {
    setEditingId(null);
    saveScheduleData(schedule);
    
    toast({
      title: "Class Updated",
      description: "Your schedule has been updated.",
    });
  };

  const handleDeleteClass = (id: string) => {
    const updatedSchedule = {
      classes: schedule.classes.filter(entry => entry.id !== id)
    };
    
    setSchedule(updatedSchedule);
    saveScheduleData(updatedSchedule);
    
    toast({
      title: "Class Removed",
      description: "The class has been removed from your schedule.",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Manage your weekly class schedule</CardDescription>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <Card className="border border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Add New Class</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="day">Day of Week</Label>
                  <Select value={newEntry.day} onValueChange={(value) => handleInputChange("day", value)}>
                    <SelectTrigger id="day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input 
                    id="name" 
                    value={newEntry.name} 
                    onChange={(e) => handleInputChange("name", e.target.value)} 
                    placeholder="Mathematics"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time" 
                    value={newEntry.time} 
                    onChange={(e) => handleInputChange("time", e.target.value)} 
                    placeholder="09:00 - 10:30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="room">Room (Optional)</Label>
                  <Input 
                    id="room" 
                    value={newEntry.room} 
                    onChange={(e) => handleInputChange("room", e.target.value)} 
                    placeholder="A101"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAddClass}>Add to Schedule</Button>
            </CardFooter>
          </Card>
        )}

        {schedule.classes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Room</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.classes.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {editingId === entry.id ? (
                      <Select 
                        value={entry.day} 
                        onValueChange={(value) => handleEditChange(entry.id, "day", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      entry.day
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === entry.id ? (
                      <Input 
                        value={entry.name} 
                        onChange={(e) => handleEditChange(entry.id, "name", e.target.value)}
                      />
                    ) : (
                      entry.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === entry.id ? (
                      <Input 
                        value={entry.time} 
                        onChange={(e) => handleEditChange(entry.id, "time", e.target.value)}
                      />
                    ) : (
                      entry.time
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === entry.id ? (
                      <Input 
                        value={entry.room} 
                        onChange={(e) => handleEditChange(entry.id, "room", e.target.value)}
                      />
                    ) : (
                      entry.room || "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === entry.id ? (
                      <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(entry.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(entry.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No classes added yet. Add your first class to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
