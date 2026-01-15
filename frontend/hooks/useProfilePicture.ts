import { useState, useEffect } from 'react'

export function useProfilePicture(profilePicture?: string) {
  const [pictureUrl, setPictureUrl] = useState<string>('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (profilePicture) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
      // Ensure profilePicture starts with /
      const path = profilePicture.startsWith('/') ? profilePicture : `/${profilePicture}`
      const url = `${apiUrl}${path}?t=${refreshKey}`
      console.log('useProfilePicture: Setting picture URL:', url);
      setPictureUrl(url)
    } else {
      console.log('useProfilePicture: No profile picture');
      setPictureUrl('')
    }
  }, [profilePicture, refreshKey])

  useEffect(() => {
    const handleUpdate = () => {
      console.log('useProfilePicture: Received update event');
      setRefreshKey(prev => prev + 1)
    }
    window.addEventListener('profilePictureUpdated', handleUpdate)
    return () => window.removeEventListener('profilePictureUpdated', handleUpdate)
  }, [])

  return pictureUrl
}
