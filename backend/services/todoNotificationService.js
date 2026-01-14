const Todo = require('../models/Todo');
const User = require('../models/User');
const { initializeUserDatabase } = require('../utils/dbManager');

const checkTodoReminders = async () => {
  try {
    console.log('Checking todo reminders...');
    
    const users = await User.find({});
    
    for (const user of users) {
      try {
        const settings = user.notificationPreferences || {};
        
        if (!settings.todoReminders) continue;
        
        const { models } = initializeUserDatabase(user._id);
        const todos = await models.Todo.find({ 
          user: user._id, 
          completed: false,
          dueDate: { $exists: true, $ne: null }
        });
        
        const reminderDays = parseInt(settings.todoReminderTime || '1');
        const priorityOnly = settings.priorityTodosOnly || false;
        const now = new Date();
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + reminderDays);
        
        for (const todo of todos) {
          const dueDate = new Date(todo.dueDate);
          
          if (priorityOnly && todo.priority !== 'high') continue;
          
          if (dueDate <= reminderDate && dueDate >= now) {
            await createTodoNotification(user._id, todo);
          }
        }
      } catch (error) {
        console.error(`Error processing todos for user ${user._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in checkTodoReminders:', error);
  }
};

const createTodoNotification = async (userId, todo) => {
  try {
    const { models } = initializeUserDatabase(userId);
    
    const daysUntilDue = Math.ceil((new Date(todo.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    let message = '';
    if (daysUntilDue === 0) {
      message = `Task "${todo.title}" is due today!`;
    } else if (daysUntilDue === 1) {
      message = `Task "${todo.title}" is due tomorrow!`;
    } else {
      message = `Task "${todo.title}" is due in ${daysUntilDue} days`;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingNotification = await models.Notification.findOne({
      user: userId,
      type: 'todo_reminder',
      'metadata.todoId': todo._id.toString(),
      createdAt: { $gte: today }
    });
    
    if (existingNotification) {
      return;
    }
    
    await models.Notification.create({
      user: userId,
      type: 'todo_reminder',
      title: 'Task Reminder',
      message: message,
      priority: todo.priority,
      metadata: {
        todoId: todo._id.toString(),
        dueDate: todo.dueDate,
        priority: todo.priority
      }
    });
    
    console.log(`Notification created for todo: ${todo.title}`);
  } catch (error) {
    console.error('Error creating todo notification:', error);
  }
};

module.exports = {
  checkTodoReminders
};
