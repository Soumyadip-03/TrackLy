"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart3, Calendar, CheckSquare, Home, Info, LogOut, Bell, User, Award, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useState, useEffect } from "react"
import { useAuth } from '@/lib/auth-context'
import { toast } from "@/components/ui/use-toast"
import { AppSettings } from "@/lib/storage-utils"
import { ClientOnly } from "@/components/client-only"
import { AdminBadge } from "@/components/ui/admin-badge"
import { ConnectionStatus } from "@/components/connection-status"

export function AppSidebar() {
  const pathname = usePathname()
  // Use false as default state to ensure server/client match; we'll update with localStorage in useEffect
  const [collapsed, setCollapsed] = useState(false)
  const { signOut, user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

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
    
    // Save to localStorage
    AppSettings.saveSidebarState(collapsed)

    // Cleanup function
    return () => {
      document.body.classList.remove("sidebar-collapsed")
      document.documentElement.style.setProperty("--sidebar-width", "250px")
    }
  }, [collapsed])

  // Define route type with optional adminBadge property
  type RouteItem = {
    title: string;
    href: string;
    icon: typeof Home;
    adminBadge?: boolean;
  };
  
  const routes: RouteItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
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
      title: "Profile & Schedule",
      href: "/profile",
      icon: User,
    },
    {
      title: "About",
      href: "/about",
      icon: Info,
    },
  ]
  
  // Create the final routes array with admin route if user is admin
  const finalRoutes = isAdmin ? [
    ...routes.slice(0, 4), // Insert after Points
    {
      title: "Admin",
      href: "/admin",
      icon: Shield,
      adminBadge: true // Flag to show the admin badge
    },
    ...routes.slice(4)
  ] : routes;

  return (
    <div className="fixed inset-y-0 left-0 z-40 flex">
      {/* Always visible sidebar */}
      <div
        className={`bg-card border-r border-border transition-all duration-300 flex flex-col ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Header */}
        <div className="border-b p-3 flex items-center justify-center gap-2 overflow-hidden">
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

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="space-y-1 px-2">
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
          <ClientOnly>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 ${collapsed ? "flex-col" : ""}`}>
                <ModeToggle />
                {collapsed ? null : (
                  <ConnectionStatus />
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
            </div>
            {collapsed && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <ConnectionStatus />
              </div>
            )}
          </ClientOnly>
          
          <Button
            variant="ghost"
            className={`w-full ${
              collapsed ? "justify-center" : "justify-start"
            } hover:text-red-500 transition-all duration-300 hover:bg-red-500/10 group`}
            title="Logout"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            {!collapsed && <span>Logout</span>}
          </Button>
          
          <ClientOnly>
            {!collapsed && user && (
              <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                  {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}
          </ClientOnly>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-3 -right-3 z-50 bg-card shadow-md border border-border rounded-full p-1 hover:bg-accent transition-all duration-300 hover:scale-110 hover:shadow-lg"
      >
        {collapsed ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-bounce-x"
          >
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-bounce-x"
          >
            <polyline points="11 17 6 12 11 7"></polyline>
            <polyline points="18 17 13 12 18 7"></polyline>
          </svg>
        )}
      </button>
    </div>
  )
}
