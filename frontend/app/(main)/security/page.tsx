"use client"

import { PageHeader } from "@/components/page-header"
import { LoginHistory } from "@/components/notifications/login-history"
import { SecuritySettings } from "@/components/profile/security-settings"
import { ClientOnly } from "@/components/client-only"

export default function SecurityPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="container py-6">
        <PageHeader title="Security" description="Manage your account security settings" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container">
          <ClientOnly fallback={
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <div className="grid gap-4">
              <LoginHistory />
              <SecuritySettings />
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>
  )
}
