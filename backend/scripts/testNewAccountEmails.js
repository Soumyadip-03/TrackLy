const dotenv = require('dotenv');
const path = require('path');
const emailService = require('../utils/emailService');
const sendWelcomeEmail = require('../utils/sendWelcomeEmail');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

// Check if email is provided as command line argument
const recipientEmail = process.argv[2];
const name = process.argv[3] || 'Test User';

if (!recipientEmail) {
  console.error('Error: No recipient email provided');
  console.log('Usage: node testNewAccountEmails.js <recipient_email> [name]');
  process.exit(1);
}

// Validate email format
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
  console.error('Error: Invalid email format');
  process.exit(1);
}

console.log(`Testing new account emails for: ${recipientEmail} (${name})`);

// Simulate account details
const studentId = 'TEST' + Math.floor(10000 + Math.random() * 90000);
const currentSemester = Math.floor(1 + Math.random() * 8);
const timestamp = new Date().toLocaleString();

// Send both emails
async function sendTestEmails() {
  try {
    console.log('1. Sending welcome email...');
    const welcomeResult = await sendWelcomeEmail(recipientEmail, name);
    
    if (welcomeResult.success) {
      console.log('✓ Welcome email sent successfully!');
      console.log(`Message ID: ${welcomeResult.messageId}`);
    } else {
      console.error('✗ Failed to send welcome email');
      console.error(`Error: ${welcomeResult.error}`);
    }
    
    console.log('\n2. Sending account confirmation email...');
    
    // Create account confirmation notification
    const accountConfirmation = {
      title: 'TrackLy Account Created Successfully',
      message: `Hi ${name},<br><br>Your TrackLy account has been successfully created with the following details:<br><br>
        <ul>
          <li><strong>Email:</strong> ${recipientEmail}</li>
          <li><strong>Student ID:</strong> ${studentId}</li>
          <li><strong>Current Semester:</strong> ${currentSemester}</li>
          <li><strong>Account Created:</strong> ${timestamp}</li>
        </ul>
        <br>
        You can now log in to TrackLy and start tracking your attendance. If you have any questions or need assistance, please contact our support team.`
    };
    
    const confirmResult = await emailService.sendEmail(
      recipientEmail, 
      accountConfirmation.title, 
      accountConfirmation.message
    );
    
    if (confirmResult.success) {
      console.log('✓ Account confirmation email sent successfully!');
      console.log(`Message ID: ${confirmResult.messageId}`);
    } else {
      console.error('✗ Failed to send account confirmation email');
      console.error(`Error: ${confirmResult.error}`);
    }
    
    // Summary
    console.log('\n--- Summary ---');
    console.log(`Welcome Email: ${welcomeResult.success ? 'Sent ✓' : 'Failed ✗'}`);
    console.log(`Account Confirmation Email: ${confirmResult.success ? 'Sent ✓' : 'Failed ✗'}`);
    
  } catch (error) {
    console.error('✗ Error sending test emails:', error.message);
  } finally {
    process.exit(0);
  }
}

sendTestEmails(); 