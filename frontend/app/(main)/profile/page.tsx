"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalInfoForm } from "@/components/profile/personal-info-form"
import { SubjectManager } from "@/components/profile/subject-manager"
import { ScheduleManager } from "@/components/profile/schedule-manager"
import { AcademicPeriodSelector } from "@/components/attendance/academic-period-selector"
import { User, Book, Calendar, GraduationCap } from "lucide-react"
import { ClientOnly } from "@/components/client-only"

export default function ProfilePage() {

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="container py-6"></div>
      <div className="flex-1 overflow-hidden">
        <ClientOnly fallback={
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <Tabs defaultValue="personal" className="h-full flex flex-col">
            <div className="container">
              <TabsList className="w-full max-w-3xl mx-auto grid grid-cols-4">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Personal Info</span>
                </TabsTrigger>
                <TabsTrigger value="academic" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Academic Period</span>
                </TabsTrigger>
                <TabsTrigger value="subjects" className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  <span>Subjects</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-y-auto mt-8">
              <div className="container pb-6">
                <TabsContent value="personal" className="space-y-4 mt-0">
                  <PersonalInfoForm />
                </TabsContent>
                <TabsContent value="academic" className="space-y-4 mt-0">
                  <AcademicPeriodSelector />
                </TabsContent>
                <TabsContent value="subjects" className="space-y-4 mt-0">
                  <SubjectManager />
                </TabsContent>
                <TabsContent value="schedule" className="space-y-4 mt-0">
                  <ScheduleManager />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </ClientOnly>
      </div>
    </div>
  )
} 