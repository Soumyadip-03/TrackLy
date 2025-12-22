"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LoadingButton } from '@/components/ui/loading-button'
import { toast } from 'sonner'
import { fetchWithAuth } from '@/lib/api'

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export function ProfileForm() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      if (!user) return
      const response = await fetchWithAuth('/auth/me')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFullName(data.full_name || '')
      }
    } catch (error: any) {
      toast.error('Error loading profile: ' + error.message)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      if (!user) return
      setIsLoading(true)

      const response = await fetchWithAuth('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
        })
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        toast.success('Profile updated successfully!')
      }
    } catch (error: any) {
      toast.error('Error updating profile: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUploadAvatar = async () => {
    try {
      if (!user || !selectedFile) return
      setIsLoading(true)

      const formData = new FormData()
      formData.append('avatar', selectedFile)

      const token = localStorage.getItem('trackly_token')
      const response = await fetch('http://localhost:5000/api/auth/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) throw new Error('Failed to upload avatar')

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setSelectedFile(null)
      toast.success('Avatar uploaded successfully!')
    } catch (error: any) {
      toast.error('Error uploading avatar: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{fullName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="max-w-xs"
            />
            {selectedFile && (
              <Button
                onClick={handleUploadAvatar}
                disabled={isLoading}
                size="sm"
              >
                Upload Avatar
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={user.email}
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
      </CardContent>
      <CardFooter>
        <LoadingButton
          onClick={handleUpdateProfile}
          loading={isLoading}
          className="ml-auto"
        >
          Save Changes
        </LoadingButton>
      </CardFooter>
    </Card>
  )
}
