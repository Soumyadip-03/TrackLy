"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { setCookie, deleteCookie } from 'cookies-next'
import { getFromLocalStorage, saveToLocalStorage, clearUserData } from "@/lib/storage-utils"
import { format } from "date-fns"

interface User {
  _id: string
  email: string
  name?: string
  [key: string]: any
}

interface PointsData {
  total: number
  streak: number
  achievements: Achievement[]
}

interface Achievement {
  name: string
  points: number
  date: string
}

interface PointsHistoryItem {
  date: string
  points: number
  type: "earned" | "spent"
  reason: string
}

export type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  backendAvailable: boolean | null
  connectionError: string | null
  isOfflineMode: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, name?: string, studentId?: string, currentSemester?: number) => Promise<any>
  signOut: () => Promise<void>
  checkConnection: () => Promise<boolean>
  enableOfflineMode: () => void
  disableOfflineMode: () => Promise<boolean>
}

const API_URL = 'http://localhost:5000/api'

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  backendAvailable: null,
  connectionError: null,
  isOfflineMode: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  checkConnection: async () => false,
  enableOfflineMode: () => {},
  disableOfflineMode: async () => false,
})

const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.error('Error checking API availability:', error)
    return false
  }
}

const initializeUserData = () => {
  const pointsData = getFromLocalStorage<PointsData>('points', {
    total: 0,
    streak: 0,
    achievements: []
  })
  
  if (!pointsData || pointsData.total === 0) {
    const defaultPoints: PointsData = {
      total: 100,
      streak: 0,
      achievements: []
    }
    
    saveToLocalStorage('points', defaultPoints)
    
    const initialHistoryEntry: PointsHistoryItem = {
      date: format(new Date(), "MMM d, yyyy"),
      points: 100,
      type: "earned",
      reason: "Initial welcome bonus"
    }
    
    saveToLocalStorage('points_history', [initialHistoryEntry])
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false)
  const router = useRouter()

  const persistSession = (token: string, userData: User) => {
    try {
      localStorage.setItem('trackly_token', token)
      localStorage.setItem('trackly_user', JSON.stringify(userData))
      setCookie('trackly_token', token, { maxAge: 60 * 60 * 24 * 7 })
      setCookie('user-id', userData._id, { maxAge: 60 * 60 * 24 * 7 })
      console.log('Session persisted successfully')
    } catch (error) {
      console.error('Failed to persist session:', error)
    }
  }

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setConnectionError(null)
    const isBackendAvailable = await checkApiAvailability()
    setBackendAvailable(isBackendAvailable)
    
    if (!isBackendAvailable) {
      setConnectionError('Unable to connect to backend API. Please check your internet connection.')
    }
    
    return isBackendAvailable
  }, [])

  const enableOfflineMode = useCallback(() => {
    setIsOfflineMode(true)
    localStorage.setItem('trackly_offline_mode', 'true')
    console.log('Offline mode enabled')
  }, [])

  const disableOfflineMode = useCallback(async (): Promise<boolean> => {
    const isConnected = await checkConnection()
    if (isConnected) {
      setIsOfflineMode(false)
      localStorage.removeItem('trackly_offline_mode')
      console.log('Offline mode disabled, connection restored')
      return true
    } else {
      console.log('Cannot disable offline mode: still disconnected')
      return false
    }
  }, [checkConnection])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('trackly_token')
        const storedUser = localStorage.getItem('trackly_user')
        const offlineMode = localStorage.getItem('trackly_offline_mode') === 'true'
        
        setIsOfflineMode(offlineMode)
        
        if (token && storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            setUser(userData)
            setIsAuthenticated(true)
            console.log('User restored from localStorage')
          } catch (e) {
            console.error('Error parsing stored user:', e)
          }
        }
        
        await checkConnection()
        setIsLoading(false)
      } catch (err) {
        console.error('Auth initialization error:', err)
        setIsLoading(false)
      }
    }
    
    initializeAuth()
  }, [checkConnection])

  const signUp = async (email: string, password: string, name?: string, studentId?: string, currentSemester?: number) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          name: name || email.split('@')[0],
          studentId: studentId || 'STU' + Date.now(),
          currentSemester: currentSemester || 1
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed')
      }
      
      if (data.token) {
        const userData = data.user || { 
          _id: '', 
          email,
          name: name || email.split('@')[0],
          studentId: studentId || 'STU' + Date.now(),
          currentSemester: currentSemester || 1
        }
        persistSession(data.token, userData)
        setUser(userData)
        setIsAuthenticated(true)
        initializeUserData()
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.message || data.error || 'Login failed' }
      }
      
      if (data.token) {
        // Fetch user data after successful login
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${data.token}` }
        })
        
        const userData = await userResponse.json()
        const user = userData.data || userData
        
        persistSession(data.token, user)
        setUser(user)
        setIsAuthenticated(true)
        initializeUserData()
        
        // Play login sound if enabled
        const settings = getFromLocalStorage<any>('notification_settings', {})
        if (settings.loginNotificationSound !== false) {
          try {
            const audioContext = new AudioContext()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            oscillator.start()
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.6)
            oscillator.stop(audioContext.currentTime + 0.6)
          } catch (e) {
            console.error('Error playing login sound:', e)
          }
        }
        
        return { success: true }
      }
      
      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: String(error) }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      localStorage.removeItem('trackly_token')
      localStorage.removeItem('trackly_user')
      deleteCookie('trackly_token')
      deleteCookie('user-id')
      clearUserData()
      
      setUser(null)
      setIsAuthenticated(false)
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      setUser(null)
      setIsAuthenticated(false)
      router.push('/login')
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    backendAvailable,
    connectionError,
    isOfflineMode,
    signIn,
    signUp,
    signOut,
    checkConnection,
    enableOfflineMode,
    disableOfflineMode
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
