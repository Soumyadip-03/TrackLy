"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function WelcomeEmailForm() {
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)

  const validateEmail = (email: string): boolean => {
    if (!email) return false
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }
    
    setIsSending(true)
    
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to send welcome emails.",
          variant: "destructive",
        })
        setIsSending(false)
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notification/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send welcome email')
      }
      
      toast({
        title: "Email Sent",
        description: `Welcome email sent to ${email} successfully.`,
      })
      
      setEmail("")
    } catch (error: any) {
      console.error('Error sending welcome email:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send welcome email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Send Welcome Email</CardTitle>
        <CardDescription>Send a welcome email to a new or existing user</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => setEmail("")}>Clear</Button>
          <Button type="submit" disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              "Send Welcome Email"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 