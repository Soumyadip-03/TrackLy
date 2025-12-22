"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AdminBadge } from '@/components/ui/admin-badge'
import { SyncIndicator } from '@/components/sync-indicator'
// Import individual icons from lucide-react instead of heroicons
import { 
  Users as UserGroupIcon, 
  Settings as CogIcon, 
  BarChart as ChartBarIcon, 
  Clock as ClockIcon,
  FileText as DocumentTextIcon,
  Home as HomeIcon,
  ArrowLeft as ArrowLeftIcon
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  
  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <HomeIcon className="h-5 w-5" />,
    },
    {
      name: 'User Management',
      href: '/admin/user-management',
      icon: <UserGroupIcon className="h-5 w-5" />,
    },
    {
      name: 'System Settings',
      href: '/admin/settings',
      icon: <CogIcon className="h-5 w-5" />,
      disabled: true,
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: <ChartBarIcon className="h-5 w-5" />,
      disabled: true,
    },
    {
      name: 'Semesters',
      href: '/admin/semesters',
      icon: <ClockIcon className="h-5 w-5" />,
      disabled: true,
    },
    {
      name: 'Data Sync',
      href: '/admin/data-sync',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      disabled: true,
    },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-10 border-r bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-xl">
            TrackLy <AdminBadge />
          </Link>
        </div>
        <div className="flex flex-col justify-between flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.disabled ? '#' : item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm
                    ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50'}
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={(e) => {
                    if (item.disabled) e.preventDefault()
                  }}
                >
                  {item.icon}
                  {item.name}
                  {item.disabled && (
                    <span className="ml-auto text-xs bg-secondary px-1 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          
          <div className="px-3 py-4 border-t">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Admin Account</p>
              </div>
              <SyncIndicator compact={true} />
            </div>
            <Link 
              href="/"
              className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to App
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
            TrackLy <AdminBadge />
          </Link>
          <SyncIndicator compact={true} />
        </div>
        <div className="overflow-x-auto flex border-t">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.disabled ? '#' : item.href}
                className={`
                  flex flex-col items-center gap-1 px-4 py-2 whitespace-nowrap text-xs
                  ${isActive ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={(e) => {
                  if (item.disabled) e.preventDefault()
                }}
              >
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 md:pl-64 pt-16 md:pt-0">
        <main className="py-4">
          {children}
        </main>
      </div>
    </div>
  )
}
