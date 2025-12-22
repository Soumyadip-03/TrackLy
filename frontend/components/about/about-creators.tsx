import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Linkedin, Mail, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"

// Updated creator data with real creators
const creators = [
  {
    name: "Sulagna Bhattacharya",
    role: "Founder and CEO, Frontend Developer, UI DEVELOPER",
    bio: "Passionate about creating intuitive user interfaces and optimizing application performance. Founded TrackLy to help students manage their attendance more effectively.",
    avatar: "/placeholder.svg?height=100&width=100",
    initials: "SB",
    github: "https://github.com/Sulagna-Bhattacharya",
    twitter: "#",
    linkedin: "https://www.linkedin.com/in/sulagna-bhattacharya-719",
    email: "sulagnabhattacharya719@gmail.com",
  },
  {
    name: "Soumyadip Khan Sarkar",
    role: "CTO and Lead Developer, UX & UI Designer",
    bio: "Experienced in building scalable applications with a focus on user experience. Leads the technical development of TrackLy and designs intuitive interfaces that enhance user engagement.",
    avatar: "/placeholder.svg?height=100&width=100",
    initials: "SKS",
    github: "https://github.com/Soumyadip-03",
    twitter: "#",
    linkedin: "https://www.linkedin.com/in/soumyadip-khan-sarkar",
    email: "soumyadipkhansarkar@gmail.com",
  },
]

export function AboutCreators() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Meet the Team</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          TrackLy was created by a dedicated team of developers and designers passionate about helping students manage
          their academic attendance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {creators.map((creator) => (
          <Card key={creator.name} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-background">
                  <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                  <AvatarFallback>{creator.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{creator.name}</CardTitle>
                  <CardDescription>{creator.role}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">{creator.bio}</p>
              <div className="flex space-x-2">
                {creator.github !== "#" && (
                  <a 
                    href={creator.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-8 w-8 rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200"
                  >
                    <Github className="h-4 w-4" />
                    <span className="sr-only">GitHub</span>
                  </a>
                )}
                
                {creator.twitter !== "#" && (
                  <a 
                    href={creator.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-8 w-8 rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200"
                  >
                    <Twitter className="h-4 w-4" />
                    <span className="sr-only">Twitter</span>
                  </a>
                )}
                
                {creator.linkedin !== "#" && (
                  <a 
                    href={creator.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-8 w-8 rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span className="sr-only">LinkedIn</span>
                  </a>
                )}
                
                <a 
                  href={`mailto:${creator.email}`}
                  className="flex items-center justify-center h-8 w-8 rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200"
                >
                  <Mail className="h-4 w-4" />
                  <span className="sr-only">Email</span>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border p-4">
        <h4 className="font-medium mb-2">Project Information</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium">Version:</span> 1.0.0
          </p>
          <p>
            <span className="font-medium">Released:</span> May 2025
          </p>
          <p>
            <span className="font-medium">License:</span> MIT
          </p>
          <p>
            <span className="font-medium">Repository:</span>{" "}
            <a 
              href="https://github.com/Soumyadip-03/TrackLy" 
              className="text-primary hover:underline cursor-pointer font-medium"
              target="_blank" 
              rel="noopener noreferrer"
            >
              github.com/Soumyadip-03/TrackLy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
