"use client"

import { useState, useEffect } from "react"
import { TodoForm, TodoItem } from "@/components/todo/todo-form"
import { PageHeader } from "@/components/page-header"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { format, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { saveToLocalStorage } from "@/lib/storage-utils"
import { toast } from "@/components/ui/use-toast"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClientOnly } from "@/components/client-only"

export default function TodoPage() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load todos from localStorage - only after component mounts on client
  useEffect(() => {
    const loadTodos = () => {
      try {
        const savedTodos = getFromLocalStorage<TodoItem[]>('todos', [])
        setTodos(savedTodos)
      } catch (error) {
        console.error("Error loading todos:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTodos()
    
    // Listen for updates
    const handleTodosUpdated = () => {
      loadTodos()
    }
    
    window.addEventListener('todosUpdated', handleTodosUpdated)
    window.addEventListener('storage', handleTodosUpdated)
    
    return () => {
      window.removeEventListener('todosUpdated', handleTodosUpdated)
      window.removeEventListener('storage', handleTodosUpdated)
    }
  }, [])
  
  // Toggle todo completion status
  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
    
    // Save to localStorage
    saveToLocalStorage('todos', updatedTodos)
    setTodos(updatedTodos)
    
    const todo = todos.find(t => t.id === id)
    if (todo) {
      toast({
        title: todo.completed ? "Task marked incomplete" : "Task completed",
        description: todo.title,
      })
    }
  }
  
  // Delete todo
  const deleteTodo = (id: string) => {
    const todo = todos.find(t => t.id === id)
    
    const updatedTodos = todos.filter(todo => todo.id !== id)
    
    // Save to localStorage
    saveToLocalStorage('todos', updatedTodos)
    setTodos(updatedTodos)
    
    if (todo) {
      toast({
        title: "Task deleted",
        description: `"${todo.title}" has been removed`,
      })
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
      <PageHeader title="Todo List" description="Manage your tasks and assignments" />
      
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
                      .slice()
                      .sort((a, b) => {
                        // First by completion status
                        if (a.completed !== b.completed) {
                          return a.completed ? 1 : -1
                        }
                        // Then by priority if due date is not available
                        const priorities = { high: 3, medium: 2, low: 1 }
                        const priorityA = priorities[a.priority]
                        const priorityB = priorities[b.priority]
                        
                        // Sort by due date if available
                        if (a.dueDate && b.dueDate) {
                          return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
                        } else if (a.dueDate) {
                          return -1
                        } else if (b.dueDate) {
                          return 1
                        }
                        
                        return priorityB - priorityA
                      })
                      .map((todo) => (
                        <div 
                          key={todo.id} 
                          className={`border rounded-lg p-4 transition-all ${
                            todo.completed ? 'opacity-60 bg-muted/30' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              checked={todo.completed}
                              onCheckedChange={() => toggleTodo(todo.id)}
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
                                    {format(parseISO(todo.dueDate), 'PPP')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteTodo(todo.id)} 
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
