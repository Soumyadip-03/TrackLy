'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import useToastNotification from '@/hooks/use-toast-notification';
import { useAuth } from '@/lib/auth-context';
import { CalendarCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getFromLocalStorage } from '@/lib/storage-utils';

export default function WeeklyReportButton({ userId }: { userId?: string }) {
  const [loading, setLoading] = useState(false);
  const toast = useToastNotification();
  const router = useRouter();
  const { user } = useAuth();
  
  const handleSendWeeklyReport = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        toast.error('You must be logged in to send a weekly report');
        return;
      }
      
      // Get attendance records and profile from localStorage
      const attendanceRecords = getFromLocalStorage('attendance_records', []);
      const profile = getFromLocalStorage('user_profile', {});
      const token = localStorage.getItem('trackly_token');
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      // Send email via backend API
      const response = await fetch('http://localhost:5000/api/email/weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user.email,
          name: profile.name || 'Student',
          attendanceData: attendanceRecords
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Weekly attendance report sent to your email');
      } else {
        throw new Error(result.message || 'Failed to send report');
      }
    } catch (error) {
      console.error('Failed to send weekly report:', error);
      
      if (error instanceof Error) {
        toast.error(`Failed to send weekly report: ${error.message}`);
      } else {
        toast.error('Failed to send weekly report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <LoadingButton
      onClick={handleSendWeeklyReport}
      loading={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
    >
      <CalendarCheck size={18} className="mr-2" />
      Send Weekly Report
    </LoadingButton>
  );
}
