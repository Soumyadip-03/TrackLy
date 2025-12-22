import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, MessageSquare, Sparkles } from "lucide-react"

export function AboutAI() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">About the AI Assistant</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The Attendance Tracker includes an AI-powered assistant to help you manage your attendance and answer your
          questions. The assistant uses advanced natural language processing to understand your queries and provide
          helpful responses.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <MessageSquare className="mr-2 h-4 w-4" />
              How to Use the AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>You can interact with the AI assistant in several ways:</p>
            <ul className="mt-2 space-y-2">
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Click the chat button in the bottom right corner</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Ask questions about your attendance</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Request help with using the system features</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Get advice on improving your attendance</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>The AI assistant can help you with:</p>
            <ul className="mt-2 space-y-2">
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Calculating attendance percentages</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Providing attendance improvement suggestions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Explaining system features and how to use them</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Answering questions about your schedule</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-medium">Example Questions</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-start rounded-lg border p-3">
            <Bot className="mr-3 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">"What's my current attendance in Database Systems?"</p>
              <p className="text-sm text-muted-foreground">
                The assistant will check your attendance records and provide the current percentage.
              </p>
            </div>
          </div>
          <div className="flex items-start rounded-lg border p-3">
            <Bot className="mr-3 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">"How many classes can I miss and still maintain 75% attendance?"</p>
              <p className="text-sm text-muted-foreground">
                The assistant will calculate and tell you how many more absences you can afford.
              </p>
            </div>
          </div>
          <div className="flex items-start rounded-lg border p-3">
            <Bot className="mr-3 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">"How do I use the Per Subject Calculator?"</p>
              <p className="text-sm text-muted-foreground">
                The assistant will explain how to use specific features of the system.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">Privacy Information</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The AI assistant only has access to your attendance data and system information. Your conversations are
          processed securely and are not stored long-term. The assistant is designed to help you with attendance-related
          queries and system usage only.
        </p>
      </div>
    </div>
  )
}
