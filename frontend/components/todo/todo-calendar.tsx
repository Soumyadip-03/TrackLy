"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"

interface TodoItem {
  id: string
  date: Date
  subject: string
  time: string
  title: string
  description: string
}

export function TodoCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load saved todos on component mount
  useEffect(() => {
    const savedTodos = getFromLocalStorage<any[]>('calendar_todos', []);
    
    // Convert date strings back to Date objects
    const todosWithDates = savedTodos.map(todo => ({
      ...todo,
      date: new Date(todo.date)
    }));
    
    setTodos(todosWithDates);
  }, []);

  const [newTodo, setNewTodo] = useState<Partial<TodoItem>>({
    date: new Date(),
    subject: "",
    time: "",
    title: "",
    description: "",
  })

  const handleAddTodo = () => {
    if (!newTodo.subject || !newTodo.title || !newTodo.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const newId = Math.random().toString(36).substring(2, 9)
    const updatedTodos = [...todos, { ...newTodo, id: newId } as TodoItem];
    setTodos(updatedTodos)
    setHasUnsavedChanges(true)
    setIsDialogOpen(false)

    toast({
      title: "To-Do Added",
      description: `"${newTodo.title}" has been added to your to-do list.`,
    })

    // Reset form
    setNewTodo({
      date: new Date(),
      subject: "",
      time: "",
      title: "",
      description: "",
    })
  }

  const handleNewTodoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTodo((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTodo((prev) => ({ ...prev, subject: e.target.value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setNewTodo((prev) => ({ ...prev, date }))
    }
  }

  const handleSave = () => {
    try {
      // Save todos to localStorage
      // Convert dates to strings for storage
      const todosForStorage = todos.map(todo => ({
        ...todo,
        date: todo.date.toISOString()
      }));
      
      saveToLocalStorage('calendar_todos', todosForStorage);
      
      setHasUnsavedChanges(false);
      toast({
        title: "Calendar Saved",
        description: "Your calendar tasks have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving calendar tasks:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your calendar tasks.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
    setHasUnsavedChanges(true);
    toast({
      title: "Task Removed",
      description: "The task has been removed from your calendar.",
    })
  }

  // Get todos for the selected date
  const selectedDateTodos = todos.filter((todo) => date && todo.date.toDateString() === date.toDateString())

  // Get dates with todos
  const todoDates = todos.map((todo) => todo.date)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>To-Do Calendar</CardTitle>
          <CardDescription>Schedule and manage your tasks</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={hasUnsavedChanges ? "default" : "outline"} 
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>Create a new task for your calendar.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="task-date" className="text-right">
                    Date
                  </Label>
                  <div className="col-span-3">
                    <Calendar
                      mode="single"
                      selected={newTodo.date}
                      onSelect={handleDateChange}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="task-subject" className="text-right">
                    Subject
                  </Label>
                  <Input
                    id="task-subject"
                    name="subject"
                    value={newTodo.subject}
                    onChange={handleSubjectChange}
                    placeholder="Enter subject name"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="task-time" className="text-right">
                    Time
                  </Label>
                  <Input
                    id="task-time"
                    name="time"
                    type="time"
                    value={newTodo.time}
                    onChange={handleNewTodoChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="task-title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="task-title"
                    name="title"
                    value={newTodo.title}
                    onChange={handleNewTodoChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="task-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="task-description"
                    name="description"
                    value={newTodo.description}
                    onChange={handleNewTodoChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTodo}>Add Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            modifiers={{
              booked: (date) => {
                return todoDates.some((todoDate) => todoDate.toDateString() === date.toDateString())
              },
            }}
            modifiersStyles={{
              booked: {
                fontWeight: "bold",
                backgroundColor: "hsl(var(--primary) / 0.1)",
                color: "hsl(var(--primary))",
              },
            }}
          />
        </div>

        {date && (
          <div className="border-t p-4">
            <h3 className="font-medium mb-2">
              {date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>

            {selectedDateTodos.length > 0 ? (
              <div className="space-y-3">
                {selectedDateTodos.map((todo) => (
                  <div key={todo.id} className="flex items-start space-x-3 p-2 rounded-md border">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{todo.title}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {todo.subject}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {todo.time} - {todo.description}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                      onClick={() => handleDeleteTodo(todo.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks scheduled for this day.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
