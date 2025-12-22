const emailService = require('./emailService');

/**
 * Send a welcome email to a user
 * @param {string} email - The recipient's email address
 * @param {string} name - The recipient's name (optional)
 * @returns {Promise<Object>} - Result of the email sending operation
 */
async function sendWelcomeEmail(email, name = '') {
  try {
    // Create a greeting with the name if provided
    const greeting = name ? `Hi ${name},<br><br>` : '';
    
    // Create a welcome notification
    const welcomeNotification = {
      title: 'Welcome to TrackLy',
      message: `${greeting}Thank you for joining TrackLy, your student attendance tracking companion! 
                We're excited to help you stay on top of your attendance and academic goals.
                <br><br>
                <strong>What's next?</strong>
                <ol>
                  <li>Set up your subjects and schedule</li>
                  <li>Track your attendance regularly</li>
                  <li>Set reminders for important classes</li>
                  <li>Analyze your attendance patterns</li>
                </ol>
                <br>
                Our goal is to help you succeed in your academic journey. The TrackLy team is here to support you every step of the way.
                <br><br>
                Best regards,<br>
                The TrackLy Team`,
      createdAt: new Date()
    };

    // Send the email
    const result = await emailService.sendEmail(
      email,
      welcomeNotification.title,
      welcomeNotification.message,
      { priority: 'high' }
    );
    
    console.log(`Welcome email ${result.success ? 'sent to' : 'failed for'} ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

// Allow direct execution from command line
if (require.main === module) {
  // Get email from command line arguments
  const email = process.argv[2];
  const name = process.argv[3] || '';
  
  if (!email) {
    console.error('Please provide an email address as a command line argument');
    console.log('Usage: node sendWelcomeEmail.js email@example.com [name]');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Invalid email format. Please provide a valid email address.');
    process.exit(1);
  }

  console.log(`Sending welcome email to ${email}${name ? ' ('+name+')' : ''}...`);
  
  sendWelcomeEmail(email, name)
    .then(result => {
      if (result.success) {
        console.log(`Welcome email sent successfully. Message ID: ${result.messageId}`);
      } else {
        console.error(`Failed to send welcome email: ${result.error}`);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = sendWelcomeEmail; 