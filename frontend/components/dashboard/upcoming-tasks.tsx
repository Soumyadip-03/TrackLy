"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { format, differenceInDays, parseISO } from "date-fns"
import { CalendarDays } from "lucide-react"

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

interface UpcomingTasksProps {
  todos?: TodoItem[];
}

export function UpcomingTasks({ todos: propTodos }: UpcomingTasksProps) {
  const [upcomingTasks, setUpcomingTasks] = useState<{
    count: number;
    nextTask: string;
    daysRemaining: string;
    priority: "low" | "medium" | "high" | null;
  }>({
    count: 0,
    nextTask: "None scheduled",
    daysRemaining: "",
    priority: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTodos = async () => {
      try {
        let todos: TodoItem[] = [];
        
        // Use prop todos if provided, otherwise fetch from database
        if (propTodos && propTodos.length > 0) {
          todos = propTodos;
        } else {
          const { fetchWithAuth } = await import('@/lib/api');
          const todosRes = await fetchWithAuth('/todo');
          if (todosRes.ok) {
            const todosData = await todosRes.json();
            todos = todosData.data || [];
          }
        }
        
        // Filter for incomplete todos with due dates
        const incompleteTodos = todos.filter(todo => 
          !todo.completed && todo.dueDate
        );
        
        // Sort by due date (closest first)
        const sortedTodos = incompleteTodos.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        // Format upcoming task info
        let nextTask = "None scheduled";
        let daysRemaining = "";
        let priority = null;
        
        if (sortedTodos.length > 0 && sortedTodos[0].dueDate) {
          const taskDate = new Date(sortedTodos[0].dueDate);
          taskDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const days = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          nextTask = sortedTodos[0].title;
          priority = sortedTodos[0].priority;
          if (days === 0) {
            daysRemaining = "Due today";
          } else if (days === 1) {
            daysRemaining = "Due tomorrow";
          } else if (days > 0) {
            daysRemaining = `Due in ${days} days`;
          } else {
            daysRemaining = `${Math.abs(days)} days overdue`;
          }
        }
        
        setUpcomingTasks({
          count: sortedTodos.length,
          nextTask,
          daysRemaining,
          priority
        });
      } catch (error) {
        console.error('Error loading todos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTodos();
  }, [propTodos]);

  // Get priority color and label
  const getPriorityInfo = (priority: string | null) => {
    if (!priority) return { color: "bg-gray-300", textColor: "text-gray-500", label: "" };
    
    switch (priority) {
      case "high":
        return { color: "bg-red-500", textColor: "text-red-500", label: "High" };
      case "medium":
        return { color: "bg-amber-500", textColor: "text-amber-500", label: "Medium" };
      case "low":
        return { color: "bg-green-500", textColor: "text-green-500", label: "Low" };
      default:
        return { color: "bg-gray-300", textColor: "text-gray-500", label: "" };
    }
  };
  
  const priorityInfo = getPriorityInfo(upcomingTasks.priority);

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 transition-all duration-300 hover:shadow-md hover:border-purple-500/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Upcoming Tasks</p>
            <h3 className="text-3xl font-bold mt-0.5 text-purple-500">
              {isLoading ? "-" : upcomingTasks.count}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {isLoading ? "Loading..." : upcomingTasks.nextTask}
            </p>
            {!isLoading && upcomingTasks.daysRemaining && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-purple-500">{upcomingTasks.daysRemaining}</span>
                {upcomingTasks.priority && (
                  <span className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${priorityInfo.color}`}></span>
                    <span className={`text-xs font-medium ${priorityInfo.textColor}`}>{priorityInfo.label}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="h-10 w-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <CalendarDays className="h-5 w-5 text-purple-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 