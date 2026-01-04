"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, ChevronDown } from "lucide-react"

export function VisualAttendanceForm() {
  return (
    <div className="w-full h-[calc(100vh-12rem)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Left Column */}
        <div className="flex flex-col gap-4 h-full">
          {/* Calendar Card */}
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <Button variant="outline" className="mb-3 w-full h-12 rounded-lg border-2 font-semibold">
                Auto-Attendance
              </Button>
              <div className="flex-1 border rounded-md flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Calendar Grid</p>
              </div>
            </CardContent>
          </Card>

          {/* Holiday List Card */}
          <Card className="h-32">
            <CardContent className="p-4 h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-2">Holidays</h3>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Holiday list for that month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <Card className="h-full flex flex-col">
          <CardContent className="p-4 flex flex-col h-full gap-4">
            {/* Classes Heading */}
            <h3 className="text-lg font-semibold">Classes</h3>
            
            {/* Subjects Grid */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {/* Subject Card 1 */}
              <div className="bg-muted/50 border rounded-md p-3 flex items-center justify-between">
                <span className="text-sm font-medium">Subject for that day</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Subject Card 2 */}
              <div className="bg-muted/50 border rounded-md p-3 flex items-center justify-between">
                <span className="text-sm font-medium">Subject for that day</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Subject Card 3 */}
              <div className="bg-muted/50 border rounded-md p-3 flex items-center justify-between">
                <span className="text-sm font-medium">Subject for that day</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Subject Card 4 */}
              <div className="bg-muted/50 border rounded-md p-3 flex items-center justify-between">
                <span className="text-sm font-medium">Subject for that day</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Preparatory Class Card - Fixed above buttons */}
            <div className="border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-md p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-amber-900">Preparatory Class</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <ChevronDown className="h-4 w-4 text-amber-900" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full h-12 rounded-lg border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-semibold">
                Mark all Present
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-lg border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold">
                Mark all Absent
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
