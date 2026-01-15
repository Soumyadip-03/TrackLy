"use client"

import { useState, useEffect } from "react"
import { CheckSquare, Clock, Trash2, Plus, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { todoService } from "@/lib/services/todo-service"
import { format } from "date-fns"

interface TodoItem {
  _id: string
  title: string
  description: string
  dueDate: string | null
  completed: boolean
  priority: "low" | "medium" | "high"
  createdAt: string
  updatedAt: string
}

export function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load todos from database
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

  const handleToggleComplete = async (id: string) => {
    try {
      await todoService.toggle(id)
      await loadTodos()
      
      const todo = todos.find((t) => t._id === id)
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

  const handleDelete = async (id: string) => {
    const todo = todos.find((t) => t._id === id)
    
    try {
      await todoService.delete(id)
      await loadTodos()
      
      if (todo) {
        toast({
          title: "Task Deleted",
          description: `"${todo.title}" has been removed from your to-do list.`,
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

  // Filter todos
  const pendingTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)

  // Sort todos by date
  const sortedPendingTodos = [...pendingTodos].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return 0
  })
  const sortedCompletedTodos = [...completedTodos].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
  
  // Navigate to todo page
  const handleAddTodo = () => {
    window.location.href = '/todo';
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>To-Do List</CardTitle>
          <CardDescription>Loading your tasks...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>To-Do List</CardTitle>
          <CardDescription>Manage your tasks and assignments</CardDescription>
        </div>
        <Button onClick={handleAddTodo} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {todos.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start by adding your first task
            </p>
            <Button onClick={handleAddTodo} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create a new task
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Pending ({pendingTodos.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedTodos.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 mt-4">
              {sortedPendingTodos.length > 0 ? (
                sortedPendingTodos.map((todo) => (
                  <div key={todo._id} className="flex items-start space-x-3 p-3 rounded-md border">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo._id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{todo.title}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{todo.priority}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{todo.description}</p>
                      {todo.dueDate && (
                        <div className="flex items-center text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Due: {format(new Date(todo.dueDate), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(todo._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No pending tasks. Great job!</p>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-4">
              {sortedCompletedTodos.length > 0 ? (
                sortedCompletedTodos.map((todo) => (
                  <div key={todo._id} className="flex items-start space-x-3 p-3 rounded-md border bg-muted/50">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo._id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium line-through">{todo.title}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{todo.priority}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-through">{todo.description}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <CheckSquare className="h-3 w-3 mr-1" />
                        <span>Completed on {format(new Date(todo.updatedAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(todo._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No completed tasks yet.</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
