"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { SaveButton } from "@/components/ui/save-button"
import { todoService, CreateTodoDto } from "@/lib/services/todo-service"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"

// Todo item type
export interface TodoItem {
  _id: string
  title: string
  description: string
  dueDate: string | null
  completed: boolean
  priority: "low" | "medium" | "high"
  createdAt: string
  updatedAt: string
}

export function TodoForm() {
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")

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
    
    setIsSaving(true)
    
    try {
      const todoData: CreateTodoDto = {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate ? dueDate.toISOString() : null,
        priority
      }
      
      await todoService.create(todoData)
      
      // Notify UI components of the update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('todosUpdated'))
      }
      
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
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="shadow-lg border-2 h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-b pb-4 flex-shrink-0">
        <CardTitle className="text-2xl font-bold">Add New Todo</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <CardContent className="space-y-4 pt-4 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="h-10"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="resize-none"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="dueDate" className="text-sm font-medium">Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dueDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
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
          
          <div className="space-y-1.5">
            <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
            <div className="flex gap-2">
              <Button 
                type="button"
                variant={priority === "low" ? "default" : "outline"}
                className={`flex-1 h-10 ${priority === "low" ? "bg-green-500 hover:bg-green-600" : ""}`}
                onClick={() => setPriority("low")}
              >
                Low
              </Button>
              <Button 
                type="button"
                variant={priority === "medium" ? "default" : "outline"}
                className={`flex-1 h-10 ${priority === "medium" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                onClick={() => setPriority("medium")}
              >
                Medium
              </Button>
              <Button 
                type="button"
                variant={priority === "high" ? "default" : "outline"}
                className={`flex-1 h-10 ${priority === "high" ? "bg-red-500 hover:bg-red-600" : ""}`}
                onClick={() => setPriority("high")}
              >
                High
              </Button>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t bg-muted/20 py-3 flex-shrink-0">
          <SaveButton 
            isSaving={isSaving} 
            variant="primary"
            text="Add Todo"
            loadingText="Adding..."
            className="h-10"
          />
        </CardFooter>
      </form>
    </Card>
  )
} 