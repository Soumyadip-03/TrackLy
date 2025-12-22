import { automatedEmailService } from './automated-email-service';
import { fetchWithAuth } from '../api';

/**
 * Utility to schedule and send emails based on attendance data
 */
export class EmailScheduler {
  static async sendWeeklyAttendanceUpdates(): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: any[];
  }> {
    try {
      console.log('Starting weekly attendance email updates');
      
      const response = await fetchWithAuth('/auth/me');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      const user = data.user;
      
      console.log(`Found user with email notifications enabled`);
      
      const results = {
        success: true,
        sent: 0,
        failed: 0,
        errors: [] as any[]
      };
      
      if (user) {
        try {
          const result = await automatedEmailService.sendAttendanceUpdateEmail(
            user.id, 
            'weekly'
          );
          
          if (result.success) {
            results.sent++;
            console.log(`Weekly report sent to ${user.email}`);
          } else {
            results.failed++;
            results.errors.push({
              userId: user.id,
              email: user.email,
              error: result.message
            });
            console.error(`Failed to send weekly report to ${user.email}: ${result.message}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            userId: user.id,
            email: user.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          console.error(`Error sending weekly report to ${user.id}:`, error);
        }
      }
      
      console.log(`Weekly email sending complete. Sent: ${results.sent}, Failed: ${results.failed}`);
      return results;
    } catch (error) {
      console.error('Error in weekly email scheduler:', error);
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  static async checkAndSendLowAttendanceAlerts(
    userId: string,
    threshold: number = 75
  ): Promise<{
    success: boolean;
    alertsSent: number;
    errors: any[];
  }> {
    try {
      console.log(`Checking low attendance alerts for user ${userId}`);
      
      const coursesResponse = await fetchWithAuth('/subject');
      
      if (!coursesResponse.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const coursesData = await coursesResponse.json();
      const courses = coursesData.data || [];
      
      const results = {
        success: true,
        alertsSent: 0,
        errors: [] as any[]
      };
      
      if (courses && courses.length > 0) {
        for (const course of courses) {
          try {
            const attendanceResponse = await fetchWithAuth(`/attendance?courseId=${course.id}`);
            
            if (!attendanceResponse.ok) {
              throw new Error('Failed to fetch attendance');
            }
            
            const attendanceData = await attendanceResponse.json();
            const attendance = attendanceData.data || [];
            
            if (attendance && attendance.length > 0) {
              const totalClasses = attendance.length;
              const presentClasses = attendance.filter((a: any) => a.status === 'present').length;
              const percentage = Math.round((presentClasses / totalClasses) * 100);
              
              if (percentage < threshold) {
                console.log(`Low attendance detected for ${course.courseName}: ${percentage}% (threshold: ${threshold}%)`);
                
                const result = await automatedEmailService.sendLowAttendanceAlert(
                  userId,
                  course.id,
                  percentage,
                  threshold
                );
                
                if (result.success) {
                  results.alertsSent++;
                  console.log(`Low attendance alert sent for course ${course.courseName}`);
                } else {
                  results.errors.push({
                    courseId: course.id,
                    courseName: course.courseName,
                    error: result.message
                  });
                  console.error(`Failed to send low attendance alert for ${course.courseName}: ${result.message}`);
                }
              }
            }
          } catch (error) {
            results.errors.push({
              courseId: course.id,
              courseName: course.courseName,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error(`Error checking attendance for course ${course.id}:`, error);
          }
        }
      }
      
      console.log(`Attendance check complete. Alerts sent: ${results.alertsSent}`);
      return results;
    } catch (error) {
      console.error('Error in attendance alert checker:', error);
      return {
        success: false,
        alertsSent: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

export default EmailScheduler;
