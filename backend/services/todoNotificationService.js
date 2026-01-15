const Todo = require('../models/Todo');
const User = require('../models/User');
const { initializeUserDatabase } = require('../utils/dbManager');

// Normalize date to UTC midnight for consistent comparison
const normalizeToUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

const checkTodoReminders = async () => {
  try {
    console.log('Checking todo reminders...');
    
    const users = await User.find({});
    const now = normalizeToUTC(new Date());
    
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
        const reminderDate = new Date(now);
        reminderDate.setDate(reminderDate.getDate() + reminderDays);
        
        for (const todo of todos) {
          const dueDate = normalizeToUTC(todo.dueDate);
          
          if (priorityOnly && todo.priority !== 'high') continue;
          
          // Check if overdue
          if (dueDate < now && !todo.isOverdue) {
            await handleOverdueTodo(user._id, todo, models);
          }
          // Check if due soon (upcoming reminder)
          else if (dueDate <= reminderDate && dueDate >= now) {
            await createTodoNotification(user._id, todo, 'upcoming');
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

const handleOverdueTodo = async (userId, todo, models) => {
  try {
    // Mark as overdue
    todo.isOverdue = true;
    await todo.save();
    
    // Check if we should send overdue notification (once per day)
    const lastNotification = todo.overdueNotificationSent;
    const now = new Date();
    
    if (!lastNotification || (now - lastNotification) > 24 * 60 * 60 * 1000) {
      await createTodoNotification(userId, todo, 'overdue');
      todo.overdueNotificationSent = now;
      await todo.save();
    }
  } catch (error) {
    console.error('Error handling overdue todo:', error);
  }
};

const createTodoNotification = async (userId, todo, type = 'upcoming') => {
  try {
    const { models } = initializeUserDatabase(userId);
    const now = normalizeToUTC(new Date());
    const dueDate = normalizeToUTC(todo.dueDate);
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    let message = '';
    let title = '';
    let priority = todo.priority;
    
    if (type === 'overdue') {
      const daysOverdue = Math.abs(daysUntilDue);
      title = '⚠️ Overdue Task';
      message = `Task "${todo.title}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue!`;
      priority = 'high'; // Escalate priority for overdue
    } else {
      title = 'Task Reminder';
      if (daysUntilDue === 0) {
        message = `Task "${todo.title}" is due today!`;
      } else if (daysUntilDue === 1) {
        message = `Task "${todo.title}" is due tomorrow!`;
      } else {
        message = `Task "${todo.title}" is due in ${daysUntilDue} days`;
      }
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check for duplicate notification today
    const existingNotification = await models.Notification.findOne({
      user: userId,
      type: type === 'overdue' ? 'todo_overdue' : 'todo_reminder',
      'metadata.todoId': todo._id.toString(),
      createdAt: { $gte: today }
    });
    
    if (existingNotification) {
      return;
    }
    
    await models.Notification.create({
      user: userId,
      type: type === 'overdue' ? 'todo_overdue' : 'todo_reminder',
      title: title,
      message: message,
      priority: priority,
      metadata: {
        todoId: todo._id.toString(),
        dueDate: todo.dueDate,
        priority: todo.priority,
        isOverdue: type === 'overdue'
      }
    });
    
    console.log(`${type} notification created for todo: ${todo.title}`);
  } catch (error) {
    console.error('Error creating todo notification:', error);
  }
};

module.exports = {
  checkTodoReminders
};
