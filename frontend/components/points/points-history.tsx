"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, AlertCircle, Award } from "lucide-react"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"
import { format } from "date-fns"

interface PointsHistoryItem {
  date: string;
  points: number;
  type: "earned" | "spent";
  reason: string;
}

export function PointsHistory() {
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load points history from localStorage
  useEffect(() => {
    const loadPointsHistory = () => {
      let savedHistory = getFromLocalStorage<PointsHistoryItem[]>('points_history', []);
      
      // If there's no history yet, add the initial 100 points entry
      if (savedHistory.length === 0) {
        const initialPoints: PointsHistoryItem = {
          date: format(new Date(), "MMM d, yyyy"),
          points: 100,
          type: "earned",
          reason: "Initial welcome bonus"
        };
        
        savedHistory = [initialPoints];
        saveToLocalStorage('points_history', savedHistory);
      }
      
      setPointsHistory(savedHistory);
      setIsLoading(false);
    };
    
    loadPointsHistory();
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
          <CardDescription>Loading your points history...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (pointsHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
          <CardDescription>Track your points earned and spent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No points history yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Points are earned by maintaining good attendance
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Points History</CardTitle>
        <CardDescription>Track your points earned and spent</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pointsHistory.map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              {item.type === "earned" ? (
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.date}</span>
                  <span className={`font-medium ${item.type === "earned" ? "text-green-500" : "text-red-500"}`}>
                    {item.type === "earned" ? "+" : ""}
                    {item.points} points
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 