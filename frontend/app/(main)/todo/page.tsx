"use client"

import { useState, useEffect } from "react"
import { TodoForm, TodoItem } from "@/components/todo/todo-form"
import { todoService } from "@/lib/services/todo-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { format, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClientOnly } from "@/components/client-only"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function TodoPage() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined)
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium")
  const [isSaving, setIsSaving] = useState(false)

  // Load todos from API
  const loadTodos = async () => {
    try {
      const data = await todoService.getAll()
      setTodos(data)
    } catch (error) {
      console.error("Error loading todos:", error)
      toast({
        title: "Error",
        description: "Failed to load todos",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTodos()
    
    const handleTodosUpdated = () => {
      loadTodos()
    }
    
    window.addEventListener('todosUpdated', handleTodosUpdated)
    
    return () => {
      window.removeEventListener('todosUpdated', handleTodosUpdated)
    }
  }, [])
  
  // Toggle todo completion
  const toggleTodo = async (id: string) => {
    try {
      await todoService.toggle(id)
      await loadTodos()
      
      const todo = todos.find(t => t._id === id)
      if (todo) {
        toast({
          title: todo.completed ? "Task marked incomplete" : "Task completed",
          description: todo.title,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive"
      })
    }
  }
  
  // Delete todo
  const deleteTodo = async (id: string) => {
    const todo = todos.find(t => t._id === id)
    
    try {
      await todoService.delete(id)
      await loadTodos()
      
      if (todo) {
        toast({
          title: "Task deleted",
          description: `"${todo.title}" has been removed`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete todo",
        variant: "destructive"
      })
    }
  }
  
  // Open edit dialog
  const openEditDialog = (todo: TodoItem) => {
    setEditingTodo(todo)
    setEditTitle(todo.title)
    setEditDescription(todo.description || "")
    setEditDueDate(todo.dueDate ? new Date(todo.dueDate) : undefined)
    setEditPriority(todo.priority)
  }
  
  // Save edited todo
  const saveEdit = async () => {
    if (!editingTodo) return
    
    setIsSaving(true)
    try {
      await todoService.update(editingTodo._id, {
        title: editTitle,
        description: editDescription,
        dueDate: editDueDate ? editDueDate.toISOString() : null,
        priority: editPriority
      })
      
      await loadTodos()
      setEditingTodo(null)
      
      toast({
        title: "Task updated",
        description: "Your changes have been saved"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Get badge color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 hover:bg-red-600'
      case 'medium': return 'bg-blue-500 hover:bg-blue-600'
      case 'low': return 'bg-green-500 hover:bg-green-600'
      default: return 'bg-slate-500 hover:bg-slate-600'
    }
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Todo Form */}
        <div className="lg:col-span-2">
          <ClientOnly>
            <TodoForm />
          </ClientOnly>
        </div>
        
        {/* Right: Todo List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Tasks</CardTitle>
              <CardDescription>Manage your upcoming tasks and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientOnly fallback={
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : todos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks yet. Add a new task to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todos
                      .sort((a, b) => {
                        if (a.completed !== b.completed) {
                          return a.completed ? 1 : -1
                        }
                        const priorities = { high: 3, medium: 2, low: 1 }
                        const priorityA = priorities[a.priority]
                        const priorityB = priorities[b.priority]
                        
                        if (a.dueDate && b.dueDate) {
                          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                        } else if (a.dueDate) {
                          return -1
                        } else if (b.dueDate) {
                          return 1
                        }
                        
                        return priorityB - priorityA
                      })
                      .map((todo) => (
                        <div 
                          key={todo._id} 
                          className={`border rounded-lg p-4 transition-all ${
                            todo.completed ? 'opacity-60 bg-muted/30' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              checked={todo.completed}
                              onCheckedChange={() => toggleTodo(todo._id)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between">
                                <h3 className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {todo.title}
                                </h3>
                                <Badge className={getPriorityColor(todo.priority)}>
                                  {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                                </Badge>
                              </div>
                              {todo.description && (
                                <p className="text-sm text-muted-foreground">{todo.description}</p>
                              )}
                              {todo.dueDate && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span>Due:</span>
                                  <span className="font-medium">
                                    {format(new Date(todo.dueDate), 'PPP')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => openEditDialog(todo)}
                                    className="text-muted-foreground hover:text-primary"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Task</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-title">Title</Label>
                                      <Input 
                                        id="edit-title"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-description">Description</Label>
                                      <Textarea 
                                        id="edit-description"
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        rows={3}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Due Date</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "w-full justify-start text-left font-normal",
                                              !editDueDate && "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {editDueDate ? format(editDueDate, "PPP") : "Pick a date"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                          <Calendar
                                            mode="single"
                                            selected={editDueDate}
                                            onSelect={setEditDueDate}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Priority</Label>
                                      <div className="flex space-x-2">
                                        <Button 
                                          type="button"
                                          variant={editPriority === "low" ? "default" : "outline"}
                                          className={editPriority === "low" ? "bg-green-500 hover:bg-green-600" : ""}
                                          onClick={() => setEditPriority("low")}
                                        >
                                          Low
                                        </Button>
                                        <Button 
                                          type="button"
                                          variant={editPriority === "medium" ? "default" : "outline"}
                                          className={editPriority === "medium" ? "bg-blue-500 hover:bg-blue-600" : ""}
                                          onClick={() => setEditPriority("medium")}
                                        >
                                          Medium
                                        </Button>
                                        <Button 
                                          type="button"
                                          variant={editPriority === "high" ? "default" : "outline"}
                                          className={editPriority === "high" ? "bg-red-500 hover:bg-red-600" : ""}
                                          onClick={() => setEditPriority("high")}
                                        >
                                          High
                                        </Button>
                                      </div>
                                    </div>
                                    <Button onClick={saveEdit} disabled={isSaving} className="w-full">
                                      {isSaving ? "Saving..." : "Save Changes"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteTodo(todo._id)} 
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </ClientOnly>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
