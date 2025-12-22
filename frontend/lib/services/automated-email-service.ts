import { EmailService } from './email-service';
import { fetchWithAuth } from '../api';

/**
 * Service for sending automated emails based on user events and preferences
 */
export class AutomatedEmailService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async sendWelcomeEmail(email: string, name: string, additionalInfo?: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Sending welcome email to new user: ${email}`);
      
      const currentDate = new Date();
      const academicYear = `${currentDate.getFullYear()}-${currentDate.getFullYear() + 1}`;
      
      const subject = '🎓 Welcome to TrackLy - Your Academic Success Partner';
      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://trackly.app/logo.png" alt="TrackLy Logo" style="max-width: 150px;">
          </div>
          
          <h1 style="color: #4f46e5; text-align: center;">Welcome to TrackLy!</h1>
          
          <p>Hello ${name},</p>
          
          <p>Welcome to TrackLy for the ${academicYear} academic year! We're excited to have you on board. TrackLy is your all-in-one solution for tracking and managing your academic attendance and performance.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #4f46e5; margin-top: 0;">What TrackLy Offers:</h2>
            <ul style="list-style-type: none; padding-left: 0;">
              <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #4f46e5;">✓</span> <strong>Real-time Attendance Tracking:</strong> Monitor your attendance across all courses
              </li>
              <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #4f46e5;">✓</span> <strong>Smart Notifications:</strong> Get alerts when your attendance drops below required thresholds
              </li>
              <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #4f46e5;">✓</span> <strong>Performance Analytics:</strong> Visualize your attendance patterns and academic progress
              </li>
              <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #4f46e5;">✓</span> <strong>AI Assistant:</strong> Get personalized advice on improving your academic performance
              </li>
            </ul>
          </div>
          
          <h2 style="color: #4f46e5;">Getting Started:</h2>
          <ol>
            <li><strong>Complete Your Profile:</strong> Add your courses and academic details</li>
            <li><strong>Set Your Notification Preferences:</strong> Choose how and when you want to be notified</li>
            <li><strong>Start Tracking:</strong> Begin recording your attendance for each class</li>
          </ol>
          
          <div style="margin-top: 30px; background-color: #4f46e5; color: white; padding: 15px; border-radius: 5px; text-align: center;">
            <p style="margin: 0; font-size: 18px;"><strong>Need Help?</strong></p>
            <p style="margin-top: 10px;">Our support team is always ready to assist you at <a href="mailto:support@trackly.app" style="color: white;">support@trackly.app</a></p>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br>The TrackLy Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666; text-align: center;">
            <p>© ${new Date().getFullYear()} TrackLy. All rights reserved.</p>
            <p>You're receiving this email because you recently created a new TrackLy account.</p>
          </div>
        </div>
      `;
      
      const result = await this.emailService.sendEmail({
        to: email,
        subject,
        body,
        isHtml: true,
        from: 'noreply@trackly.app',
        replyTo: 'support@trackly.app'
      });
      
      return result;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error sending welcome email' };
    }
  }

  async sendAttendanceUpdateEmail(userId: string, frequency: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetchWithAuth(`/auth/me`);
      
      if (!response.ok) {
        return { success: false, message: 'Failed to get user profile' };
      }
      
      const data = await response.json();
      const profile = data.user;
      
      if (!profile) {
        return { success: false, message: 'User profile not found' };
      }
      
      const attendanceResponse = await fetchWithAuth('/attendance');
      const attendanceData = attendanceResponse.ok ? await attendanceResponse.json() : { data: [] };
      
      const attendanceStats = this.processAttendanceData(attendanceData.data || []);
      
      let subject = '';
      switch (frequency) {
        case 'daily':
          subject = `📊 Your Daily Attendance Update - ${new Date().toLocaleDateString()}`;
          break;
        case 'weekly':
          subject = `📊 Your Weekly Attendance Summary - Week of ${this.getWeekStartDate()}`;
          break;
        case 'monthly':
          subject = `📊 Your Monthly Attendance Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;
          break;
      }
      
      const body = this.generateAttendanceEmailBody(profile, attendanceStats, frequency);
      
      const result = await this.emailService.sendEmail({
        to: profile.email,
        subject,
        body,
        isHtml: true,
        from: 'notifications@trackly.app',
        replyTo: 'support@trackly.app'
      });
      
      return result;
    } catch (error) {
      console.error('Error sending attendance update email:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error sending attendance update' };
    }
  }

  async sendLowAttendanceAlert(userId: string, courseId: string, currentPercentage: number, threshold: number = 75): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetchWithAuth(`/auth/me`);
      
      if (!response.ok) {
        return { success: false, message: 'Failed to get user profile' };
      }
      
      const data = await response.json();
      const profile = data.user;
      
      if (!profile) {
        return { success: false, message: 'User profile not found' };
      }
      
      const courseResponse = await fetchWithAuth(`/subject/${courseId}`);
      const courseData = courseResponse.ok ? await courseResponse.json() : null;
      const course = courseData?.data;
      
      if (!course) {
        return { success: false, message: 'Course not found' };
      }
      
      const subject = `⚠️ Low Attendance Alert: ${course.courseName || course.name}`;
      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://trackly.app/logo.png" alt="TrackLy Logo" style="max-width: 150px;">
          </div>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px;">
            <h1 style="color: #ef4444; margin-top: 0;">Attendance Alert</h1>
            <p style="font-size: 16px;">Your attendance in <strong>${course.courseName || course.name}</strong> has fallen below the required threshold.</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>Current Attendance:</strong> <span style="color: ${currentPercentage < threshold ? '#ef4444' : '#10b981'};">${currentPercentage}%</span></p>
            <p style="margin: 10px 0 0;"><strong>Required Threshold:</strong> ${threshold}%</p>
            
            <div style="margin-top: 15px; background-color: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
              <div style="background-color: ${currentPercentage < threshold ? '#ef4444' : '#10b981'}; width: ${currentPercentage}%; height: 100%;"></div>
            </div>
          </div>
          
          <h2 style="color: #4f46e5;">What You Can Do:</h2>
          <ul>
            <li>Ensure you attend all upcoming classes for this course</li>
            <li>Check if any attendance records are missing or incorrect</li>
            <li>Speak with your professor if you have any concerns</li>
            <li>Consider setting up daily reminders in the TrackLy app</li>
          </ul>
          
          <p>Remember, maintaining good attendance is crucial for your academic success!</p>
          
          <div style="margin-top: 30px; background-color: #4f46e5; color: white; padding: 15px; border-radius: 5px; text-align: center;">
            <a href="https://trackly.app/dashboard" style="color: white; text-decoration: none; font-weight: bold;">View Your Attendance Dashboard</a>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br>The TrackLy Team</p>
        </div>
      `;
      
      const result = await this.emailService.sendEmail({
        to: profile.email,
        subject,
        body,
        isHtml: true,
        from: 'alerts@trackly.app',
        replyTo: 'support@trackly.app'
      });
      
      return result;
    } catch (error) {
      console.error('Error sending low attendance alert:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error sending attendance alert' };
    }
  }

  private processAttendanceData(attendanceData: any[]): any {
    const courseAttendance: Record<string, { present: number; total: number; courseName: string }> = {};
    
    attendanceData.forEach(record => {
      if (!courseAttendance[record.courseId]) {
        courseAttendance[record.courseId] = {
          present: 0,
          total: 0,
          courseName: record.courseName || `Course ${record.courseId}`
        };
      }
      
      courseAttendance[record.courseId].total++;
      if (record.status === 'present') {
        courseAttendance[record.courseId].present++;
      }
    });
    
    const courses = Object.keys(courseAttendance).map(courseId => {
      const course = courseAttendance[courseId];
      const percentage = course.total > 0 ? Math.round((course.present / course.total) * 100) : 0;
      const atRisk = percentage < 75;
      
      return {
        courseId,
        courseName: course.courseName,
        present: course.present,
        total: course.total,
        percentage,
        atRisk
      };
    });
    
    const totalClasses = courses.reduce((sum, course) => sum + course.total, 0);
    const totalPresent = courses.reduce((sum, course) => sum + course.present, 0);
    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
    const coursesAtRisk = courses.filter(course => course.atRisk);
    
    return {
      courses,
      overallPercentage,
      totalClasses,
      totalPresent,
      coursesAtRisk,
      hasCourseAtRisk: coursesAtRisk.length > 0
    };
  }

  private generateAttendanceEmailBody(profile: any, stats: any, frequency: string): string {
    const userName = profile.fullName || profile.name || profile.email.split('@')[0];
    const periodText = frequency === 'daily' ? 'Today' : frequency === 'weekly' ? 'This Week' : 'This Month';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://trackly.app/logo.png" alt="TrackLy Logo" style="max-width: 150px;">
        </div>
        
        <h1 style="color: #4f46e5; text-align: center;">Your ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Attendance Report</h1>
        
        <p>Hello ${userName},</p>
        
        <p>Here's your attendance summary for ${periodText.toLowerCase()}:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #4f46e5;">Overall Attendance</h2>
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="width: 100px; height: 100px; border-radius: 50%; background-color: #e5e7eb; position: relative; margin-right: 20px;">
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; font-weight: bold; color: ${stats.overallPercentage >= 75 ? '#10b981' : '#ef4444'};">
                ${stats.overallPercentage}%
              </div>
            </div>
            <div>
              <p style="margin: 0;"><strong>Classes Attended:</strong> ${stats.totalPresent} of ${stats.totalClasses}</p>
              <p style="margin: 5px 0 0;"><strong>Status:</strong> 
                <span style="color: ${stats.overallPercentage >= 75 ? '#10b981' : '#ef4444'}; font-weight: bold;">
                  ${stats.overallPercentage >= 75 ? 'Good Standing' : 'Needs Improvement'}
                </span>
              </p>
            </div>
          </div>
        </div>
        
        ${stats.hasCourseAtRisk ? `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px;">
          <h2 style="color: #ef4444; margin-top: 0;">Courses Needing Attention</h2>
          <p>The following courses have attendance below the required threshold:</p>
          <ul>
            ${stats.coursesAtRisk.map((course: any) => `
              <li><strong>${course.courseName}:</strong> ${course.percentage}% (${course.present}/${course.total} classes)</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
        
        <h2 style="color: #4f46e5;">Course Breakdown</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Course</th>
              <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Attendance</th>
              <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${stats.courses.map((course: any) => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${course.courseName}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${course.percentage}% (${course.present}/${course.total})</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb; color: ${course.percentage >= 75 ? '#10b981' : '#ef4444'};">
                  ${course.percentage >= 75 ? '✓ Good' : '⚠️ At Risk'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; background-color: #4f46e5; color: white; padding: 15px; border-radius: 5px; text-align: center;">
          <a href="https://trackly.app/dashboard" style="color: white; text-decoration: none; font-weight: bold;">View Detailed Attendance Dashboard</a>
        </div>
        
        <p style="margin-top: 30px;">Keep up the good work!</p>
        <p>Best regards,<br>The TrackLy Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666;">
          <p>You're receiving this email based on your notification preferences. <a href="https://trackly.app/settings/notifications">Update preferences</a></p>
          <p>© ${new Date().getFullYear()} TrackLy. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  private getWeekStartDate(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    return startOfWeek.toLocaleDateString();
  }
}

export const automatedEmailService = new AutomatedEmailService();
