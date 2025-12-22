"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Mail } from 'lucide-react'

export default function DirectEmailPage() {
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('Welcome to TrackLy')
  const [message, setMessage] = useState(`Thank you for joining TrackLy, your student attendance tracking companion!

We're excited to help you stay on top of your attendance and academic goals. Start by setting up your subjects and schedule to get the most out of TrackLy.

Best regards,
The TrackLy Team`)
  
  const handleSendEmail = () => {
    // Create a mailto link with the email, subject, and body
    const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    
    // Open the default email client
    window.location.href = mailtoLink
  }
  
  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Send Welcome Email Directly</CardTitle>
          <CardDescription>
            This will open your default email client to send a welcome email directly from your email address
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="recipient@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input 
              id="subject" 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea 
              id="message" 
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
            <p className="font-semibold">How this works:</p>
            <p>This will open your default email client with the message pre-filled. You can review and send it directly.</p>
            <p className="mt-2">If you encounter issues with server-side email sending, this is a reliable alternative.</p>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="button" 
            onClick={handleSendEmail}
            disabled={!email}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            Open in Email Client
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 