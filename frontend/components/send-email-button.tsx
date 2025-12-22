'use client';

import { useState } from 'react';
import { sendEmailToCurrentUser } from '@/lib/api';
import useToastNotification from '@/hooks/use-toast-notification';

export default function SendEmailButton() {
  const [loading, setLoading] = useState(false);
  const toast = useToastNotification();

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      // Example subject and message
      const subject = 'Your TrackLy Attendance Summary';
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #4f46e5; text-align: center;">Attendance Summary</h1>
          
          <p>Hello,</p>
          
          <p>Here's your current attendance summary:</p>
          
          <ul>
            <li>Overall Attendance: <strong>87.5%</strong></li>
            <li>Courses at Risk: <strong>None</strong></li>
            <li>Last Class Attended: <strong>Data Structures - Yesterday</strong></li>
          </ul>
          
          <p>Keep up the good work!</p>
          
          <p>Best regards,<br>The TrackLy Team</p>
        </div>
      `;
      
      const result = await sendEmailToCurrentUser(subject, message);
      
      if (result.success) {
        toast.success('Your attendance summary has been sent to your email.');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSendEmail}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
      ) : null}
      Send Attendance Summary Email
    </button>
  );
}
