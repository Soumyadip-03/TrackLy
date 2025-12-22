"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/lib/auth-context'
import { saveToLocalStorage, getFromLocalStorage } from "@/lib/storage-utils"
import { fetchWithAuth } from '@/lib/api'
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Save } from "lucide-react"
import { AdminBadge } from "@/components/ui/admin-badge"

interface ProfileData {
  name: string;
  email: string;
  studentId: string;
  currentSemester: string;
}

interface ProfileFormProps {
  onUpdateAction: (data: ProfileData) => void;
}

export function SettingsProfileForm({ onUpdateAction }: ProfileFormProps) {
  const { user } = useAuth()
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    studentId: "",
    email: "",
    currentSemester: "",
  })
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [originalData, setOriginalData] = useState<ProfileData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load user profile data
  useEffect(() => {
    const savedProfile = getFromLocalStorage<ProfileData>('user_profile', {
      name: "",
      email: user?.email || "",
      studentId: "",
      currentSemester: "1"
    });
    
    const initialData = {
      ...savedProfile,
      email: user?.email || savedProfile.email || ""
    };
    
    setProfileData(initialData);
    setOriginalData(initialData);
    
    // Check if user has admin role
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const response = await fetchWithAuth('/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Check for changes in profile data
  useEffect(() => {
    if (originalData) {
      const changed = 
        originalData.name !== profileData.name ||
        originalData.email !== profileData.email ||
        originalData.studentId !== profileData.studentId ||
        originalData.currentSemester !== profileData.currentSemester;
      
      setHasChanges(changed);
    }
  }, [profileData, originalData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }));
  }

  const handleSemesterChange = (value: string) => {
    setProfileData(prev => ({ ...prev, currentSemester: value }));
  }
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage
      saveToLocalStorage('user_profile', profileData);
      
      // Update original data to reflect saved state
      setOriginalData({...profileData});
      
      // Notify parent component
      onUpdateAction(profileData);
      
      // Dispatch events for other components
      if (originalData?.currentSemester !== profileData.currentSemester) {
        window.dispatchEvent(new CustomEvent('semesterChanged', { 
          detail: { semester: profileData.currentSemester }
        }));
      }
      
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      
      toast({
        title: "Profile Saved",
        description: "Your profile information has been updated successfully."
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Save Failed",
        description: "There was a problem saving your profile information.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            Personal Information
            {isAdmin && (
              <span className="ml-2 inline-block">
                <AdminBadge size="md" />
              </span>
            )}
          </CardTitle>
        </div>
        <CardDescription>
          Update your personal information and how others see you on the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" value={profileData.name || ""} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            value={profileData.email || ""} 
            onChange={handleChange} 
            disabled 
            className="bg-muted/50"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studentId">Student ID</Label>
          <Input id="studentId" name="studentId" value={profileData.studentId || ""} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentSemester">Current Semester</Label>
          <Select value={profileData.currentSemester || "1"} onValueChange={handleSemesterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <SelectItem key={sem} value={sem.toString()}>
                  Semester {sem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t p-4">
        <Button 
          onClick={handleSaveChanges} 
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
