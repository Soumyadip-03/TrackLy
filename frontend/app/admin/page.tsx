"use client"

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { AdminBadge } from '@/components/ui/admin-badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  UserGroupIcon, 
  CogIcon, 
  ChartBarIcon, 
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const { user } = useAuth()

  const adminFeatures = [
    {
      title: 'User Management',
      description: 'Create, update, and manage user accounts and permissions.',
      icon: <UserGroupIcon className="h-8 w-8" />,
      href: '/admin/user-management',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'System Settings',
      description: 'Configure application-wide settings and preferences.',
      icon: <CogIcon className="h-8 w-8" />,
      href: '/admin/settings',
      color: 'bg-purple-100 text-purple-700',
      comingSoon: true
    },
    {
      title: 'Analytics Dashboard',
      description: 'View attendance and performance analytics across all users.',
      icon: <ChartBarIcon className="h-8 w-8" />,
      href: '/admin/analytics',
      color: 'bg-green-100 text-green-700',
      comingSoon: true
    },
    {
      title: 'Semester Management',
      description: 'Define and manage semester periods and schedules.',
      icon: <ClockIcon className="h-8 w-8" />,
      href: '/admin/semesters',
      color: 'bg-orange-100 text-orange-700',
      comingSoon: true
    },
    {
      title: 'Data Synchronization',
      description: 'Monitor and manage data synchronization between devices and cloud.',
      icon: <DocumentTextIcon className="h-8 w-8" />,
      href: '/admin/data-sync',
      color: 'bg-pink-100 text-pink-700',
      comingSoon: true
    }
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          Admin Dashboard <AdminBadge className="ml-2" />
        </h1>
        <p className="text-muted-foreground">
          Welcome, admin. Manage TrackLy system settings and users from this central dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
          <CardDescription>
            Your admin account information and quick actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="bg-primary/10 p-6 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user?.email}</h3>
              <p className="text-muted-foreground">Admin Account</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin-login">Switch Account</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">Return to App</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mt-8">Admin Features</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminFeatures.map((feature, index) => (
          <Card key={index} className={feature.comingSoon ? 'opacity-70' : ''}>
            <CardHeader>
              <div className={`${feature.color} p-3 rounded-full w-fit`}>
                {feature.icon}
              </div>
              <CardTitle className="flex items-center gap-2 mt-2">
                {feature.title}
                {feature.comingSoon && (
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-normal">
                    Coming Soon
                  </span>
                )}
              </CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                variant={feature.comingSoon ? "outline" : "default"} 
                className="w-full"
                disabled={feature.comingSoon}
                asChild={!feature.comingSoon}
              >
                {!feature.comingSoon ? (
                  <Link href={feature.href}>Access</Link>
                ) : (
                  <span>Coming Soon</span>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>TrackLy Admin Portal v1.0</p>
        <p>Only authorized personnel have access to this dashboard.</p>
      </div>
    </div>
  )
}
