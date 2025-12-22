/**
 * Simple script to send a welcome email to a user
 * Usage: node scripts/sendWelcome.js email@example.com
 */

const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

const emailService = require('../utils/emailService');

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address as a command line argument');
  console.log('Usage: node scripts/sendWelcome.js email@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('Invalid email format. Please provide a valid email address.');
  process.exit(1);
}

console.log('Email settings:');
console.log('- SMTP User:', process.env.EMAIL_USER);
console.log('- Email Service:', process.env.EMAIL_SERVICE);
console.log('- Target Email:', email);

// Check if required env variables are set
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('ERROR: Missing email credentials in config.env file.');
  console.error('Make sure EMAIL_USER and EMAIL_PASSWORD are set correctly.');
  process.exit(1);
}

// Create a welcome notification
const welcomeNotification = {
  title: 'Welcome to TrackLy',
  message: 'Thank you for joining TrackLy, your student attendance tracking companion! ' +
           'We\'re excited to help you stay on top of your attendance and academic goals. ' +
           'Start by setting up your subjects and schedule to get the most out of TrackLy.',
  createdAt: new Date()
};

console.log('Sending welcome email...');

// Alternative method to send email if emailService fails
const sendDirectEmail = async () => {
  try {
    console.log('Trying alternative direct email method...');
    
    // Create a transporter object
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Email content
    const mailOptions = {
      from: `"TrackLy" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: welcomeNotification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">TrackLy</h1>
            <p style="color: #666;">Student Attendance Tracking System</p>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">${welcomeNotification.title}</h2>
            <p style="color: #4b5563; line-height: 1.5;">${welcomeNotification.message}</p>
          </div>
          <div style="text-align: center; font-size: 12px; color: #9ca3af;">
            <p>© ${new Date().getFullYear()} TrackLy. All rights reserved.</p>
            <p>If you prefer not to receive these emails, you can change your notification settings in the TrackLy app.</p>
          </div>
        </div>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Direct email method succeeded!');
    console.log('Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Direct email method also failed:', error);
    return { success: false, error: error.message };
  }
};

// First try with the emailService
emailService.sendNotificationEmail(welcomeNotification, email)
  .then(result => {
    if (result.success) {
      console.log(`Welcome email sent successfully to ${email}`);
      console.log(`Message ID: ${result.messageId}`);
      process.exit(0);
    } else {
      console.error(`Failed with emailService: ${result.error}`);
      
      // Try alternative method if the first method fails
      return sendDirectEmail();
    }
  })
  .then(directResult => {
    if (directResult && directResult.success) {
      console.log('Email sent successfully using alternative method');
      process.exit(0);
    } else {
      console.error('\nTROUBLESHOOTING TIPS:');
      console.error('1. If using Gmail, make sure you have:');
      console.error('   - Enabled "Less secure app access" in Google account settings, OR');
      console.error('   - Created an App Password if you have 2-factor authentication enabled');
      console.error('2. Check that your EMAIL_USER and EMAIL_PASSWORD in config.env are correct');
      console.error('3. If you\'re using Gmail, try creating a new App Password specifically for this app');
      console.error('4. Make sure your Gmail account doesn\'t have additional security restrictions');
      
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 