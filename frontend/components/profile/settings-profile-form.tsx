"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from '@/lib/auth-context'
import { fetchWithAuth } from '@/lib/api'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Save, Camera } from "lucide-react"
import { AdminBadge } from "@/components/ui/admin-badge"

interface ProfileData {
  name: string;
  email: string;
  studentId: string;
  currentSemester: number;
  profilePicture?: string;
}

interface ProfileFormProps {
  onUpdateAction?: (data: ProfileData) => void;
}

export function SettingsProfileForm({ onUpdateAction }: ProfileFormProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    studentId: "",
    email: "",
    currentSemester: 1,
    profilePicture: "",
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSemester, setOriginalSemester] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  // Load user profile data from backend
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      
      try {
        const response = await fetchWithAuth('/auth/me');
        if (response.ok) {
          const result = await response.json();
          const data = result.data || result;
          
          setProfileData({
            name: data.name || "",
            email: data.email || "",
            studentId: data.studentId || "",
            currentSemester: data.currentSemester || 1,
            profilePicture: data.profilePicture || "",
          });
          
          setOriginalSemester(data.currentSemester || 1);
          
          if (data.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [user]);

  // Check if semester has changed
  useEffect(() => {
    setHasChanges(profileData.currentSemester !== originalSemester || selectedFile !== null);
  }, [profileData.currentSemester, originalSemester, selectedFile]);

  const handleSemesterChange = (value: string) => {
    setProfileData(prev => ({ ...prev, currentSemester: parseInt(value) }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      // Upload profile picture if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('profilePicture', selectedFile);
        
        const token = localStorage.getItem('trackly_token');
        const response = await fetch('http://localhost:5000/api/user/profile-picture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to upload profile picture');
        }

        const result = await response.json();
        setProfileData(prev => ({ ...prev, profilePicture: result.profilePicture }));
        setSelectedFile(null);
        setPreviewUrl("");
      }

      // Update semester
      const response = await fetchWithAuth('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          currentSemester: profileData.currentSemester,
        })
      });

      if (response.ok) {
        setOriginalSemester(profileData.currentSemester);
        setHasChanges(false);
        toast.success('Profile updated successfully');
        onUpdateAction?.(profileData);
      } else {
        toast.error('Failed to save changes');
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error('Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Card><CardContent className="pt-6">Loading profile...</CardContent></Card>;
  }

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
          Your signup credentials are fixed. You can change your profile picture and semester.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture Section */}
        <div className="flex justify-center">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="h-32 w-32">
              <AvatarImage src={previewUrl || profileData.profilePicture || undefined} />
              <AvatarFallback className="text-2xl">{profileData.name?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Fixed Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={profileData.name || ""} 
              disabled 
              className="bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Set during signup - cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={profileData.email || ""} 
              disabled 
              className="bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Set during signup - cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input 
              id="studentId" 
              value={profileData.studentId || ""} 
              disabled 
              className="bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Set during signup - cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentSemester">Current Semester</Label>
            <Select 
              value={profileData.currentSemester.toString()} 
              onValueChange={handleSemesterChange}
            >
              <SelectTrigger id="currentSemester">
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
            <p className="text-xs text-muted-foreground">You can change your current semester</p>
          </div>
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
