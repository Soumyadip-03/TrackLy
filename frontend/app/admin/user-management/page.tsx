"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AdminBadge } from '@/components/ui/admin-badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { ArrowPathIcon, UserPlusIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline'

interface UserData {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  role: string
  is_admin: boolean
}

export default function UserManagementPage() {
  const { user, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState('user')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // Only admins can list all users
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email:auth.users.email, created_at:auth.users.created_at, last_sign_in_at:auth.users.last_sign_in_at, role, is_admin')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching users:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch users. ' + error.message,
          variant: 'destructive',
        })
        return
      }
      
      setUsers(data || [])
    } catch (error) {
      console.error('Error in fetchUsers:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching users.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Create a new user
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }
    
    try {
      // First create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true
      })
      
      if (authError) {
        throw authError
      }
      
      if (!authData.user) {
        throw new Error('User creation failed')
      }
      
      // Then create or update the profile with role
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: authData.user.id,
          email: newUserEmail,
          role: newUserRole,
          is_admin: newUserRole === 'admin',
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        throw profileError
      }
      
      toast({
        title: 'Success',
        description: `User ${newUserEmail} created successfully.`,
      })
      
      // Reset form
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('user')
      
      // Refresh user list
      fetchUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast({
        title: 'Error',
        description: `Failed to create user: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      })
    }
  }

  // Toggle admin status
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_admin: !currentStatus,
          role: !currentStatus ? 'admin' : 'user',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_admin: !currentStatus, role: !currentStatus ? 'admin' : 'user' } 
          : user
      ))
      
      toast({
        title: 'Success',
        description: `User admin status updated successfully.`,
      })
    } catch (error: any) {
      console.error('Error toggling admin status:', error)
      toast({
        title: 'Error',
        description: `Failed to update admin status: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      })
    }
  }

  // Delete a user
  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    
    try {
      // Delete user from auth system
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        throw authError
      }
      
      // Remove from local state
      setUsers(users.filter(user => user.id !== userId))
      
      toast({
        title: 'Success',
        description: 'User deleted successfully.',
      })
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: 'Error',
        description: `Failed to delete user: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      })
    }
  }

  // Load users on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers()
    }
  }, [isAuthenticated])

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            User Management <AdminBadge className="ml-2" />
          </h1>
          <p className="text-muted-foreground">Manage user accounts and permissions.</p>
        </div>
        <Button onClick={fetchUsers} size="sm" variant="outline" className="flex gap-2">
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User List</TabsTrigger>
          <TabsTrigger value="create">Create User</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                View and manage all users in the system.
              </CardDescription>
              <Input 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex justify-center py-8 text-muted-foreground">
                  No users found.
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Sign In</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {user.last_sign_in_at 
                              ? new Date(user.last_sign_in_at).toLocaleDateString() 
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Switch 
                              checked={user.is_admin}
                              onCheckedChange={() => toggleAdminStatus(user.id, user.is_admin)}
                              disabled={user.id === user?.id} // Can't change own admin status
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteUser(user.id)}
                              disabled={user.id === user?.id} // Can't delete own account
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>
                Add a new user to the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createUser} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUserRole}
                    onValueChange={setNewUserRole}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full flex gap-2">
                  <UserPlusIcon className="h-5 w-5" />
                  Create User
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
