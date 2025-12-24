"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AuthMessage } from "@/components/auth/auth-message"
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [studentId, setStudentId] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentSemester, setCurrentSemester] = useState<number>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      if (!name || !email || !studentId || !password || !confirmPassword) {
        setMessage({
          text: "Please fill in all required fields",
          type: "error",
        })
        return
      }

      if (password !== confirmPassword) {
        setMessage({
          text: "Passwords don't match",
          type: "error",
        })
        return
      }

      if (password.length < 6) {
        setMessage({
          text: "Password must be at least 6 characters long",
          type: "error",
        })
        return
      }

      await signUp(email, password, name, studentId, currentSemester)
      
      setMessage({
        text: "Account created successfully! Redirecting to login...",
        type: "success",
      })

      toast.success("Account created successfully!", {
        duration: 5000
      })

      setTimeout(() => {
        router.push(`/login?status=account_created&email=${encodeURIComponent(email)}`)
      }, 2500)
    } catch (error: any) {
      console.error('Registration Error:', error)
      const errorMessage = error?.message || 'Failed to register. Please try again.'
      
      toast.error(errorMessage, {
        duration: 5000
      })
      
      setMessage({
        text: errorMessage,
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center h-screen py-0">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Create an Account</CardTitle>
          <CardDescription className="text-sm">Sign up for TrackLy to start tracking your attendance</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
            {message && (
              <AuthMessage
                message={message.text}
                type={message.type}
                visible={true}
                autoHideDuration={5000}
                onDismiss={() => setMessage(null)}
              />
            )}
            
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="studentId" className="text-xs">Student ID</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="STU123456"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="currentSemester" className="text-xs">Current Semester</Label>
              <Select 
                value={currentSemester.toString()} 
                onValueChange={(value: string) => setCurrentSemester(parseInt(value))}
              >
                <SelectTrigger className="w-full h-8 text-sm" id="currentSemester">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                    <SelectItem key={semester} value={semester.toString()}>
                      Semester {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-8 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-8 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pt-2 pb-3">
            <Button 
              type="submit" 
              className="w-full h-8 text-sm bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
