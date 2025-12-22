"use client"

import { useState, useEffect } from "react"
import { Award, Gift, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"

interface Achievement {
  name: string;
  points: number;
  date: string;
}

interface PointsData {
  total: number;
  streak: number;
  achievements: Achievement[];
}

export function PointsCard() {
  const [isLoading, setIsLoading] = useState(true)
  const [pointsData, setPointsData] = useState<PointsData | null>(null)

  useEffect(() => {
    const loadPointsData = () => {
      // Get points data from localStorage with default of 100 points
      const savedPointsData = getFromLocalStorage<PointsData>('points', {
        total: 100,
        streak: 0,
        achievements: []
      });
      
      // If this is the first time (no data was previously saved), save the default
      if (!localStorage.getItem('trackly_points')) {
        saveToLocalStorage('points', savedPointsData);
      }
      
      setPointsData(savedPointsData);
      setIsLoading(false);
    };
    
    loadPointsData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <span>Reward Points</span>
          </CardTitle>
          <CardDescription>Loading your rewards...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // No achievements yet (but still show the 100 points)
  if (!pointsData || pointsData.achievements.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <span>Reward Points</span>
          </CardTitle>
          <CardDescription>Your attendance rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <div className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent animate-pulse">
                {pointsData?.total || 100}
              </div>
            </div>

            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000 ease-out"
                style={{ width: `${((pointsData?.total || 100) / 100) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>{pointsData?.streak || 0} week streak</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary">
                <Gift className="h-3 w-3" />
                <span>Redeem Rewards</span>
              </div>
            </div>

            <div className="w-full mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-2">Recent Achievements</div>
              <div className="text-xs text-muted-foreground text-center py-2">
                No achievements yet. Keep going!
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <span>Reward Points</span>
        </CardTitle>
        <CardDescription>Your attendance rewards</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-3 py-4">
          <div className="relative">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent animate-pulse">
              {pointsData.total}
            </div>
          </div>

          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000 ease-out"
              style={{ width: `${(pointsData.total / 100) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between w-full mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>{pointsData.streak} week streak</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary">
              <Gift className="h-3 w-3" />
              <span>Redeem Rewards</span>
            </div>
          </div>

          <div className="w-full mt-4 pt-4 border-t">
            <div className="text-sm font-medium mb-2">Recent Achievements</div>
            {pointsData.achievements.length > 0 ? (
              <div className="space-y-2">
                {pointsData.achievements.slice(0, 3).map((achievement, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span>{achievement.name}</span>
                    <span className="text-green-500">+{achievement.points} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-2">
                No achievements yet. Keep going!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 