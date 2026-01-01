const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Import models
const User = require('../models/User');
const Todo = require('../models/Todo');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');

/**
 * Migration script to move data from user-specific databases to single shared database
 * Run this ONCE after deploying the new code
 */
async function migrateToSingleDatabase() {
  try {
    console.log('Starting migration to single shared database...\n');
    
    // Connect to main database
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('Connected to main database');
    
    // Get all users from main database
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate\n`);
    
    if (users.length === 0) {
      console.log('No users found. Migration complete.');
      process.exit(0);
    }
    
    // Extract base URI
    const baseUri = process.env.MONGODB_URI;
    const dbIndex = baseUri.lastIndexOf('/');
    const baseServer = baseUri.substring(0, dbIndex + 1);
    
    let totalMigrated = 0;
    
    // For each user, connect to their old database and migrate data
    for (const user of users) {
      console.log(`\n--- Migrating data for user: ${user.name} (${user.email}) ---`);
      
      const userDbUri = `${baseServer}trackly_user_${user._id}`;
      let userConnection = null;
      
      try {
        // Connect to user-specific database
        userConnection = await mongoose.createConnection(userDbUri, {
          serverSelectionTimeoutMS: 5000,
        });
        
        console.log(`Connected to user database: trackly_user_${user._id}`);
        
        // Define models on user connection
        const UserTodo = userConnection.model('Todo', Todo.schema);
        const UserSubject = userConnection.model('Subject', Subject.schema);
        const UserAttendance = userConnection.model('Attendance', Attendance.schema);
        const UserNotification = userConnection.model('Notification', Notification.schema);
        
        let userMigrated = 0;
        
        // Migrate Todos
        const todos = await UserTodo.find({});
        if (todos.length > 0) {
          for (const todo of todos) {
            const exists = await Todo.findById(todo._id);
            if (!exists) {
              await Todo.create({
                _id: todo._id,
                user: user._id,
                title: todo.title,
                description: todo.description,
                dueDate: todo.dueDate,
                priority: todo.priority,
                completed: todo.completed,
                createdAt: todo.createdAt,
                updatedAt: todo.updatedAt
              });
              userMigrated++;
            }
          }
          console.log(`  ✓ Migrated ${todos.length} todos`);
        }
        
        // Migrate Subjects
        const subjects = await UserSubject.find({});
        if (subjects.length > 0) {
          for (const subject of subjects) {
            const exists = await Subject.findById(subject._id);
            if (!exists) {
              await Subject.create({
                _id: subject._id,
                user: user._id,
                name: subject.name,
                code: subject.code,
                classType: subject.classType,
                semester: subject.semester,
                totalClasses: subject.totalClasses,
                attendedClasses: subject.attendedClasses,
                classesPerWeek: subject.classesPerWeek,
                schedule: subject.schedule,
                createdAt: subject.createdAt
              });
              userMigrated++;
            }
          }
          console.log(`  ✓ Migrated ${subjects.length} subjects`);
        }
        
        // Migrate Attendance
        const attendances = await UserAttendance.find({});
        if (attendances.length > 0) {
          for (const attendance of attendances) {
            const exists = await Attendance.findById(attendance._id);
            if (!exists) {
              await Attendance.create({
                _id: attendance._id,
                user: user._id,
                subject: attendance.subject,
                date: attendance.date,
                status: attendance.status,
                calculationType: attendance.calculationType,
                createdAt: attendance.createdAt
              });
              userMigrated++;
            }
          }
          console.log(`  ✓ Migrated ${attendances.length} attendance records`);
        }
        
        // Migrate Notifications
        const notifications = await UserNotification.find({});
        if (notifications.length > 0) {
          for (const notification of notifications) {
            const exists = await Notification.findById(notification._id);
            if (!exists) {
              await Notification.create({
                _id: notification._id,
                user: user._id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                category: notification.category,
                priority: notification.priority,
                read: notification.read,
                relatedTo: notification.relatedTo,
                onModel: notification.onModel,
                createdAt: notification.createdAt
              });
              userMigrated++;
            }
          }
          console.log(`  ✓ Migrated ${notifications.length} notifications`);
        }
        
        totalMigrated += userMigrated;
        console.log(`Total documents migrated for ${user.name}: ${userMigrated}`);
        
        // Close user connection
        await userConnection.close();
        
      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error.message);
        if (userConnection) {
          await userConnection.close();
        }
        // Continue with next user
        continue;
      }
    }
    
    console.log(`\n✅ Migration complete! Total documents migrated: ${totalMigrated}`);
    console.log('\nNext steps:');
    console.log('1. Verify data in the main database');
    console.log('2. Test the application thoroughly');
    console.log('3. Once confirmed, you can delete the old user-specific databases from MongoDB Atlas');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateToSingleDatabase();
