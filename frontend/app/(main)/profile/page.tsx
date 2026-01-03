"use client"

import { useState, useCallback, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SettingsProfileForm } from "@/components/profile/settings-profile-form"
import { SettingsSubjectList } from "@/components/profile/settings-subject-list"
import { SettingsScheduleUploader } from "@/components/profile/settings-schedule-uploader"
import { AcademicPeriodSelector } from "@/components/attendance/academic-period-selector"
import { User, Book, Calendar, GraduationCap } from "lucide-react"
import { ClientOnly } from "@/components/client-only"

// API URL - moved inside component to prevent hydration mismatch
const BASE_API_URL = 'http://localhost:5000/api';

// Define types for our form state
interface ProfileData {
  name: string;
  email: string;
  studentId: string;
  currentSemester: string;
}

interface SubjectData {
  id: string;
  name: string;
  code: string;
  classesPerWeek: number;
}

interface ClassEntry {
  day: string;
  name: string;
  time: string;
  room: string;
}

interface ScheduleData {
  fileName?: string;
  fileSize?: number;
  uploadDate?: string;
  processed?: boolean;
  classes: ClassEntry[];
  pdfSchedule?: {
    name: string;
    size: number;
    uploadDate: string;
    dataUrl?: string;
    processed?: boolean;
    parsedSchedule?: {
      days: string[];
      timeSlots: string[];
      schedule: {[day: string]: {[timeSlot: string]: {
        subject: string;
        classType?: string;
        room?: string;
      }}};
    }
  };
  [key: string]: any;
}

interface FormState {
  profile: ProfileData;
  subjects: SubjectData[];
  schedule: ScheduleData;
}

export default function ProfilePage() {
  const [apiUrl, setApiUrl] = useState(BASE_API_URL)
  
  // State for all the settings data with proper typing
  const [formState, setFormState] = useState<FormState>({
    profile: {
      name: "",
      email: "",
      studentId: "",
      currentSemester: ""
    },
    subjects: [],
    schedule: {
      classes: []
    }
  })

  // Set API URL based on hostname after component mounts to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiUrl(window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api' 
        : 'https://trackly-backend.onrender.com/api')
    }
  }, [])
  
  // Functions to update state from child components - memoized to prevent infinite loops
  const updateProfile = useCallback((data: ProfileData) => {
    setFormState(prevState => ({
      ...prevState,
      profile: data
    }))
  }, []);
  
  const updateSubjects = useCallback((data: SubjectData[]) => {
    setFormState(prevState => ({
      ...prevState,
      subjects: data
    }))
  }, []);
  
  const updateSchedule = useCallback((data: ScheduleData) => {
    setFormState(prevState => ({
      ...prevState,
      schedule: data
    }))
  }, []);

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
            <div className="flex-1 overflow-y-auto mt-6">
              <div className="container pb-6">
                <TabsContent value="personal" className="space-y-4 mt-0">
                  <SettingsProfileForm onUpdateAction={updateProfile} />
                </TabsContent>
                <TabsContent value="academic" className="space-y-4 mt-0">
                  <AcademicPeriodSelector />
                </TabsContent>
                <TabsContent value="subjects" className="space-y-4 mt-0">
                  <SettingsSubjectList onUpdateAction={updateSubjects} />
                </TabsContent>
                <TabsContent value="schedule" className="space-y-4 mt-0">
                  <SettingsScheduleUploader onUpdateAction={updateSchedule} />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </ClientOnly>
      </div>
    </div>
  )
} 