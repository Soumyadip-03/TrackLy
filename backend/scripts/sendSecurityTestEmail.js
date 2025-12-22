const dotenv = require('dotenv');
const path = require('path');
const emailService = require('../utils/emailService');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

// Check if email is provided as command line argument
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('Error: No recipient email provided');
  console.log('Usage: node sendSecurityTestEmail.js <recipient_email>');
  process.exit(1);
}

// Validate email format
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
  console.error('Error: Invalid email format');
  process.exit(1);
}

console.log(`Sending security test email to: ${recipientEmail}`);

// Create a test security notification
const securityNotification = {
  title: 'Security Alert: Test Login',
  message: 'This is a test of the TrackLy security alert system.'
};

// Simulate login metadata
const metadata = {
  ipAddress: '192.168.1.1 (Test IP)',
  device: 'Test Device',
  browser: 'Test Browser',
  time: new Date().toLocaleString(),
  location: 'Test Location (not your actual location)'
};

// Send the test security email
async function sendSecurityTest() {
  try {
    console.log('Sending security email with the following metadata:');
    console.log(JSON.stringify(metadata, null, 2));
    
    const result = await emailService.sendSecurityEmail(
      securityNotification, 
      recipientEmail,
      metadata
    );
    
    if (result.success) {
      console.log('✓ Security test email sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
    } else {
      console.error('✗ Failed to send security test email');
      console.error(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('✗ Error sending security test email:', error.message);
  } finally {
    process.exit(0);
  }
}

sendSecurityTest(); 