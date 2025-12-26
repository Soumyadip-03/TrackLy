"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { syncUserDataToLocalStorage, clearOfflineData } from "@/lib/offline-sync"
import { useAuth } from "@/lib/auth-context"

type ConnectionStatus = 'online' | 'backend-only' | 'offline'

export function NetworkPanel() {
  const { enableOfflineMode, disableOfflineMode } = useAuth()
  const [status, setStatus] = useState<ConnectionStatus>('online')
  const [offlineMode, setOfflineMode] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health')
        if (response.ok) {
          const data = await response.json()
          setStatus(data.dbStatus === 'connected' ? 'online' : 'backend-only')
        } else {
          setStatus('offline')
        }
      } catch {
        setStatus('offline')
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const testConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch('http://localhost:5000/api/health')
      if (response.ok) {
        const data = await response.json()
        if (data.dbStatus === 'connected') {
          setStatus('online')
          toast.success('Backend and Database connected')
        } else {
          setStatus('backend-only')
          toast.warning('Backend connected but Database offline')
        }
      } else {
        setStatus('offline')
        toast.error('Backend not connected')
      }
    } catch {
      setStatus('offline')
      toast.error('Backend not connected')
    } finally {
      setTesting(false)
    }
  }

  const handleOfflineModeToggle = async (checked: boolean) => {
    if (checked) {
      setSyncing(true)
      toast.loading('Syncing data for offline mode...')
      const synced = await syncUserDataToLocalStorage()
      setSyncing(false)
      if (synced) {
        setOfflineMode(true)
        enableOfflineMode()
        toast.dismiss()
        toast.success('Offline mode enabled. Your data is synced.')
      } else {
        toast.dismiss()
        toast.error('Failed to sync data. Offline mode not enabled.')
      }
    } else {
      setSyncing(true)
      const connected = await disableOfflineMode()
      setSyncing(false)
      if (connected) {
        setOfflineMode(false)
        clearOfflineData()
        toast.success('Offline mode disabled. Connected to backend.')
      } else {
        toast.error('Cannot disable offline mode: Backend not connected')
      }
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-500'
      case 'backend-only':
        return 'text-yellow-500'
      case 'offline':
        return 'text-red-500'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <Wifi className={`h-5 w-5 ${getStatusColor()}`} />
      case 'backend-only':
        return <AlertCircle className={`h-5 w-5 ${getStatusColor()}`} />
      case 'offline':
        return <WifiOff className={`h-5 w-5 ${getStatusColor()}`} />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'backend-only':
        return 'Online (DB Offline)'
      case 'offline':
        return 'Offline'
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          title={getStatusText()}
        >
          {getStatusIcon()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Network Status</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection</span>
              <div className="flex items-center gap-2">
                {status === 'online' && (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Online</span>
                  </>
                )}
                {status === 'backend-only' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-500">Online (DB Offline)</span>
                  </>
                )}
                {status === 'offline' && (
                  <>
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-500">Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Connection Test</h4>
            <Button
              onClick={testConnection}
              disabled={testing}
              variant="outline"
              className="w-full text-xs"
            >
              {testing ? "Testing..." : "Test Connection"}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm">Offline Mode</span>
            <Switch
              checked={offlineMode}
              onCheckedChange={handleOfflineModeToggle}
              disabled={syncing}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
