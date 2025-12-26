const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUserDbConnection, initializeUserDatabase } = require('../utils/dbManager');

// @route   GET /api/notification
// @desc    Get all notifications for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { connection, models } = await initializeUserDatabase(req.user._id);
    const notifications = await models.Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// @route   POST /api/notification/generate
// @desc    Generate notifications based on todos and settings
// @access  Private
router.post('/generate', protect, async (req, res) => {
  try {
    const { connection, models } = await initializeUserDatabase(req.user._id);
    
    // Get user settings (you can expand this)
    const settings = {
      todoReminderDays: 1,
      priorityOnly: false
    };
    
    const generatedNotifications = [];
    const now = new Date();
    
    // Get todos
    const todos = await models.Todo.find({ 
      user: req.user._id, 
      completed: false,
      dueDate: { $ne: null }
    });
    
    // Generate todo reminders
    for (const todo of todos) {
      if (!todo.dueDate) continue;
      
      const dueDate = new Date(todo.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Check if notification already exists
      const existingNotif = await models.Notification.findOne({
        user: req.user._id,
        relatedTo: todo._id,
        onModel: 'Todo',
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });
      
      if (!existingNotif && diffDays <= settings.todoReminderDays && diffDays >= 0) {
        const priority = diffDays === 0 ? 'high' : (diffDays === 1 ? 'medium' : 'low');
        const type = diffDays === 0 ? 'alert' : 'reminder';
        
        const notification = await models.Notification.create({
          user: req.user._id,
          title: diffDays === 0 ? 'Task Due Today' : 'Upcoming Task',
          message: `"${todo.title}" is due ${diffDays === 0 ? 'today' : 'in ' + diffDays + ' day' + (diffDays > 1 ? 's' : '')}.`,
          type,
          category: 'todo',
          priority,
          relatedTo: todo._id,
          onModel: 'Todo'
        });
        
        generatedNotifications.push(notification);
      }
    }
    
    res.status(200).json({
      success: true,
      count: generatedNotifications.length,
      data: generatedNotifications
    });
  } catch (error) {
    console.error('Error generating notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate notifications',
      error: error.message
    });
  }
});

// @route   PATCH /api/notification/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/read-all', protect, async (req, res) => {
  try {
    const { connection, models } = await initializeUserDatabase(req.user._id);
    
    await models.Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// @route   DELETE /api/notification/clear-all
// @desc    Clear all notifications
// @access  Private
router.delete('/clear-all', protect, async (req, res) => {
  try {
    const { connection, models } = await initializeUserDatabase(req.user._id);
    
    await models.Notification.deleteMany({ user: req.user._id });
    
    res.status(200).json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear all notifications',
      error: error.message
    });
  }
});

// @route   PATCH /api/notification/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const { connection, models } = await initializeUserDatabase(req.user._id);
    
    const notification = await models.Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// @route   DELETE /api/notification/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { connection, models } = await initializeUserDatabase(req.user._id);
    
    const notification = await models.Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

module.exports = router;
