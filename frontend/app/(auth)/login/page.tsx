"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)
  
  useEffect(() => {
    if (!searchParams) return
    
    const status = searchParams.get('status')
    const error = searchParams.get('error')
    const emailParam = searchParams.get('email')
    
    if (emailParam) {
      setEmail(emailParam)
    }
    
    if (status === 'account_created') {
      setStatusMessage({
        type: 'success',
        message: 'Account created successfully! Please sign in.'
      })
      toast.success('Account created successfully! Please sign in.')
    } else if (error) {
      let errorMessage = 'An error occurred. Please try again.'
      
      if (error === 'unauthorized') {
        errorMessage = 'You need to sign in to access that page.'
      }
      
      setStatusMessage({
        type: 'error',
        message: errorMessage
      })
      toast.error(errorMessage)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatusMessage(null)
    
    try {
      const result = await signIn(email, password)
      
      if (!result.success) {
        setStatusMessage({
          type: 'error',
          message: result.error || "Failed to log in"
        })
        toast.error(result.error || "Failed to log in")
        return
      }
      
      setStatusMessage({
        type: 'success',
        message: 'Logged in successfully! Redirecting to dashboard...'
      })
      
      toast.success("Logged in successfully!", {
        duration: 2000
      })
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error: any) {
      console.error('Login error:', error)
      setStatusMessage({
        type: 'error',
        message: error.message || "An unexpected error occurred"
      })
      toast.error(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center h-screen py-0">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Welcome Back</CardTitle>
          <CardDescription className="text-sm">Sign in to your TrackLy account</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
            {statusMessage && (
              <Alert variant={statusMessage.type === "error" ? "destructive" : "default"} className={statusMessage.type === "success" ? "bg-green-50 text-green-800 border-green-500" : ""} >
                {statusMessage.type === "error" && (
                  <AlertCircle className="h-4 w-4" />
                )}
                {statusMessage.type === "success" && (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle className="text-xs">
                  {statusMessage.type === "error" ? "Error" : statusMessage.type === "success" ? "Success" : "Info"}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {statusMessage.message}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium">
                  Password
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-primary hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                  required
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pt-2 pb-3">
            <Button 
              type="submit" 
              className="w-full h-8 text-sm"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
