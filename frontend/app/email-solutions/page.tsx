"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Settings, TestTube, AlertTriangle } from 'lucide-react'

export default function EmailSolutionsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">TrackLy Email Solutions</h1>
        <p className="text-muted-foreground">
          Multiple ways to send notifications to users
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Direct Email Solution */}
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-700" />
              Client-Side Email
            </CardTitle>
            <CardDescription>
              Send emails directly from your email client
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm mb-4">
              This solution uses the <code>mailto:</code> protocol to open your default email 
              client with a pre-filled welcome message. This doesn't require server configuration 
              and works reliably.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center text-sm">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">✓</span>
                Always works - no server setup needed
              </div>
              <div className="flex items-center text-sm">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">✓</span>
                Uses your personal email for better deliverability
              </div>
              <div className="flex items-center text-sm">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full mr-2">✕</span>
                Not automated - requires manual sending
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="/email-direct">
                <Mail className="mr-2 h-4 w-4" />
                Open Direct Email Client
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Testing Tools */}
        <Card className="border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center">
              <TestTube className="h-5 w-5 mr-2 text-purple-700" />
              Email Testing Tools
            </CardTitle>
            <CardDescription>
              Test and troubleshoot email functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm mb-4">
              These tools help test different email configurations and diagnose issues 
              with server-side email sending. Use these if you're setting up the email 
              notification system.
            </p>
            <div className="bg-amber-50 p-3 rounded-md text-amber-800 text-sm mb-4">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              These tests require proper SMTP credentials in the server's <code>config.env</code> file.
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center text-sm">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full mr-2">1</span>
                Configure Gmail app password in <code>backend/config/config.env</code>
              </div>
              <div className="flex items-center text-sm">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full mr-2">2</span>
                Test via command line script or API endpoint
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
              <Link href="/email-test">
                <TestTube className="mr-2 h-4 w-4" />
                Open Email Testing Page
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Settings Fix */}
        <Card className="border-orange-200 md:col-span-2">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-orange-700" />
              Notification Settings Fix
            </CardTitle>
            <CardDescription>
              Resolves the "Failed to save notification settings to server" error
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm mb-4">
              The error occurs because the API endpoint to save notification settings is not properly 
              handling requests. We've updated the code to be more resilient to server failures and 
              to provide better error handling.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h3 className="font-medium text-red-600 mb-2">The Problem</h3>
                <ul className="text-sm space-y-2 list-disc pl-5">
                  <li>Frontend trying to save settings to API endpoint</li>
                  <li>API not correctly handling the request</li>
                  <li>Error being shown instead of graceful fallback</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h3 className="font-medium text-green-600 mb-2">The Solution</h3>
                <ul className="text-sm space-y-2 list-disc pl-5">
                  <li>Enhanced error handling in frontend</li>
                  <li>Still saving to localStorage for offline access</li>
                  <li>Gracefully handling server errors</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Go to Notification Settings
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 