"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { saveToLocalStorage, getFromLocalStorage, removeFromLocalStorage } from '@/lib/storage-utils'
import { fetchWithAuth } from '@/lib/api'

interface PendingAttendance {
  subjectId: string
  subjectName: string
  date: string
  status: 'present' | 'absent'
  classType: string
  scheduleClassId: string
  hasPreparatoryTag: boolean
  startTime: string
  endTime: string
}

interface ScheduleClass {
  id: string
  subjectId: string
  subject: string
  day: string
  startTime: string
  endTime: string
  classType?: string
}

export function useAutoAttendance() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingRecords, setPendingRecords] = useState<PendingAttendance[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load auto-attendance status and pending records
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetchWithAuth('/auto-attendance/status')
        const data = await response.json()
        const enabled = data.data.autoAttendanceEnabled
        setIsEnabled(enabled)

        // Load pending records from localStorage
        const pending = getFromLocalStorage<PendingAttendance[]>('autoAttendance_pending', [])
        setPendingRecords(pending)

        // Check if we need to upload yesterday's data
        await checkAndUploadPendingRecords()
      } catch (error) {
        console.error('Failed to load auto-attendance status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStatus()
  }, [])

  // Start hourly check when enabled
  useEffect(() => {
    if (isEnabled) {
      // Check immediately
      checkAndMarkPastClasses()

      // Then check every hour
      intervalRef.current = setInterval(() => {
        checkAndMarkPastClasses()
      }, 3600000) // 1 hour

      // Schedule end of day upload
      scheduleEndOfDayUpload()
    } else {
      // Clear interval when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isEnabled])

  // Check and upload pending records from previous day
  const checkAndUploadPendingRecords = async () => {
    const lastUpload = getFromLocalStorage<string>('autoAttendance_lastUpload', '')
    const today = new Date().toISOString().split('T')[0]

    if (lastUpload && lastUpload !== today) {
      const pending = getFromLocalStorage<PendingAttendance[]>('autoAttendance_pending', [])
      if (pending.length > 0) {
        await uploadBulkAttendance(pending)
      }
    }
  }

  // Check for past classes and mark them
  const checkAndMarkPastClasses = async () => {
    try {
      const scheduleResponse = await fetchWithAuth('/schedule')
      const scheduleData = await scheduleResponse.json()
      const schedule = scheduleData.data
      
      if (!schedule || !schedule.classes || schedule.classes.length === 0) {
        return
      }

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const todayDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]

      const newPendingRecords: PendingAttendance[] = []

      for (const cls of schedule.classes as ScheduleClass[]) {
        if (cls.day !== todayDay) continue

        const [endHour, endMin] = cls.endTime.split(':').map(Number)
        const classEndTime = endHour * 60 + endMin

        if (classEndTime >= currentTime) continue

        // Check if already in pending or database
        const alreadyPending = pendingRecords.some(
          r => r.subjectId === cls.subjectId && r.date === today.toISOString() && r.scheduleClassId === cls.id
        )

        if (alreadyPending) continue

        // Check database
        try {
          const historyResponse = await fetchWithAuth('/attendance/history')
          const historyData = await historyResponse.json()
          const existsInDb = historyData.data.some(
            (att: any) => 
              att.subject._id === cls.subjectId && 
              new Date(att.date).toDateString() === today.toDateString() &&
              att.scheduleClassId === cls.id
          )

          if (existsInDb) continue
        } catch (error) {
          console.error('Error checking attendance history:', error)
        }

        // Add to pending
        newPendingRecords.push({
          subjectId: cls.subjectId,
          subjectName: cls.subject,
          date: today.toISOString(),
          status: 'present',
          classType: cls.classType || 'none',
          scheduleClassId: cls.id || '',
          hasPreparatoryTag: false,
          startTime: cls.startTime,
          endTime: cls.endTime
        })
      }

      if (newPendingRecords.length > 0) {
        const updated = [...pendingRecords, ...newPendingRecords]
        setPendingRecords(updated)
        saveToLocalStorage('autoAttendance_pending', updated)
      }
    } catch (error) {
      console.error('Error checking past classes:', error)
    }
  }

  // Schedule end of day upload (11:59 PM)
  const scheduleEndOfDayUpload = async () => {
    const now = new Date()
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0)
    const timeUntilEndOfDay = endOfDay.getTime() - now.getTime()

    if (timeUntilEndOfDay > 0) {
      setTimeout(async () => {
        // Auto-mark all unmarked classes for today as present
        await autoMarkUnmarkedClasses()
        
        // Then upload all pending records
        const pending = getFromLocalStorage<PendingAttendance[]>('autoAttendance_pending', [])
        if (pending.length > 0) {
          await uploadBulkAttendance(pending)
        }
      }, timeUntilEndOfDay)
    }
  }

  // Auto-mark unmarked classes as present at end of day
  const autoMarkUnmarkedClasses = async () => {
    try {
      const scheduleResponse = await fetchWithAuth('/schedule')
      const scheduleData = await scheduleResponse.json()
      const schedule = scheduleData.data
      
      if (!schedule || !schedule.classes || schedule.classes.length === 0) {
        return
      }

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]

      // Get today's classes
      const todaysClasses = (schedule.classes as ScheduleClass[]).filter(cls => cls.day === todayDay)

      const newPendingRecords: PendingAttendance[] = []

      for (const cls of todaysClasses) {
        // Check if already in pending records
        const alreadyPending = pendingRecords.some(
          r => r.subjectId === cls.subjectId && r.date === today.toISOString() && r.scheduleClassId === cls.id
        )

        if (alreadyPending) continue // User already marked this class

        // Check if already in database
        try {
          const historyResponse = await fetchWithAuth('/attendance/history')
          const historyData = await historyResponse.json()
          const existsInDb = historyData.data.some(
            (att: any) => 
              att.subject._id === cls.subjectId && 
              new Date(att.date).toDateString() === today.toDateString() &&
              att.scheduleClassId === cls.id
          )

          if (existsInDb) continue // Already uploaded
        } catch (error) {
          console.error('Error checking attendance history:', error)
        }

        // Auto-mark as present (unmarked class)
        newPendingRecords.push({
          subjectId: cls.subjectId,
          subjectName: cls.subject,
          date: today.toISOString(),
          status: 'present',
          classType: cls.classType || 'none',
          scheduleClassId: cls.id || '',
          hasPreparatoryTag: false,
          startTime: cls.startTime,
          endTime: cls.endTime
        })
      }

      if (newPendingRecords.length > 0) {
        const updated = [...pendingRecords, ...newPendingRecords]
        setPendingRecords(updated)
        saveToLocalStorage('autoAttendance_pending', updated)
        console.log(`Auto-marked ${newPendingRecords.length} unmarked classes as present`)
      }
    } catch (error) {
      console.error('Error auto-marking unmarked classes:', error)
    }
  }

  // Upload bulk attendance to database
  const uploadBulkAttendance = async (records: PendingAttendance[]) => {
    try {
      await fetchWithAuth('/auto-attendance/bulk-upload', {
        method: 'POST',
        body: JSON.stringify({ attendanceRecords: records })
      })

      // Clear pending records
      setPendingRecords([])
      removeFromLocalStorage('autoAttendance_pending')
      
      // Update last upload date
      const today = new Date().toISOString().split('T')[0]
      saveToLocalStorage('autoAttendance_lastUpload', today)

      return true
    } catch (error) {
      console.error('Failed to upload bulk attendance:', error)
      return false
    }
  }

  // Toggle auto-attendance
  const toggleAutoAttendance = async (enabled: boolean) => {
    try {
      await fetchWithAuth('/auto-attendance/toggle', {
        method: 'PUT',
        body: JSON.stringify({ enabled })
      })
      setIsEnabled(enabled)

      if (enabled) {
        // Mark past classes immediately
        const response = await fetchWithAuth('/auto-attendance/mark-past', {
          method: 'POST'
        })
        const data = await response.json()
        console.log('Past classes marked:', data.count)
      } else {
        // Upload pending records before disabling
        if (pendingRecords.length > 0) {
          await uploadBulkAttendance(pendingRecords)
        }
      }

      return true
    } catch (error) {
      console.error('Failed to toggle auto-attendance:', error)
      return false
    }
  }

  // Update pending record (for manual edits)
  const updatePendingRecord = (
    subjectId: string,
    date: string,
    scheduleClassId: string,
    updates: Partial<PendingAttendance>
  ) => {
    const updated = pendingRecords.map(record => {
      if (
        record.subjectId === subjectId &&
        record.date === date &&
        record.scheduleClassId === scheduleClassId
      ) {
        return { ...record, ...updates }
      }
      return record
    })

    setPendingRecords(updated)
    saveToLocalStorage('autoAttendance_pending', updated)
  }

  // Remove pending record
  const removePendingRecord = (subjectId: string, date: string, scheduleClassId: string) => {
    const updated = pendingRecords.filter(
      record =>
        !(record.subjectId === subjectId && record.date === date && record.scheduleClassId === scheduleClassId)
    )

    setPendingRecords(updated)
    saveToLocalStorage('autoAttendance_pending', updated)
  }

  return {
    isEnabled,
    isLoading,
    pendingRecords,
    toggleAutoAttendance,
    updatePendingRecord,
    removePendingRecord,
    uploadBulkAttendance
  }
}
