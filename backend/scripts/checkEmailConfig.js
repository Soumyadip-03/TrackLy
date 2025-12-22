const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

console.log('TrackLy Email Configuration Checker');
console.log('===================================');

// Check if required environment variables are set
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const emailService = process.env.EMAIL_SERVICE || 'gmail';

console.log('\nEnvironment Variables:');
console.log(`EMAIL_SERVICE: ${emailService ? '✓ Set' : '✗ Not set'}`);
console.log(`EMAIL_USER: ${emailUser ? '✓ Set' : '✗ Not set'}`);
console.log(`EMAIL_PASSWORD: ${emailPassword ? '✓ Set (length: ' + emailPassword.length + ')' : '✗ Not set'}`);

// Function to validate Gmail addresses
const isValidGmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
};

// Check if Gmail-specific configuration is valid
if (emailService.toLowerCase() === 'gmail') {
  console.log('\nGmail-specific checks:');
  
  if (!emailUser) {
    console.log('✗ EMAIL_USER is not set. Please set a valid Gmail address.');
  } else if (!isValidGmail(emailUser)) {
    console.log(`✗ EMAIL_USER (${emailUser}) is not a valid Gmail address.`);
  } else {
    console.log(`✓ EMAIL_USER (${emailUser}) is a valid Gmail address.`);
  }
  
  if (!emailPassword) {
    console.log('✗ EMAIL_PASSWORD is not set. Please set an App Password.');
  } else if (emailPassword.length !== 16 && !emailPassword.includes(' ')) {
    console.log(`⚠ EMAIL_PASSWORD length (${emailPassword.length}) suggests it might not be a Gmail App Password.`);
    console.log('  Gmail App Passwords are typically 16 characters with no spaces.');
  } else {
    console.log('✓ EMAIL_PASSWORD appears to be in the correct format for a Gmail App Password.');
  }
  
  console.log('\nReminder: For Gmail, you need to:');
  console.log('1. Enable 2-Step Verification in your Google Account');
  console.log('2. Generate an App Password specifically for TrackLy');
  console.log('3. Use that 16-character App Password (without spaces) as EMAIL_PASSWORD');
}

// Test email connection
console.log('\nTesting connection to email server...');

async function testEmailConnection() {
  if (!emailUser || !emailPassword) {
    console.log('✗ Cannot test connection: Missing email credentials');
    return;
  }
  
  try {
    let transporter;
    
    if (emailService.toLowerCase() === 'gmail') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      });
    }
    
    // Verify connection
    await transporter.verify();
    console.log('✓ Successfully connected to email server!');
    console.log(`✓ TrackLy is ready to send emails from: ${emailUser}`);
  } catch (error) {
    console.log('✗ Failed to connect to email server');
    console.log(`  Error: ${error.message}`);
    
    if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
      console.log('\nCommon authentication issues:');
      console.log('- Check that your email address is correct');
      console.log('- For Gmail: Make sure you\'re using an App Password, not your regular password');
      console.log('- For Gmail: Ensure 2-Step Verification is enabled on your Google account');
      console.log('- Check for typos in your password');
    }
  }
}

testEmailConnection(); 