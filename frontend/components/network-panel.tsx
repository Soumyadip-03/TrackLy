"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"

export function NetworkPanel() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)
  const [connectionTest, setConnectionTest] = useState<boolean | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const testConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/health", { method: "HEAD" })
      setConnectionTest(response.ok)
    } catch {
      setConnectionTest(false)
    } finally {
      setTesting(false)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          title={isOnline ? "Online" : "Offline"}
        >
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Network Status</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection</span>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Online</span>
                  </>
                ) : (
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
            {connectionTest !== null && (
              <div className="flex items-center gap-2 text-xs">
                {connectionTest ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">Connected</span>
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">Not Connected</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm">Offline Mode</span>
            <Switch
              checked={offlineMode}
              onCheckedChange={setOfflineMode}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
