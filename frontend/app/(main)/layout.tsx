import React from "react"
import { cn } from "@/lib/utils"
import { AppSidebar } from "@/components/app-sidebar"

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className={cn("flex min-h-screen")}>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto pl-[var(--sidebar-width)] transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
