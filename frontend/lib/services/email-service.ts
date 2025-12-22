export interface EmailData {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

/**
 * Service for sending emails from the TrackLy system
 */
export class EmailService {
  private apiEndpoint: string;
  private apiKey: string;

  constructor() {
    this.apiEndpoint = process.env.NEXT_PUBLIC_EMAIL_API_ENDPOINT || '/api/email';
    this.apiKey = process.env.NEXT_PUBLIC_EMAIL_API_KEY || '';
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      await response.json();
      return { success: true, message: 'Email sent successfully' };
    } catch (error: any) {
      console.error('Email sending error:', error);
      return { success: false, message: error.message || 'Failed to send email' };
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<{ success: boolean; message: string }> {
    const subject = 'Welcome to TrackLy - Your Attendance Tracking Solution';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://trackly.app/logo.png" alt="TrackLy Logo" style="max-width: 150px;">
        </div>
        
        <h1 style="color: #4f46e5; text-align: center;">Welcome to TrackLy!</h1>
        
        <p>Hello ${name},</p>
        
        <p>Thank you for joining TrackLy, your all-in-one solution for tracking and managing your academic attendance.</p>
        
        <p>With TrackLy, you can:</p>
        
        <ul style="list-style-type: none; padding-left: 0;">
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; color: #4f46e5;">✓</span> Track your attendance for all courses
          </li>
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; color: #4f46e5;">✓</span> Get real-time attendance percentage calculations
          </li>
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; color: #4f46e5;">✓</span> Receive notifications for low attendance
          </li>
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; color: #4f46e5;">✓</span> Manage your academic schedule efficiently
          </li>
        </ul>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Getting Started:</p>
          <p style="margin-top: 10px;">Log in to your account and set up your courses to start tracking your attendance right away!</p>
        </div>
        
        <p>If you have any questions or need assistance, feel free to reply to this email or contact our support team.</p>
        
        <p>Best regards,<br>The TrackLy Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666; text-align: center;">
          <p>© ${new Date().getFullYear()} TrackLy. All rights reserved.</p>
          <p>You're receiving this email because you recently created a new TrackLy account.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      body,
      isHtml: true,
      from: 'noreply@trackly.app',
      replyTo: 'support@trackly.app'
    });
  }

  async sendAttendanceNotificationEmail(
    email: string,
    name: string,
    courseName: string,
    attendancePercentage: number
  ): Promise<{ success: boolean; message: string }> {
    const isLow = attendancePercentage < 75;
    const subject = `${isLow ? 'Low Attendance Alert' : 'Attendance Update'} - ${courseName}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://trackly.app/logo.png" alt="TrackLy Logo" style="max-width: 150px;">
        </div>
        
        <h1 style="color: ${isLow ? '#ef4444' : '#4f46e5'}; text-align: center;">
          ${isLow ? 'Attendance Alert' : 'Attendance Update'}
        </h1>
        
        <p>Hello ${name},</p>
        
        <p>This is an update regarding your attendance for <strong>${courseName}</strong>.</p>
        
        <div style="background-color: ${isLow ? '#fee2e2' : '#f3f4f6'}; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="font-size: 18px; margin: 0;">Your current attendance percentage is:</p>
          <p style="font-size: 36px; font-weight: bold; margin: 10px 0; color: ${isLow ? '#ef4444' : '#4f46e5'};">
            ${attendancePercentage}%
          </p>
          ${isLow ? '<p style="margin: 0; color: #ef4444; font-weight: bold;">This is below the required 75% threshold.</p>' : ''}
        </div>
        
        ${isLow ? `
        <p>To improve your attendance:</p>
        
        <ul style="list-style-type: none; padding-left: 0;">
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; color: #4f46e5;">•</span> Ensure you attend all upcoming classes
          </li>
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; color: #4f46e5;">•</span> Set reminders for class timings
          </li>
          <li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
            <span style="position: absolute; left: 0; color: #4f46e5;">•</span> Speak with your professor if you have any concerns
          </li>
        </ul>
        ` : ''}
        
        <p>You can view detailed attendance records by logging into your TrackLy account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://trackly.app/dashboard" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Dashboard
          </a>
        </div>
        
        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        
        <p>Best regards,<br>The TrackLy Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666; text-align: center;">
          <p>© ${new Date().getFullYear()} TrackLy. All rights reserved.</p>
          <p>You can manage your email notification preferences in your account settings.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      body,
      isHtml: true,
      from: 'notifications@trackly.app',
      replyTo: 'support@trackly.app'
    });
  }
}

export const emailService = new EmailService();
export default emailService;
