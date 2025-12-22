const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config/config.env' });

/**
 * Email service for sending notifications to users
 */
class EmailService {
  constructor() {
    this.createTransporter();
  }

  /**
   * Create the nodemailer transporter with appropriate configuration
   */
  createTransporter() {
    const emailConfig = {
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    console.log(`Configuring email service with: ${process.env.EMAIL_SERVICE}`);
    
    // For Gmail specifically
    if ((process.env.EMAIL_SERVICE || '').toLowerCase() === 'gmail') {
      console.log('Using Gmail configuration');
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      // For other email services using SMTP
      this.transporter = nodemailer.createTransport(emailConfig);
    }
  }

  /**
   * Send email notification to a user
   * @param {String} recipient - Email address of the recipient
   * @param {String} subject - Email subject
   * @param {String} message - Email body content
   * @param {Object} options - Additional options for the email
   * @returns {Promise} - Result of email sending
   */
  async sendEmail(recipient, subject, message, options = {}) {
    // Make sure we have valid credentials before attempting to send
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Missing email credentials. Check EMAIL_USER and EMAIL_PASSWORD in .env file.');
      return { 
        success: false, 
        error: 'Email configuration is incomplete. Contact administrator.' 
      };
    }

    try {
      const mailOptions = {
        from: `"TrackLy" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #3b82f6;">TrackLy</h1>
              <p style="color: #666;">Student Attendance Tracking System</p>
            </div>
            <div style="background-color: ${options.isSecurityAlert ? '#fff8f8' : '#f9fafb'}; padding: 15px; border-radius: 5px; margin-bottom: 20px; ${options.isSecurityAlert ? 'border-left: 4px solid #ef4444;' : ''}">
              <h2 style="color: ${options.isSecurityAlert ? '#b91c1c' : '#1f2937'}; margin-top: 0;">${subject}</h2>
              <p style="color: #4b5563; line-height: 1.5;">${message}</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: #9ca3af;">
              <p>© ${new Date().getFullYear()} TrackLy. All rights reserved.</p>
              <p>If you prefer not to receive these emails, you can change your notification settings in the TrackLy app.</p>
            </div>
          </div>
        `,
        ...options
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      
      // Check for common authentication errors
      if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
        console.error('Authentication failed. Check your email credentials.');
        // Try to recreate transporter for next attempt
        this.createTransporter();
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a notification as email
   * @param {Object} notification - Notification object
   * @param {String} email - User's email address
   */
  async sendNotificationEmail(notification, email) {
    return this.sendEmail(
      email,
      notification.title,
      notification.message
    );
  }
  
  /**
   * Send a security notification (login, password change, etc.)
   * @param {Object} notification - Security notification object
   * @param {String} email - User's email address
   * @param {Object} metadata - Additional security metadata
   */
  async sendSecurityEmail(notification, email, metadata = {}) {
    // Enhance the message with security details
    let enhancedMessage = notification.message;
    
    if (metadata.ipAddress) {
      enhancedMessage += `<br><br><strong>IP Address:</strong> ${metadata.ipAddress}`;
    }
    
    if (metadata.location) {
      enhancedMessage += `<br><strong>Location:</strong> ${metadata.location}`;
    }
    
    if (metadata.device) {
      enhancedMessage += `<br><strong>Device:</strong> ${metadata.device}`;
    }
    
    if (metadata.browser) {
      enhancedMessage += `<br><strong>Browser:</strong> ${metadata.browser}`;
    }
    
    if (metadata.time) {
      enhancedMessage += `<br><strong>Time:</strong> ${metadata.time}`;
    }
    
    // Add security advice if this is a login alert
    if (notification.title.toLowerCase().includes('login')) {
      enhancedMessage += `
        <br><br>
        <strong>Was this you?</strong>
        <br>
        If you did not perform this action, please:
        <ol>
          <li>Change your password immediately</li>
          <li>Enable two-factor authentication if available</li>
          <li>Contact support if you need assistance</li>
        </ol>
      `;
    }
    
    return this.sendEmail(
      email,
      notification.title,
      enhancedMessage,
      { isSecurityAlert: true, priority: 'high' }
    );
  }
  
  /**
   * Send a daily digest of notifications
   * @param {String} email - User's email address
   * @param {Array} notifications - List of notifications
   */
  async sendDigest(email, notifications, digestType = 'daily') {
    if (!notifications || notifications.length === 0) {
      return { success: false, error: 'No notifications to send' };
    }
    
    const timeframe = digestType === 'daily' ? 'Today' : 'This Week';
    const subject = `TrackLy ${digestType.charAt(0).toUpperCase() + digestType.slice(1)} Digest`;
    
    let notificationsList = '';
    notifications.forEach(notif => {
      notificationsList += `
        <div style="padding: 10px; border-bottom: 1px solid #eaeaea;">
          <h3 style="color: #1f2937; margin-top: 0;">${notif.title}</h3>
          <p style="color: #4b5563;">${notif.message}</p>
          <p style="color: #9ca3af; font-size: 12px;">
            ${new Date(notif.createdAt || notif.date).toLocaleString()}
          </p>
        </div>
      `;
    });
    
    const message = `
      <div>
        <p>Here's a summary of your notifications from ${timeframe}:</p>
        <div style="border: 1px solid #eaeaea; border-radius: 5px; margin-top: 15px;">
          ${notificationsList}
        </div>
        <p style="margin-top: 20px;">Log in to your TrackLy account to view more details.</p>
      </div>
    `;
    
    return this.sendEmail(email, subject, message);
  }
}

// Create and export a singleton instance
const emailService = new EmailService();
module.exports = emailService; 