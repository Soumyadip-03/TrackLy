"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
  const [courseDuration, setCourseDuration] = useState<number>(3)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!name || !email || !studentId || !password || !confirmPassword) {
        toast.error("Please fill in all required fields")
        return
      }

      if (password !== confirmPassword) {
        toast.error("Passwords don't match")
        return
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters long")
        return
      }

      await signUp(email, password, name, studentId, courseDuration)
      
      toast.success("Account created successfully!", { duration: 5000 })

      setTimeout(() => {
        router.push(`/login?status=account_created&email=${encodeURIComponent(email)}`)
      }, 2500)
    } catch (error: any) {
      console.error('Registration Error:', error)
      const errorMessage = error?.message || 'Failed to register. Please try again.'
      toast.error(errorMessage, { duration: 5000 })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-6">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-purple-500/5 border-b">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Create an Account</CardTitle>
          <CardDescription className="text-xs">Sign up for TrackLy to start tracking your attendance</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-1.5 max-h-[55vh] overflow-y-auto py-3">
            <div className="space-y-0.5">
              <Label htmlFor="name" className="text-xs">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="studentId" className="text-xs">Student ID</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="STU123456"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="courseDuration" className="text-xs">Course Duration</Label>
              <Select 
                value={courseDuration.toString()} 
                onValueChange={(value: string) => setCourseDuration(parseInt(value))}
              >
                <SelectTrigger className="w-full h-8 text-xs" id="courseDuration">
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year} Year{year > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="password123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-8 text-xs"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="password123"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-8 text-xs"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-1.5 pt-2 pb-3 border-t bg-muted/20">
            <Button 
              type="submit" 
              className="w-full h-9 text-sm bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all duration-300"
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
