import { useState, useEffect, useCallback } from 'react'

export function useProfilePicture(userProfilePicture?: string) {
  const [profilePicture, setProfilePicture] = useState<string>('')

  const updateProfilePicture = useCallback(() => {
    const storedUser = localStorage.getItem('trackly_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        if (userData.profilePicture) {
          setProfilePicture(`http://localhost:5000/${userData.profilePicture}`)
          return
        }
      } catch (e) {
        console.error('Error parsing stored user:', e)
      }
    }
    if (userProfilePicture) {
      setProfilePicture(`http://localhost:5000/${userProfilePicture}`)
    } else {
      setProfilePicture('')
    }
  }, [userProfilePicture])

  useEffect(() => {
    updateProfilePicture()

    const handleStorageChange = () => {
      updateProfilePicture()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('profilePictureUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profilePictureUpdated', handleStorageChange)
    }
  }, [updateProfilePicture])

  return profilePicture
}
