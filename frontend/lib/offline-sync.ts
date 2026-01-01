import { getFromLocalStorage, saveToLocalStorage } from './storage-utils'

export async function syncUserDataToLocalStorage(): Promise<boolean> {
  try {
    const token = localStorage.getItem('trackly_token')
    if (!token) {
      console.error('No token found for offline sync')
      return false
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    console.log('Syncing data from:', apiUrl)
    
    // Fetch all user data with individual error handling
    const fetchData = async (endpoint: string) => {
      try {
        const res = await fetch(`${apiUrl}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          return data.data || []
        }
        console.error(`Failed to fetch ${endpoint}: ${res.status}`)
        return []
      } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err)
        return []
      }
    }

    const [subjects, attendance, todos] = await Promise.all([
      fetchData('/subject'),
      fetchData('/attendance/stats'),
      fetchData('/todo')
    ])

    // Save whatever data we got
    saveToLocalStorage('offline_subjects', subjects)
    saveToLocalStorage('offline_attendance', attendance)
    saveToLocalStorage('offline_todos', todos)
    saveToLocalStorage('offline_mode', true)
    
    console.log('Offline data synced:', { subjects: subjects.length, attendance: attendance.length, todos: todos.length })
    return true
  } catch (error) {
    console.error('Failed to sync data:', error)
    return false
  }
}

export function clearOfflineData(): void {
  localStorage.removeItem('offline_subjects')
  localStorage.removeItem('offline_attendance')
  localStorage.removeItem('offline_todos')
  localStorage.removeItem('offline_mode')
}
