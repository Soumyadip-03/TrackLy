const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('../utils/emailService');

// @desc    Create a notification and send email if enabled
// @route   POST /api/notification
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, relatedTo, onModel } = req.body;

    // Create the notification in the user's database
    const notification = await req.userDb.models.Notification.create({
      title,
      message,
      type,
      relatedTo,
      onModel
    });

    // Always check if user has email notifications enabled
    if (req.user) {
      // Initialize notification preferences if they don't exist
      if (!req.user.notificationPreferences) {
        req.user.notificationPreferences = {
          emailNotifications: {
            enabled: false,
            frequency: 'daily',
            lastDigestSent: null,
            mutedTypes: []
          }
        };
        await req.user.save();
      }
      
      // Check if email notifications are enabled
      if (req.user.notificationPreferences && 
          req.user.notificationPreferences.emailNotifications && 
          req.user.notificationPreferences.emailNotifications.enabled) {
        
        const emailPrefs = req.user.notificationPreferences.emailNotifications;
        const isMutedType = emailPrefs.mutedTypes.includes(type);
        
        // Only send instant emails if the notification type is not muted
        if (emailPrefs.frequency === 'instant' && !isMutedType) {
          console.log(`Sending instant email notification to ${req.user.email}`);
          await emailService.sendNotificationEmail(notification, req.user.email);
        } else {
          console.log(`Email will be sent in ${emailPrefs.frequency} digest to ${req.user.email}`);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Send welcome email to a specific email address
// @route   POST /api/notification/welcome
exports.sendWelcomeEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email format
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required'
      });
    }
    
    // Create a welcome notification object (not stored in DB)
    const welcomeNotification = {
      title: 'Welcome to TrackLy',
      message: 'Thank you for joining TrackLy, your student attendance tracking companion! ' +
               'We\'re excited to help you stay on top of your attendance and academic goals. ' +
               'Start by setting up your subjects and schedule to get the most out of TrackLy.',
      type: 'system',
      createdAt: new Date()
    };
    
    // Send the welcome email
    const result = await emailService.sendNotificationEmail(welcomeNotification, email);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to send welcome email: ${result.error}`
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Welcome email sent to ${email}`,
      data: { messageId: result.messageId }
    });
  } catch (err) {
    console.error('Error sending welcome email:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Send digests to users with that preference
// @access  Internal - called by scheduler
exports.sendDigests = async (digestType = 'daily') => {
  try {
    // Get all users with email notifications enabled with the specified frequency
    const users = await User.find({
      'notificationPreferences.emailNotifications.enabled': true,
      'notificationPreferences.emailNotifications.frequency': digestType
    });
    
    const currentTime = new Date();
    const timeFrame = digestType === 'daily' ? 1 : 7; // days
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeFrame);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // Get user-specific database connection
        const { getUserDbConnection, initializeUserDatabase } = require('../utils/dbManager');
        const { models } = await initializeUserDatabase(user._id);
        
        // Get unread notifications for this user within the timeframe from their specific database
        const notifications = await models.Notification.find({
          createdAt: { $gte: cutoffDate },
          read: false
        }).sort({ createdAt: -1 });
        
        if (notifications.length > 0) {
          // Send digest email
          const result = await emailService.sendDigest(
            user.email, 
            notifications, 
            digestType
          );
          
          if (result.success) {
            successCount++;
            // Update last digest sent timestamp
            user.notificationPreferences.emailNotifications.lastDigestSent = currentTime;
            await user.save();
          } else {
            errorCount++;
            console.error(`Failed to send digest to ${user.email}: ${result.error}`);
          }
        }
      } catch (error) {
        errorCount++;
        console.error(`Error processing digest for user ${user._id}:`, error);
      }
    }
    
    return {
      success: true,
      message: `Sent ${digestType} digests to ${successCount} users with ${errorCount} errors`
    };
  } catch (err) {
    console.error(`Error sending ${digestType} digests:`, err);
    return {
      success: false,
      error: err.message
    };
  }
};

// @desc    Update user notification preferences
// @route   PUT /api/notification/preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { emailNotifications } = req.body;
    
    // Get the user with their current email
    const user = await User.findById(req.user.id);
    
    // Validate that the user has an email address
    if (emailNotifications?.enabled && !user.email) {
      return res.status(400).json({
        success: false,
        error: 'User account does not have a valid email address'
      });
    }
    
    // Initialize notification preferences if they don't exist
    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        emailNotifications: {
          enabled: false,
          frequency: 'daily',
          lastDigestSent: null,
          mutedTypes: []
        }
      };
    }
    
    // Update email notification preferences if provided
    if (emailNotifications) {
      // Always use the user's registered email
      user.notificationPreferences.emailNotifications = {
        ...user.notificationPreferences.emailNotifications,
        ...emailNotifications
      };
      
      // Log the update
      console.log(`Updated email notification preferences for ${user.email}: ${emailNotifications.enabled ? 'Enabled' : 'Disabled'}, Frequency: ${emailNotifications.frequency}`);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user.notificationPreferences
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 