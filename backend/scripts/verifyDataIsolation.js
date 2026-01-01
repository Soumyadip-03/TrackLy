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
 * Verification script to ensure data isolation is working correctly
 */
async function verifyDataIsolation() {
  try {
    console.log('🔍 Verifying data isolation in single shared database...\n');
    
    // Connect to main database
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to database\n');
    
    // Get all users
    const users = await User.find({}).select('name email _id');
    console.log(`Found ${users.length} users:\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      process.exit(1);
    }
    
    // Check data for each user
    for (const user of users) {
      console.log(`\n--- User: ${user.name} (${user.email}) ---`);
      console.log(`User ID: ${user._id}`);
      
      // Count documents for this user
      const todoCount = await Todo.countDocuments({ user: user._id });
      const subjectCount = await Subject.countDocuments({ user: user._id });
      const attendanceCount = await Attendance.countDocuments({ user: user._id });
      const notificationCount = await Notification.countDocuments({ user: user._id });
      
      console.log(`  📝 Todos: ${todoCount}`);
      console.log(`  📚 Subjects: ${subjectCount}`);
      console.log(`  ✓ Attendance: ${attendanceCount}`);
      console.log(`  🔔 Notifications: ${notificationCount}`);
      
      // Verify no documents without user field
      const todosWithoutUser = await Todo.countDocuments({ user: { $exists: false } });
      const subjectsWithoutUser = await Subject.countDocuments({ user: { $exists: false } });
      const attendanceWithoutUser = await Attendance.countDocuments({ user: { $exists: false } });
      const notificationsWithoutUser = await Notification.countDocuments({ user: { $exists: false } });
      
      if (todosWithoutUser > 0 || subjectsWithoutUser > 0 || attendanceWithoutUser > 0 || notificationsWithoutUser > 0) {
        console.log(`  ⚠️  WARNING: Found documents without user field!`);
        console.log(`     Todos: ${todosWithoutUser}, Subjects: ${subjectsWithoutUser}, Attendance: ${attendanceWithoutUser}, Notifications: ${notificationsWithoutUser}`);
      }
    }
    
    // Overall statistics
    console.log('\n\n--- Overall Statistics ---');
    const totalTodos = await Todo.countDocuments({});
    const totalSubjects = await Subject.countDocuments({});
    const totalAttendance = await Attendance.countDocuments({});
    const totalNotifications = await Notification.countDocuments({});
    
    console.log(`Total Todos: ${totalTodos}`);
    console.log(`Total Subjects: ${totalSubjects}`);
    console.log(`Total Attendance: ${totalAttendance}`);
    console.log(`Total Notifications: ${totalNotifications}`);
    
    // Check for orphaned documents (documents with invalid user IDs)
    console.log('\n--- Checking for Orphaned Documents ---');
    const userIds = users.map(u => u._id);
    
    const orphanedTodos = await Todo.countDocuments({ user: { $nin: userIds } });
    const orphanedSubjects = await Subject.countDocuments({ user: { $nin: userIds } });
    const orphanedAttendance = await Attendance.countDocuments({ user: { $nin: userIds } });
    const orphanedNotifications = await Notification.countDocuments({ user: { $nin: userIds } });
    
    if (orphanedTodos > 0 || orphanedSubjects > 0 || orphanedAttendance > 0 || orphanedNotifications > 0) {
      console.log('⚠️  Found orphaned documents (documents with invalid user IDs):');
      console.log(`   Todos: ${orphanedTodos}`);
      console.log(`   Subjects: ${orphanedSubjects}`);
      console.log(`   Attendance: ${orphanedAttendance}`);
      console.log(`   Notifications: ${orphanedNotifications}`);
    } else {
      console.log('✅ No orphaned documents found');
    }
    
    // Test data isolation
    console.log('\n--- Testing Data Isolation ---');
    if (users.length >= 2) {
      const user1 = users[0];
      const user2 = users[1];
      
      const user1Todos = await Todo.find({ user: user1._id });
      const user2Todos = await Todo.find({ user: user2._id });
      
      console.log(`User 1 (${user1.name}) has ${user1Todos.length} todos`);
      console.log(`User 2 (${user2.name}) has ${user2Todos.length} todos`);
      
      // Check if any todo from user1 appears in user2's results
      const overlap = user1Todos.some(todo => 
        user2Todos.some(t => t._id.toString() === todo._id.toString())
      );
      
      if (overlap) {
        console.log('❌ CRITICAL: Data isolation is broken! Users can see each other\'s data!');
      } else {
        console.log('✅ Data isolation is working correctly');
      }
    }
    
    console.log('\n✅ Verification complete!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
verifyDataIsolation();
