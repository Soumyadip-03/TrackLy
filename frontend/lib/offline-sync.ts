import { fetchWithAuth } from './api'

interface UserData {
  notifications: any[]
  attendance: any[]
  points: number
  todos: any[]
  subjects: any[]
  profilePicture?: string
  name?: string
  email?: string
  studentId?: string
  currentSemester?: number
}

export const syncUserDataToLocalStorage = async (): Promise<UserData | null> => {
  try {
    const userData: UserData = {
      notifications: [],
      attendance: [],
      points: 0,
      todos: [],
      subjects: [],
    }

    // Fetch notifications
    try {
      const notifRes = await fetchWithAuth('/notification')
      if (notifRes.ok) {
        const notifData = await notifRes.json()
        userData.notifications = notifData.data || []
      }
    } catch (e) {
      console.warn('Failed to sync notifications:', e)
    }

    // Fetch attendance
    try {
      const attRes = await fetchWithAuth('/attendance')
      if (attRes.ok) {
        const attData = await attRes.json()
        userData.attendance = attData.data || []
      }
    } catch (e) {
      console.warn('Failed to sync attendance:', e)
    }

    // Fetch todos
    try {
      const todoRes = await fetchWithAuth('/todo')
      if (todoRes.ok) {
        const todoData = await todoRes.json()
        userData.todos = todoData.data || []
      }
    } catch (e) {
      console.warn('Failed to sync todos:', e)
    }

    // Fetch subjects
    try {
      const subjRes = await fetchWithAuth('/subject')
      if (subjRes.ok) {
        const subjData = await subjRes.json()
        userData.subjects = subjData.data || []
      }
    } catch (e) {
      console.warn('Failed to sync subjects:', e)
    }

    // Fetch user profile
    try {
      const userRes = await fetchWithAuth('/auth/me')
      if (userRes.ok) {
        const userInfo = await userRes.json()
        const user = userInfo.data || userInfo
        userData.points = user.points || 0
        userData.profilePicture = user.profilePicture
        userData.name = user.name
        userData.email = user.email
        userData.studentId = user.studentId
        userData.currentSemester = user.currentSemester
      }
    } catch (e) {
      console.warn('Failed to sync user profile:', e)
    }

    // Save to localStorage
    localStorage.setItem('trackly_offline_data', JSON.stringify(userData))
    localStorage.setItem('trackly_offline_sync_time', new Date().toISOString())
    
    return userData
  } catch (error) {
    console.error('Error syncing user data:', error)
    return null
  }
}

export const getOfflineUserData = (): UserData | null => {
  try {
    const data = localStorage.getItem('trackly_offline_data')
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Error retrieving offline data:', e)
    return null
  }
}

export const clearOfflineData = () => {
  localStorage.removeItem('trackly_offline_data')
  localStorage.removeItem('trackly_offline_sync_time')
}
