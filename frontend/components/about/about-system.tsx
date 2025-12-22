import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export function AboutSystem() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">What is TrackLy?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          TrackLy is a comprehensive system designed to help students track, manage, and optimize their class
          attendance. It provides tools to monitor attendance percentages, plan absences, and maintain good academic
          standing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Key Features</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Real-time attendance tracking and calculation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Subject-wise attendance monitoring</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Absence planning with impact calculation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Schedule integration with PDF upload</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>To-do list management for classes</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Points System</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-2">The system includes a points-based reward mechanism:</p>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Start with 100 points</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Earn 10 points per week of maintained attendance</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Spend 2 points to use the Per Subject Calculator</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Track points history and rewards</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-medium">How It Works</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The system starts with 100% attendance for all subjects. As you mark absences or attend classes according to
          your schedule, the system automatically calculates and updates your attendance percentages. You can use the
          calculators to plan future absences and see their impact on your attendance.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium">Technical Details</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          TrackLy is built using modern web technologies including React, Next.js, and Tailwind CSS for the frontend. It
          uses MongoDB for data storage and includes integration with calendar APIs and OpenAI for the AI assistant.
        </p>
      </div>
    </div>
  )
}
