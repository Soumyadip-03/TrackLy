'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { getFromLocalStorage } from '@/lib/storage-utils';
import { useAuth } from '@/lib/auth-context';
import { Shield, Users, Bell, Mail, Database } from 'lucide-react';

export default function AdminPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Check admin role from localStorage
        const profile = getFromLocalStorage('user_profile', {});
        const adminRole = getFromLocalStorage('user_role', 'user');
        
        setUserProfile(profile);
        setIsAdmin(adminRole === 'admin');
        
        // Get user count from backend if admin
        if (adminRole === 'admin') {
          try {
            const token = localStorage.getItem('trackly_token');
            const response = await fetch('http://localhost:5000/api/admin/users/count', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              setUserCount(data.count || 0);
            }
          } catch (err) {
            console.error('Error fetching user count:', err);
          }
        }
      } catch (error) {
        console.error('Error in admin page:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader 
        title="Admin Dashboard" 
        description="Manage system settings and user accounts"
      />
      
      {!isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You don't have admin privileges. Please use the admin login to access this area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The admin dashboard provides access to:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>User management</li>
              <li>System-wide email settings</li>
              <li>Application configuration</li>
              <li>Analytics and reporting</li>
            </ul>
            <Button 
              onClick={() => window.location.href = '/admin-login'}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Shield className="mr-2 h-4 w-4" />
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="mr-2 text-indigo-600" />
                  <div className="text-2xl font-bold">{userCount}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Your Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Shield className="mr-2 text-purple-600" />
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                    Administrator
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Email Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Mail className="mr-2 text-green-600" />
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Database className="mr-2 text-blue-600" />
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    Connected
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="users">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="emails">Email Settings</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">User Management</h2>
              <p className="mb-4">Here you can manage all TrackLy users, their roles, and permissions.</p>
              
              <div className="flex justify-end mb-4">
                <Button>View All Users</Button>
              </div>
              
              <div className="border rounded-md p-6 bg-gray-50">
                <p className="text-center text-gray-500">User management features will be available soon.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="emails" className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Email Configuration</h2>
              <p className="mb-4">Configure system-wide email templates and notification settings.</p>
              
              <div className="border rounded-md p-6 bg-gray-50">
                <p className="text-center text-gray-500">Email configuration features will be available soon.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="reports" className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">System Reports</h2>
              <p className="mb-4">View and export system-wide reports and analytics.</p>
              
              <div className="border rounded-md p-6 bg-gray-50">
                <p className="text-center text-gray-500">Reporting features will be available soon.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">System Settings</h2>
              <p className="mb-4">Configure global application settings.</p>
              
              <div className="border rounded-md p-6 bg-gray-50">
                <p className="text-center text-gray-500">System settings features will be available soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
