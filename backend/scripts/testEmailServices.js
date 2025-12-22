/**
 * Test different email service configurations to find one that works.
 * Usage: node scripts/testEmailServices.js test@example.com
 */

const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address as a command line argument');
  console.log('Usage: node scripts/testEmailServices.js test@example.com');
  process.exit(1);
}

// Define different service configurations to try
const serviceConfigs = [
  // Configuration 1: Gmail
  {
    name: "Gmail",
    config: {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    }
  },
  
  // Configuration 2: Gmail with SMTP
  {
    name: "Gmail with SMTP",
    config: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    }
  },
  
  // Configuration 3: Gmail with TLS
  {
    name: "Gmail with TLS",
    config: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    }
  },
  
  // Configuration 4: Gmail with OAuth2 (if OAuth credentials exist)
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
    {
      name: "Gmail with OAuth2",
      config: {
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
          accessToken: process.env.GOOGLE_ACCESS_TOKEN || ''
        }
      }
    }
  ] : []),

  // Configuration 5: Direct SMTP with debug
  {
    name: "Direct SMTP with Debug",
    config: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      debug: true,
      logger: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    }
  }
];

// Function to test email sending with a given configuration
async function testEmailConfig(configName, config) {
  console.log(`\n🔍 Testing ${configName}...`);
  
  try {
    // Create transporter with this config
    const transporter = nodemailer.createTransport(config);
    
    // Verify connection configuration
    const verifyResult = await transporter.verify();
    console.log('✓ SMTP connection verified');
    
    // Email content
    const mailOptions = {
      from: `"TrackLy Test" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'TrackLy Email Configuration Test',
      text: `This is a test email from TrackLy using ${configName} configuration.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">TrackLy</h1>
            <p style="color: #666;">Email Configuration Test</p>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Email Configuration Test</h2>
            <p style="color: #4b5563; line-height: 1.5;">
              This is a test email sent using the <strong>${configName}</strong> configuration.
              If you're seeing this, it means this configuration works!
            </p>
          </div>
        </div>
      `
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ SUCCESS! Email sent with this configuration.');
    console.log(`Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ FAILED with error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run tests sequentially
async function runTests() {
  console.log('📧 TESTING EMAIL CONFIGURATIONS');
  console.log('==============================');
  console.log(`Email User: ${process.env.EMAIL_USER}`);
  console.log(`Target Email: ${email}`);
  console.log('==============================');
  
  let successCount = 0;
  
  for (const serviceConfig of serviceConfigs) {
    const result = await testEmailConfig(serviceConfig.name, serviceConfig.config);
    if (result.success) {
      successCount++;
    }
  }
  
  console.log('\n==============================');
  console.log(`Results: ${successCount} of ${serviceConfigs.length} configurations succeeded`);
  
  if (successCount === 0) {
    console.log('\n⚠️ TROUBLESHOOTING TIPS:');
    console.log('1. Check that your Gmail credentials are correct');
    console.log('2. For Gmail, create an App Password:');
    console.log('   - Go to Google Account > Security > 2-Step Verification > App passwords');
    console.log('   - Select app: "Mail" and device: "Other"');
    console.log('   - Generate and use the 16-character password instead of your account password');
    console.log('3. Make sure less secure apps are allowed, or 2FA is enabled with an App Password');
    console.log('4. Check your Gmail account for security alerts that might be blocking the login');
    console.log('5. Try using a completely different email provider (e.g., Outlook, ProtonMail)');
    
    process.exit(1);
  } else {
    console.log('\n✅ At least one email configuration works!');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 