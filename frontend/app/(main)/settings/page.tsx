"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Settings, GraduationCap, Mail, SlidersHorizontal } from "lucide-react"
import { ClientOnly } from "@/components/client-only"
import { LoginHistory } from "@/components/notifications/login-history"
import { SecuritySettings } from "@/components/profile/security-settings"
import { GeneralSettings } from "@/components/settings/general-settings"
import { AcademicSettings } from "@/components/settings/academic-settings"
import { DeliverySettings } from "@/components/settings/delivery-settings"
import { AdvancedSettings } from "@/components/settings/advanced-settings"

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="container py-6"></div>
      <div className="flex-1 overflow-hidden">
        <ClientOnly fallback={
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <Tabs defaultValue="security" className="h-full flex flex-col">
            <div className="container">
              <TabsList className="w-full max-w-3xl mx-auto grid grid-cols-5">
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>General</span>
                </TabsTrigger>
                <TabsTrigger value="academic" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Academic</span>
                </TabsTrigger>
                <TabsTrigger value="delivery" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Delivery</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Advanced</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-y-auto mt-6">
              <div className="container pb-6">
                <TabsContent value="security" className="space-y-4 mt-0">
                  <LoginHistory />
                  <SecuritySettings />
                </TabsContent>
                <TabsContent value="general" className="space-y-4 mt-0">
                  <GeneralSettings />
                </TabsContent>
                <TabsContent value="academic" className="space-y-4 mt-0">
                  <AcademicSettings />
                </TabsContent>
                <TabsContent value="delivery" className="space-y-4 mt-0">
                  <DeliverySettings />
                </TabsContent>
                <TabsContent value="advanced" className="space-y-4 mt-0">
                  <AdvancedSettings />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </ClientOnly>
      </div>
    </div>
  )
}
