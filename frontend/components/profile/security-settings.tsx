"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { fetchWithAuth } from "@/lib/api"
import { AlertCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function SecuritySettings() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showClearSessionsDialog, setShowClearSessionsDialog] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isClearingSessions, setIsClearingSessions] = useState(false)
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }

    try {
      setIsChangingPassword(true)
      const response = await fetchWithAuth('/user/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }

      toast({
        title: "Success",
        description: "Password changed successfully"
      })

      setShowPasswordDialog(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive"
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleClearSessions = async () => {
    try {
      setIsClearingSessions(true)
      const response = await fetchWithAuth('/user/clear-sessions', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to clear sessions')
      }

      toast({
        title: "Success",
        description: "All login sessions cleared successfully"
      })

      setShowClearSessionsDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear sessions",
        variant: "destructive"
      })
    } finally {
      setIsClearingSessions(false)
    }
  }

  return (
    <div className="mt-2">
      <h3 className="text-lg font-medium mb-4">Security Settings</h3>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setShowPasswordDialog(true)}
        >
          Change Password
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowClearSessionsDialog(true)}
          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
        >
          Sign out all devices
        </Button>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordDialog(false)}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Sessions Alert Dialog */}
      <AlertDialog open={showClearSessionsDialog} onOpenChange={setShowClearSessionsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Sign out all devices?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all your login sessions and you'll need to log in again on all devices. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearingSessions}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearSessions}
              disabled={isClearingSessions}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClearingSessions ? "Clearing..." : "Yes, sign out all devices"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
