"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils" 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarIcon, Check, Edit, Trash2, X } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Todo item type
export interface TodoItem {
  id: string
  title: string
  description: string
  dueDate: string
  completed: boolean
  priority: "low" | "medium" | "high"
  createdAt: string
}

interface TodoFormProps {
  onUpdateAction: (data: TodoItem[]) => void;
}

export function SettingsTodoForm({ onUpdateAction }: TodoFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [todoItems, setTodoItems] = useState<TodoItem[]>([])
  const [editingTodo, setEditingTodo] = useState<string | null>(null)

  // Load initial data 
  useEffect(() => {
    const savedTodos = getFromLocalStorage<TodoItem[]>('todos', []);
    setTodoItems(savedTodos || []);
  }, []);

  // Add this to notify parent when todos change
  useEffect(() => {
    onUpdateAction(todoItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todoItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a title for your todo item",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Create new todo item
      const newTodo: TodoItem = {
        id: crypto.randomUUID(),
        title,
        description,
        dueDate: dueDate ? dueDate.toISOString() : "",
        completed: false,
        priority,
        createdAt: new Date().toISOString()
      }
      
      const updatedTodos = [...todoItems, newTodo];
      setTodoItems(updatedTodos);
      
      // Show success message
      toast({
        title: "Todo Created",
        description: "Your new todo item has been saved",
      })
      
      // Reset form
      setTitle("")
      setDescription("")
      setDueDate(undefined)
      setPriority("medium")
      
    } catch (error) {
      console.error("Error saving todo:", error)
      toast({
        title: "Error",
        description: "There was a problem saving your todo item",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTodo = (id: string) => {
    const updatedTodos = todoItems.filter((todo) => todo.id !== id);
    setTodoItems(updatedTodos);
    
    toast({
      title: "Todo Deleted",
      description: "The todo item has been deleted",
    });
  }

  const handleToggleComplete = (id: string) => {
    const updatedTodos = todoItems.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    
    setTodoItems(updatedTodos);
    
    const todo = todoItems.find((todo) => todo.id === id);
    
    toast({
      title: todo?.completed ? "Todo Marked Incomplete" : "Todo Completed",
      description: `"${todo?.title}" has been ${todo?.completed ? "marked as incomplete" : "marked as complete"}`,
    });
  }

  const handleEditTodo = (id: string) => {
    setEditingTodo(id);
    
    // Find the todo to edit
    const todoToEdit = todoItems.find((todo) => todo.id === id);
    if (todoToEdit) {
      setTitle(todoToEdit.title || "");
      setDescription(todoToEdit.description || "");
      setPriority(todoToEdit.priority || "medium");
      setDueDate(todoToEdit.dueDate ? new Date(todoToEdit.dueDate) : undefined);
    }
  }

  const handleSaveEdit = () => {
    if (!editingTodo) return;
    
    const updatedTodos = todoItems.map((todo) =>
      todo.id === editingTodo
        ? {
            ...todo,
            title,
            description,
            dueDate: dueDate ? dueDate.toISOString() : "",
            priority,
          }
        : todo
    );
    
    setTodoItems(updatedTodos);
    
    // Reset form and editing state
    setEditingTodo(null);
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setPriority("medium");
    
    toast({
      title: "Todo Updated",
      description: "The todo item has been updated",
    });
  }

  const handleCancelEdit = () => {
    setEditingTodo(null);
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setPriority("medium");
  }

  const getPriorityBadge = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "low":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-400">Low</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-400">Medium</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-400">High</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingTodo ? "Edit Todo" : "Add New Todo"}</CardTitle>
          {editingTodo && <CardDescription>Edit the selected todo item</CardDescription>}
        </CardHeader>
        <form onSubmit={editingTodo ? (e) => { e.preventDefault(); handleSaveEdit(); } : handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dueDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <div className="flex space-x-2">
                  <Button 
                    type="button"
                    variant={priority === "low" ? "default" : "outline"}
                    className={priority === "low" ? "bg-green-500 hover:bg-green-600" : ""}
                    onClick={() => setPriority("low")}
                  >
                    Low
                  </Button>
                  <Button 
                    type="button"
                    variant={priority === "medium" ? "default" : "outline"}
                    className={priority === "medium" ? "bg-blue-500 hover:bg-blue-600" : ""}
                    onClick={() => setPriority("medium")}
                  >
                    Medium
                  </Button>
                  <Button 
                    type="button"
                    variant={priority === "high" ? "default" : "outline"}
                    className={priority === "high" ? "bg-red-500 hover:bg-red-600" : ""}
                    onClick={() => setPriority("high")}
                  >
                    High
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            {editingTodo ? (
              <>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="default"
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button 
                type="submit"
                variant="default"
                className="ml-auto"
              >
                Add Todo
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todo List</CardTitle>
          <CardDescription>Manage your todo items</CardDescription>
        </CardHeader>
        <CardContent>
          {todoItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No todo items added yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todoItems.map((todo) => (
                  <TableRow key={todo.id} className={todo.completed ? "opacity-50" : ""}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleComplete(todo.id)}
                      >
                        {todo.completed ? <Check className="h-5 w-5 text-green-600" /> : <div className="h-5 w-5 rounded-full border-2" />}
                      </Button>
                    </TableCell>
                    <TableCell className={todo.completed ? "line-through" : ""}>
                      <div>
                        <p className="font-medium">{todo.title}</p>
                        {todo.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{todo.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {todo.dueDate ? format(new Date(todo.dueDate), "PP") : "-"}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(todo.priority)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTodo(todo.id)}
                        disabled={todo.completed}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTodo(todo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 