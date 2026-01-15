import { PointsCard } from "@/components/points/points-card"
import { PointsHistory } from "@/components/points/points-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, History } from "lucide-react"

export default function PointsPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="container py-6"></div>
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <div className="container">
            <TabsList className="w-full max-w-3xl mx-auto grid grid-cols-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Points Overview</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Points History</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 overflow-y-auto mt-6">
            <div className="container pb-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <PointsCard />
                  </div>
                  <div className="md:col-span-1 flex flex-col gap-6">
                    <div className="bg-card p-6 rounded-lg border">
                      <h3 className="text-lg font-medium mb-4">How to Earn Points</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Maintain 100% weekly attendance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Achieve attendance streaks</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>No late arrivals for a week</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Complete attendance milestones</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="history" className="space-y-6 mt-0">
                <PointsHistory />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 