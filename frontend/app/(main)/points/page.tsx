import { PageHeader } from "@/components/page-header"
import { PointsCard } from "@/components/points/points-card"
import { PointsHistory } from "@/components/points/points-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, History } from "lucide-react"

export default function PointsPage() {
  return (
    <div className="container py-6 space-y-6">
      <PageHeader 
        title="Reward Points" 
        description="Track and manage your attendance reward points" 
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap justify-start gap-2 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2 min-w-[140px]">
            <Award className="h-4 w-4" />
            <span>Points Overview</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 min-w-[140px]">
            <History className="h-4 w-4" />
            <span>Points History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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

        <TabsContent value="history" className="space-y-6">
          <PointsHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
} 