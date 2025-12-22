'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { supabase } from '@/lib/supabase/client';
import { saveToLocalStorage } from '@/lib/storage-utils';
import { Shield, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error('Invalid admin credentials');
      }

      // Check if the user has admin role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        throw new Error('Could not verify admin status');
      }

      // If not an admin, update the role to admin
      if (profileData.role !== 'admin') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', authData.user.id);

        if (updateError) {
          throw new Error('Failed to set admin privileges');
        }
      }

      // Store admin status in local storage
      saveToLocalStorage('is_admin', true);
      
      // Set the admin flag in the user profile data
      try {
        const userProfileData = JSON.parse(localStorage.getItem('user_profile') || '{}');
        userProfileData.role = 'admin';
        saveToLocalStorage('user_profile', userProfileData);
      } catch (error) {
        console.error('Error updating user profile in localStorage:', error);
        // Continue even if local storage update fails
      }

      toast({
        title: "Admin Login Successful",
        description: "You are now logged in as an administrator.",
      });

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        title: "Login Failed",
        description: "Invalid admin credentials or insufficient permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-purple-100 p-3 rounded-full">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your admin credentials to access the TrackLy admin panel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAdminLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <LoadingButton
              type="submit"
              loading={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Lock className="mr-2 h-4 w-4" />
              Sign in as Admin
            </LoadingButton>
            <div className="text-center text-sm">
              <Link 
                href="/login" 
                className="text-purple-600 hover:text-purple-800 underline underline-offset-4"
              >
                Return to regular login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
