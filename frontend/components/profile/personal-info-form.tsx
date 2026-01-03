"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from '@/lib/auth-context'
import { fetchWithAuth, buildApiUrl } from '@/lib/api'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Save, Camera } from "lucide-react"
import { AdminBadge } from "@/components/ui/admin-badge"
import { useProfilePicture } from "@/hooks/useProfilePicture"

interface ProfileData {
  name: string;
  email: string;
  studentId: string;
  currentSemester: number;
  profilePicture?: string;
}

interface PersonalInfoFormProps {
  onUpdateAction?: (data: ProfileData) => void;
}

export function PersonalInfoForm({ onUpdateAction }: PersonalInfoFormProps = {}) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profilePictureUrl = useProfilePicture(user?.profilePicture)
  
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

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
          
          console.log('Profile data loaded:', data);
          console.log('Profile picture path:', data.profilePicture);
          
          const picturePath = data.profilePicture ? 
            (data.profilePicture.startsWith('/') ? data.profilePicture : `/${data.profilePicture}`) : "";
          
          setProfileData({
            name: data.name || "",
            email: data.email || "",
            studentId: data.studentId || "",
            currentSemester: data.currentSemester || 1,
            profilePicture: picturePath,
          });
          
          if (data.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
    
    const handleAcademicPeriodUpdate = (event: any) => {
      if (event.detail?.semester) {
        setProfileData(prev => ({ ...prev, currentSemester: parseInt(event.detail.semester) }));
      }
    };
    
    const handleProfilePictureUpdate = () => {
      loadProfile();
    };
    
    window.addEventListener('academicPeriodUpdated', handleAcademicPeriodUpdate);
    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    
    return () => {
      window.removeEventListener('academicPeriodUpdated', handleAcademicPeriodUpdate);
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, [user]);

  useEffect(() => {
    setHasChanges(selectedFile !== null);
  }, [selectedFile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const token = localStorage.getItem('trackly_token');
      const apiUrl = buildApiUrl('/user/profile-picture');
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProfileData(prev => ({ ...prev, profilePicture: "" }));
        setPreviewUrl("");
        setSelectedFile(null);
        
        const storedUser = localStorage.getItem('trackly_user');
        if (storedUser) {
          const updatedUser = { ...JSON.parse(storedUser) };
          delete updatedUser.profilePicture;
          localStorage.setItem('trackly_user', JSON.stringify(updatedUser));
        }
        
        window.dispatchEvent(new Event('profilePictureUpdated'));
        toast.success('Profile picture removed');
      } else {
        toast.error('Failed to remove profile picture');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast.error('Error removing profile picture');
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('profilePicture', selectedFile);
        
        const token = localStorage.getItem('trackly_token');
        const apiUrl = buildApiUrl('/user/profile-picture');
        const response = await fetch(apiUrl, {
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
        const newProfilePicture = result.profilePicture;
        const formattedPath = newProfilePicture.startsWith('/') ? newProfilePicture : `/${newProfilePicture}`;
        
        setProfileData(prev => ({ ...prev, profilePicture: formattedPath }));
        setSelectedFile(null);
        setPreviewUrl("");
        
        const storedUser = localStorage.getItem('trackly_user');
        if (storedUser) {
          const updatedUser = { ...JSON.parse(storedUser), profilePicture: formattedPath };
          localStorage.setItem('trackly_user', JSON.stringify(updatedUser));
        }
        
        window.dispatchEvent(new Event('profilePictureUpdated'));
        
        setHasChanges(false);
        toast.success('Profile picture updated successfully');
        onUpdateAction?.(profileData);
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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              Personal Information
              {isAdmin && (
                <span className="ml-2 inline-block">
                  <AdminBadge size="md" />
                </span>
              )}
            </CardTitle>
          </div>
          <CardDescription className="text-sm">
            Your signup credentials are fixed. You can change your profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6 pb-4 border-b">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="h-24 w-24">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt="Preview" />
                ) : profilePictureUrl ? (
                  <AvatarImage 
                    src={profilePictureUrl}
                    alt="Profile picture"
                  />
                ) : null}
                <AvatarFallback className="text-2xl">{profileData.name?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{profileData.name}</h3>
              <p className="text-sm text-muted-foreground">{profileData.email}</p>
              {(profilePictureUrl || previewUrl) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleRemoveProfilePicture(); }}
                  className="text-red-600 hover:text-red-700 mt-2 h-8 px-2"
                >
                  Remove Picture
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-sm">Student ID</Label>
              <Input 
                id="studentId" 
                value={profileData.studentId || ""} 
                disabled 
                className="bg-muted/50 cursor-not-allowed h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentSemester" className="text-sm">Current Semester</Label>
              <Input 
                id="currentSemester" 
                value={`Semester ${profileData.currentSemester}`} 
                disabled 
                className="bg-muted/50 cursor-not-allowed h-9"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t py-3 px-6">
          <Button 
            onClick={handleSaveChanges} 
            disabled={!hasChanges || isSaving}
            size="sm"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-3 w-3" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
