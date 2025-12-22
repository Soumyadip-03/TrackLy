const dotenv = require('dotenv');
const path = require('path');
const emailService = require('../utils/emailService');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

// Check if email is provided as command line argument
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('Error: No recipient email provided');
  console.log('Usage: node sendTestEmail.js <recipient_email>');
  process.exit(1);
}

// Validate email format
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
  console.error('Error: Invalid email format');
  process.exit(1);
}

console.log(`Sending test email to: ${recipientEmail}`);

// Create a test notification
const testNotification = {
  title: 'TrackLy Email Test',
  message: `This is a test email from TrackLy sent at ${new Date().toLocaleString()}.
  <br><br>
  If you received this email, your email configuration is working correctly!
  <br><br>
  <ul>
    <li>Email service: ${process.env.EMAIL_SERVICE || 'gmail'}</li>
    <li>Sender: ${process.env.EMAIL_USER}</li>
    <li>Test time: ${new Date().toLocaleString()}</li>
  </ul>`
};

// Send the test email
async function sendTest() {
  try {
    const result = await emailService.sendNotificationEmail(testNotification, recipientEmail);
    
    if (result.success) {
      console.log('✓ Test email sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
    } else {
      console.error('✗ Failed to send test email');
      console.error(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('✗ Error sending test email:', error.message);
  } finally {
    process.exit(0);
  }
}

sendTest(); 