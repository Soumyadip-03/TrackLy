const schedule = require('node-schedule');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const notificationController = require('../controllers/notificationController');
const { createNotification } = require('./notificationHelper');
const { initializeUserDatabase } = require('./dbManager');

// Todo Reminders - Daily at 9 AM
const dailyTodoReminders = schedule.scheduleJob('0 9 * * *', async () => {
  try {
    const users = await User.find({
      'notificationPreferences.todoReminders': true
    });
    
    let totalGenerated = 0;
    
    for (const user of users) {
      const { models } = initializeUserDatabase(user._id);
      const todoReminderDays = parseInt(user.notificationPreferences?.todoReminderTime || '1');
      const priorityOnly = user.notificationPreferences?.priorityTodosOnly || false;
      
      const now = new Date();
      
      let todoQuery = { 
        user: user._id, 
        completed: false,
        dueDate: { $ne: null }
      };
      
      if (priorityOnly) {
        todoQuery.priority = 'high';
      }
      
      const todos = await models.Todo.find(todoQuery);
      
      for (const todo of todos) {
        if (!todo.dueDate) continue;
        
        const dueDate = new Date(todo.dueDate);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const existingNotif = await Notification.findOne({
          user: user._id,
          relatedTo: todo._id,
          onModel: 'Todo',
          createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        });
        
        if (!existingNotif && diffDays <= todoReminderDays && diffDays >= 0) {
          const priority = diffDays === 0 ? 'high' : (diffDays === 1 ? 'medium' : 'low');
          const type = diffDays === 0 ? 'alert' : 'reminder';
          
          await Notification.create({
            user: user._id,
            title: diffDays === 0 ? 'Task Due Today' : 'Upcoming Task',
            message: `"${todo.title}" is due ${diffDays === 0 ? 'today' : 'in ' + diffDays + ' day' + (diffDays > 1 ? 's' : '')}.`,
            type,
            category: 'todo',
            priority,
            relatedTo: todo._id,
            onModel: 'Todo'
          });
          
          totalGenerated++;
        }
      }
    }
    
    console.log(`Daily todo reminders: Generated ${totalGenerated} notifications for ${users.length} users`);
  } catch (error) {
    console.error('Error in daily todo reminders:', error);
  }
});

// Holiday Reminders - Daily at 9 AM
const dailyHolidayReminders = schedule.scheduleJob('0 9 * * *', async () => {
  try {
    const users = await User.find({
      'notificationPreferences.calendarReminders': true,
      'holidays.0': { $exists: true }
    });
    
    let totalGenerated = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    for (const user of users) {
      const reminderDays = parseInt(user.notificationPreferences?.calendarReminderTime || '1');
      
      for (const holiday of user.holidays) {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        
        const diffTime = holidayDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Check if notification already exists for this holiday today
        const existingNotif = await Notification.findOne({
          user: user._id,
          category: 'calendar',
          message: { $regex: holiday.name },
          createdAt: { $gte: new Date(now.getTime()) }
        });
        
        if (!existingNotif && diffDays <= reminderDays && diffDays >= 0) {
          const priority = diffDays === 0 ? 'high' : 'medium';
          const type = diffDays === 0 ? 'alert' : 'info';
          
          await Notification.create({
            user: user._id,
            title: diffDays === 0 ? 'Holiday Today' : 'Upcoming Holiday',
            message: `${holiday.name}${holiday.description ? ': ' + holiday.description : ''} ${diffDays === 0 ? 'is today' : 'in ' + diffDays + ' day' + (diffDays > 1 ? 's' : '')}.`,
            type,
            category: 'calendar',
            priority
          });
          
          totalGenerated++;
        }
      }
    }
    
    console.log(`Daily holiday reminders: Generated ${totalGenerated} notifications for ${users.length} users`);
  } catch (error) {
    console.error('Error in daily holiday reminders:', error);
  }
});

// Attendance Summary - Daily at 8 PM
const dailyAttendanceSummary = schedule.scheduleJob('0 20 * * *', async () => {
  try {
    const users = await User.find({
      'notificationPreferences.attendanceReminderFrequency': 'daily',
      'notificationPreferences.attendanceReminders': true
    });
    
    for (const user of users) {
      const subjects = await Subject.find({ user: user._id });
      
      let totalClasses = 0;
      let totalAttended = 0;
      
      subjects.forEach(subject => {
        totalClasses += subject.totalClasses;
        totalAttended += subject.attendedClasses;
      });
      
      const overallPercentage = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);
      
      await createNotification({
        userId: user._id,
        title: 'Daily Attendance Summary',
        message: `Your overall attendance is ${overallPercentage}%. You've attended ${totalAttended} out of ${totalClasses} classes.`,
        type: 'info',
        category: 'attendance',
        priority: 'low'
      });
    }
    
    console.log(`Daily attendance summary sent to ${users.length} users`);
  } catch (error) {
    console.error('Error in daily attendance summary:', error);
  }
});

// Attendance Summary - Weekly on Sunday at 8 PM
const weeklyAttendanceSummary = schedule.scheduleJob('0 20 * * 0', async () => {
  try {
    const users = await User.find({
      'notificationPreferences.attendanceReminderFrequency': 'weekly',
      'notificationPreferences.attendanceReminders': true
    });
    
    for (const user of users) {
      const subjects = await Subject.find({ user: user._id });
      
      let totalClasses = 0;
      let totalAttended = 0;
      let subjectDetails = [];
      
      subjects.forEach(subject => {
        totalClasses += subject.totalClasses;
        totalAttended += subject.attendedClasses;
        const percentage = subject.getAttendancePercentage();
        subjectDetails.push(`${subject.name}: ${percentage}%`);
      });
      
      const overallPercentage = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);
      
      await createNotification({
        userId: user._id,
        title: 'Weekly Attendance Summary',
        message: `Overall: ${overallPercentage}% (${totalAttended}/${totalClasses}). ${subjectDetails.slice(0, 3).join(', ')}`,
        type: 'info',
        category: 'attendance',
        priority: 'medium'
      });
    }
    
    console.log(`Weekly attendance summary sent to ${users.length} users`);
  } catch (error) {
    console.error('Error in weekly attendance summary:', error);
  }
});

// Attendance Summary - Monthly on 1st at 8 PM
const monthlyAttendanceSummary = schedule.scheduleJob('0 20 1 * *', async () => {
  try {
    const users = await User.find({
      'notificationPreferences.attendanceReminderFrequency': 'monthly',
      'notificationPreferences.attendanceReminders': true
    });
    
    for (const user of users) {
      const subjects = await Subject.find({ user: user._id });
      
      let totalClasses = 0;
      let totalAttended = 0;
      
      subjects.forEach(subject => {
        totalClasses += subject.totalClasses;
        totalAttended += subject.attendedClasses;
      });
      
      const overallPercentage = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);
      
      await createNotification({
        userId: user._id,
        title: 'Monthly Attendance Report',
        message: `Monthly Report: Overall attendance is ${overallPercentage}%. Total: ${totalAttended}/${totalClasses} classes attended.`,
        type: 'info',
        category: 'attendance',
        priority: 'medium'
      });
    }
    
    console.log(`Monthly attendance summary sent to ${users.length} users`);
  } catch (error) {
    console.error('Error in monthly attendance summary:', error);
  }
});

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
    const users = await User.find({
      'notificationPreferences.emailNotifications.enabled': true,
      'notificationPreferences.emailNotifications.frequency': 'daily'
    });
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1);
    
    let successCount = 0;
    
    for (const user of users) {
      const notifications = await Notification.find({
        user: user._id,
        createdAt: { $gte: cutoffDate },
        read: false
      }).sort({ createdAt: -1 });
      
      if (notifications.length > 0) {
        const mutedTypes = user.notificationPreferences.emailNotifications.mutedTypes || [];
        const filteredNotifications = notifications.filter(n => !mutedTypes.includes(n.category));
        
        if (filteredNotifications.length > 0) {
          const emailService = require('./emailService');
          const result = await emailService.sendDigest(user.email, filteredNotifications, 'daily');
          if (result.success) {
            user.notificationPreferences.emailNotifications.lastDigestSent = new Date();
            user.emailHistory.push({
              emailType: 'digest',
              subject: 'TrackLy Daily Digest',
              sentAt: new Date(),
              status: 'sent'
            });
            await user.save();
            successCount++;
          }
        }
      }
    }
    
    console.log(`Daily digest sent to ${successCount} users at ${new Date()}`);
  } catch (error) {
    console.error('Error in daily digest job:', error);
  }
});

// Schedule weekly digest emails - Run every Sunday at 5 PM
const weeklyDigestJob = schedule.scheduleJob('0 17 * * 0', async () => {
  try {
    const users = await User.find({
      'notificationPreferences.emailNotifications.enabled': true,
      'notificationPreferences.emailNotifications.frequency': 'weekly'
    });
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    let successCount = 0;
    
    for (const user of users) {
      const notifications = await Notification.find({
        user: user._id,
        createdAt: { $gte: cutoffDate },
        read: false
      }).sort({ createdAt: -1 });
      
      if (notifications.length > 0) {
        const mutedTypes = user.notificationPreferences.emailNotifications.mutedTypes || [];
        const filteredNotifications = notifications.filter(n => !mutedTypes.includes(n.category));
        
        if (filteredNotifications.length > 0) {
          const emailService = require('./emailService');
          const result = await emailService.sendDigest(user.email, filteredNotifications, 'weekly');
          if (result.success) {
            user.notificationPreferences.emailNotifications.lastDigestSent = new Date();
            user.emailHistory.push({
              emailType: 'digest',
              subject: 'TrackLy Weekly Digest',
              sentAt: new Date(),
              status: 'sent'
            });
            await user.save();
            successCount++;
          }
        }
      }
    }
    
    console.log(`Weekly digest sent to ${successCount} users at ${new Date()}`);
  } catch (error) {
    console.error('Error in weekly digest job:', error);
  }
});

module.exports = {
  dailyTodoReminders,
  dailyHolidayReminders,
  dailyAttendanceSummary,
  weeklyAttendanceSummary,
  monthlyAttendanceSummary,
  attendanceReminder,
  pointRewardCheck,
  dailyDigestJob,
  weeklyDigestJob
}; 