const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');

/**
 * Create notification and optionally send email
 * @param {Object} notificationData - Notification details
 * @param {String} notificationData.userId - User ID
 * @param {String} notificationData.title - Notification title
 * @param {String} notificationData.message - Notification message
 * @param {String} notificationData.type - Notification type (info, success, alert, reminder)
 * @param {String} notificationData.category - Notification category (system, todo, attendance, points, achievement)
 * @param {String} notificationData.priority - Priority (low, medium, high)
 */
async function createNotification(notificationData) {
  try {
    const { userId, title, message, type, category, priority, relatedTo, onModel } = notificationData;

    // Create notification in database
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type: type || 'info',
      category: category || 'system',
      priority: priority || 'medium',
      relatedTo,
      onModel
    });

    // Check if user has email notifications enabled
    const user = await User.findById(userId);
    
    if (user?.notificationPreferences?.emailNotifications?.enabled) {
      const emailPrefs = user.notificationPreferences.emailNotifications;
      const isMutedType = emailPrefs.mutedTypes.includes(category);
      
      // Send email if not muted and frequency is instant
      if (emailPrefs.frequency === 'instant' && !isMutedType) {
        try {
          const result = await emailService.sendEmail(user.email, title, message);
          
          // Track email in history
          user.emailHistory.push({
            emailType: category || 'notification',
            subject: title,
            sentAt: new Date(),
            status: result.success ? 'sent' : 'failed'
          });
          await user.save();
        } catch (emailErr) {
          console.error('Error sending notification email:', emailErr);
          // Track failed email
          user.emailHistory.push({
            emailType: category || 'notification',
            subject: title,
            sentAt: new Date(),
            status: 'failed'
          });
          await user.save();
        }
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

module.exports = { createNotification };
