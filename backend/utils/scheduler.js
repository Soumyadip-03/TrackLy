const schedule = require('node-schedule');
const User = require('../models/User');
const Notification = require('../models/Notification');
const notificationController = require('../controllers/notificationController');

// Schedule attendance reminder - Run every day at 8 AM
const attendanceReminder = schedule.scheduleJob('0 8 * * *', async () => {
  try {
    // Find users who haven't updated attendance in 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Find users who haven't updated attendance recently
    const users = await User.find({
      lastAttendanceUpdate: { $lt: threeDaysAgo }
    });
    
    for (const user of users) {
      const notification = await Notification.create({
        user: user._id,
        title: 'Attendance Reminder',
        message: 'Please update your attendance record. It has been 3 days since your last update.',
        type: 'attendance'
      });
      
      // Check if user has email notifications enabled
      if (user.notificationPreferences?.emailNotifications?.enabled &&
          user.notificationPreferences.emailNotifications.frequency === 'instant' &&
          !user.notificationPreferences.emailNotifications.mutedTypes.includes('attendance')) {
        const emailService = require('./emailService');
        await emailService.sendNotificationEmail(notification, user.email);
      }
    }
    
    console.log(`Attendance reminder sent to ${users.length} users at ${new Date()}`);
  } catch (error) {
    console.error('Error in attendance reminder job:', error);
  }
});

// Schedule point reward check - Run every Sunday at midnight
const pointRewardCheck = schedule.scheduleJob('0 0 * * 0', async () => {
  try {
    // Find all users
    const users = await User.find({});
    
    // This is a placeholder. In a real implementation, we would check attendance trends
    // and reward points based on consistent attendance
    for (const user of users) {
      // Example: Add 10 points for maintaining good attendance (placeholder logic)
      const pointsToAdd = 10;
      
      user.points += pointsToAdd;
      await user.save();
      
      const notification = await Notification.create({
        user: user._id,
        title: 'Points Reward',
        message: `Congratulations! You've earned ${pointsToAdd} points for maintaining good attendance.`,
        type: 'point'
      });
      
      // Check if user has email notifications enabled
      if (user.notificationPreferences?.emailNotifications?.enabled &&
          user.notificationPreferences.emailNotifications.frequency === 'instant' &&
          !user.notificationPreferences.emailNotifications.mutedTypes.includes('point')) {
        const emailService = require('./emailService');
        await emailService.sendNotificationEmail(notification, user.email);
      }
    }
    
    console.log(`Weekly points reward processed at ${new Date()}`);
  } catch (error) {
    console.error('Error in point reward job:', error);
  }
});

// Schedule daily digest emails - Run every day at 6 PM
const dailyDigestJob = schedule.scheduleJob('0 18 * * *', async () => {
  try {
    const result = await notificationController.sendDigests('daily');
    console.log(`Daily digest job completed at ${new Date()}: ${result.message || result.error}`);
  } catch (error) {
    console.error('Error in daily digest job:', error);
  }
});

// Schedule weekly digest emails - Run every Sunday at 5 PM
const weeklyDigestJob = schedule.scheduleJob('0 17 * * 0', async () => {
  try {
    const result = await notificationController.sendDigests('weekly');
    console.log(`Weekly digest job completed at ${new Date()}: ${result.message || result.error}`);
  } catch (error) {
    console.error('Error in weekly digest job:', error);
  }
});

module.exports = {
  attendanceReminder,
  pointRewardCheck,
  dailyDigestJob,
  weeklyDigestJob
}; 