'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import useToastNotification from '@/hooks/use-toast-notification';
import { Shield } from 'lucide-react';
import { saveToLocalStorage } from '@/lib/storage-utils';
import { fetchWithAuth } from '@/lib/api';

export default function SetAdminRoleButton() {
  const [loading, setLoading] = useState(false);
  const toast = useToastNotification();
  
  const promoteToAdmin = async () => {
    try {
      setLoading(true);
      
      const response = await fetchWithAuth('/auth/promote-admin', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.role === 'admin') {
          const userProfileData = JSON.parse(localStorage.getItem('user_profile') || '{}');
          userProfileData.role = 'admin';
          saveToLocalStorage('user_profile', userProfileData);
          
          toast.success('You are now an admin!');
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        throw new Error('Failed to promote to admin');
      }
    } catch (error) {
      console.error('Failed to set admin role:', error);
      toast.error(`Failed to set admin role: ${error instanceof Error ? error.message : 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <LoadingButton
      onClick={promoteToAdmin}
      loading={loading}
      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
    >
      <Shield size={18} className="mr-2" />
      Set Current Account as Admin
    </LoadingButton>
  );
}
