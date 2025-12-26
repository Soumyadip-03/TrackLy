"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart3, Calendar, CheckSquare, Home, Info, LogOut, Bell, User, Award, ChevronLeft, ChevronRight, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { useAuth } from '@/lib/auth-context'
import { toast } from "@/components/ui/use-toast"
import { AppSettings } from "@/lib/storage-utils"
import { ClientOnly } from "@/components/client-only"
import { AdminBadge } from "@/components/ui/admin-badge"
import { NetworkPanel } from "@/components/network-panel"
import { useProfilePicture } from "@/hooks/useProfilePicture"

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { signOut, user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const profilePicture = useProfilePicture(user?.profilePicture)

  // Initialize collapsed state from localStorage after component mounts
  useEffect(() => {
    const savedState = AppSettings.getSidebarState()
    setCollapsed(savedState)
  }, [])

  // Handle logout
  const handleLogout = () => {
    toast({
      title: "Logout Successful",
      description: "You have been logged out of your account.",
    })
    signOut()
  }

  // Update body class when sidebar state changes and save to localStorage
  useEffect(() => {
    if (collapsed) {
      document.body.classList.add("sidebar-collapsed")
      document.documentElement.style.setProperty("--sidebar-width", "64px")
    } else {
      document.body.classList.remove("sidebar-collapsed")
      document.documentElement.style.setProperty("--sidebar-width", "250px")
    }
    
    AppSettings.saveSidebarState(collapsed)

    return () => {
      document.body.classList.remove("sidebar-collapsed")
      document.documentElement.style.setProperty("--sidebar-width", "250px")
    }
  }, [collapsed])

  type RouteItem = {
    title: string
    href: string
    icon: typeof Home
    adminBadge?: boolean
  }
  
  const routes: RouteItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Profile & Schedule",
      href: "/profile",
      icon: User,
    },
    {
      title: "Attendance",
      href: "/attendance",
      icon: Calendar,
    },
    {
      title: "History & Reports",
      href: "/history",
      icon: BarChart3,
    },
    {
      title: "Points",
      href: "/points",
      icon: Award,
    },
    {
      title: "Todo",
      href: "/todo",
      icon: CheckSquare, 
    },
    {
      title: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      title: "About",
      href: "/about",
      icon: Info,
    },
  ]
  
  const finalRoutes = isAdmin ? [
    ...routes.slice(0, 4),
    {
      title: "Admin",
      href: "/admin",
      icon: Shield,
      adminBadge: true
    },
    ...routes.slice(4)
  ] : routes

  return (
    <div className="fixed inset-y-0 left-0 z-40 flex">
      <div
        className={`bg-card border-r border-border transition-all duration-300 flex flex-col ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Header */}
        <div className="border-b p-3 flex items-center justify-between gap-4 overflow-hidden">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full animate-pulse-slow"></div>
              <div className="relative">
                <Calendar className="h-6 w-6 text-primary animate-spin-slow" />
              </div>
            </div>
            <ClientOnly>
              {!collapsed && (
                <div className="overflow-hidden">
                  <span className="font-bold text-xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent animate-text-shimmer">
                    TrackLy
                  </span>
                  <div className="logo-underline"></div>
                </div>
              )}
            </ClientOnly>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300 flex-shrink-0"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="space-y-0.5 px-2">
            {finalRoutes.map((route, index) => (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:bg-primary/10 ${
                  pathname === route.href ? "bg-primary/10 text-primary" : "text-foreground"
                } ${collapsed ? "justify-center" : ""} menu-item`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <route.icon
                  className={`h-5 w-5 ${collapsed ? "" : "mr-3"} ${
                    pathname === route.href ? "animate-bounce-subtle" : ""
                  }`}
                />
                {!collapsed && (
                  <div className="flex items-center">
                    <span>{route.title}</span>
                    {route.adminBadge && (
                      <span className="ml-2">
                        <AdminBadge size="sm" withTooltip={false} />
                      </span>
                    )}
                  </div>
                )}
                {pathname === route.href && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full animate-pulse-slow"></div>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t p-3 flex flex-col gap-2">
          {!collapsed && (
            <ClientOnly>
              <div className="flex items-center justify-between">
                <ModeToggle />
                <NetworkPanel />
              </div>
            </ClientOnly>
          )}
          
          {!collapsed && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start hover:text-red-500 transition-all duration-300 hover:bg-red-500/10 group"
                title="Logout"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span>Logout</span>
              </Button>
              
              {user && (
                <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profilePicture} />
                    <AvatarFallback>{user.name?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Collapsed sidebar footer icons and profile */}
      {collapsed && (
        <ClientOnly>
          {user && (
            <div className="fixed left-2 bottom-2 z-40 flex flex-col items-center gap-1">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src={profilePicture} />
                <AvatarFallback>{user.name?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-red-500 transition-all duration-300 hover:bg-red-500/10"
                title="Logout"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
              
              <NetworkPanel />
              
              <ModeToggle />
            </div>
          )}
        </ClientOnly>
      )}
    </div>
  )
}