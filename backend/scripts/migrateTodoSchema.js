const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const { initializeUserDatabase } = require('../utils/dbManager');

dotenv.config();

// Normalize date to UTC midnight
const normalizeToUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

const migrateTodoSchema = async () => {
  try {
    console.log('Starting Todo schema migration...');
    
    // Connect to main database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    let totalTodosUpdated = 0;
    let usersProcessed = 0;
    
    for (const user of users) {
      try {
        console.log(`\nProcessing user: ${user.email} (${user._id})`);
        
        // Initialize user database
        const { models } = initializeUserDatabase(user._id);
        
        // Get all todos for this user
        const todos = await models.Todo.find({});
        console.log(`  Found ${todos.length} todos`);
        
        if (todos.length === 0) {
          console.log('  No todos to migrate');
          continue;
        }
        
        const now = normalizeToUTC(new Date());
        let updatedCount = 0;
        
        for (const todo of todos) {
          let needsUpdate = false;
          
          // Add isOverdue field if missing
          if (todo.isOverdue === undefined) {
            if (todo.dueDate && !todo.completed) {
              const dueDate = normalizeToUTC(todo.dueDate);
              todo.isOverdue = dueDate < now;
            } else {
              todo.isOverdue = false;
            }
            needsUpdate = true;
          }
          
          // Add overdueNotificationSent field if missing
          if (todo.overdueNotificationSent === undefined) {
            todo.overdueNotificationSent = null;
            needsUpdate = true;
          }
          
          // Save if changes were made
          if (needsUpdate) {
            await todo.save();
            updatedCount++;
          }
        }
        
        console.log(`  Updated ${updatedCount} todos`);
        totalTodosUpdated += updatedCount;
        usersProcessed++;
        
      } catch (error) {
        console.error(`  Error processing user ${user.email}:`, error.message);
      }
    }
    
    console.log('\n=================================');
    console.log('Migration completed successfully!');
    console.log(`Users processed: ${usersProcessed}/${users.length}`);
    console.log(`Total todos updated: ${totalTodosUpdated}`);
    console.log('=================================\n');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run migration
migrateTodoSchema();
