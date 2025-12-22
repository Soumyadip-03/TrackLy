import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { Bot, CheckCircle, Github, Linkedin, Mail, MessageSquare, Sparkles, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  const creators = [
  {
    name: "Sulagna Bhattacharya",
    role: "Founder and CEO, Frontend Developer",
    bio: "Passionate about creating intuitive user interfaces and optimizing application performance. Founded TrackLy to help students manage their attendance more effectively.",
    avatar: "/placeholder.svg?height=100&width=100",
    initials: "SB",
    github: "https://github.com/sulagna",
    twitter: "https://twitter.com/sulagna",
    linkedin: "https://linkedin.com/in/sulagna",
    email: "sulagna@trackly.com",
  },
  {
    name: "Soumyadip Khan Sarkar",
    role: "CTO and Lead Developer, UX & UI Designer",
    bio: "Experienced in building scalable applications with a focus on user experience. Leads the technical development of TrackLy and designs intuitive interfaces that enhance user engagement.",
    avatar: "/placeholder.svg?height=100&width=100",
    initials: "SKS",
    github: "https://github.com/soumyadip",
    twitter: "https://twitter.com/soumyadip",
    linkedin: "https://linkedin.com/in/soumyadip",
    email: "soumyadip@trackly.com",
  },
]

  return (
    <div className="container py-6 space-y-6">
      <PageHeader title="About" description="Learn about the attendance tracking system" />

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system">About System</TabsTrigger>
          <TabsTrigger value="features">Usage guide</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">What is TrackLy?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                TrackLy is a comprehensive system designed to help students track, manage, and optimize their class
                attendance. It provides tools to monitor attendance percentages, plan absences, and maintain good
                academic standing.
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
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Getting Started</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Follow these steps to get started with the Attendance Tracker:
              </p>
              <ol className="mt-4 space-y-4 text-sm">
                <li className="flex items-start">
                  <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Set up your profile</p>
                    <p className="text-muted-foreground">
                      Go to the Profile page and enter your name, student ID, and current semester.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Add your subjects</p>
                    <p className="text-muted-foreground">
                      In the Profile page, go to the Subjects tab and add all the subjects for your current semester.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Upload your schedule</p>
                    <p className="text-muted-foreground">
                      Upload your weekly class schedule PDF in the Schedule Upload tab of the Profile page.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    4
                  </span>
                  <div>
                    <p className="font-medium">Start tracking attendance</p>
                    <p className="text-muted-foreground">
                      Use the Attendance page to mark absences and track your attendance.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">AI Assistant</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                TrackLy includes a powerful AI assistant that can help you with various tasks and provide information
                about your attendance.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" /> Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span>Ask questions about your attendance</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span>Get tips on maintaining good attendance</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span>Help with using the application features</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span>Guidance on attendance requirement regulations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span>Always accessible from the chat bubble in the corner</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" /> Example Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                      <span>"What's my attendance percentage in Mathematics?"</span>
                    </li>
                    <li className="flex items-start">
                      <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                      <span>"How many more classes can I miss in Physics and still maintain 75%?"</span>
                    </li>
                    <li className="flex items-start">
                      <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                      <span>"How do I upload my class schedule?"</span>
                    </li>
                    <li className="flex items-start">
                      <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                      <span>"What are the minimum attendance requirements for my college?"</span>
                    </li>
                    <li className="flex items-start">
                      <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                      <span>"How many attendance points do I have left?"</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {creators.map((creator) => (
              <Card key={creator.name} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/50 p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-4 border-background">
                      <AvatarImage src={creator.avatar} alt={creator.name} />
                      <AvatarFallback className="text-lg">{creator.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{creator.name}</CardTitle>
                      <CardDescription>{creator.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{creator.bio}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 w-8 rounded-full p-0">
                      <Github className="h-4 w-4" />
                      <span className="sr-only">GitHub</span>
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 rounded-full p-0">
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 rounded-full p-0">
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 rounded-full p-0">
                      <Mail className="h-4 w-4" />
                      <span className="sr-only">Email</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 