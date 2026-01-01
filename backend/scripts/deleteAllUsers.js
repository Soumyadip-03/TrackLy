const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

const User = require('../models/User');
const Todo = require('../models/Todo');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');

async function deleteAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🗑️  Deleting all users and their data...\n');
    
    const userCount = await User.countDocuments({});
    console.log(`Found ${userCount} users`);
    
    // Delete all data
    await Todo.deleteMany({});
    await Subject.deleteMany({});
    await Attendance.deleteMany({});
    await Notification.deleteMany({});
    await User.deleteMany({});
    
    console.log('\n✅ All users and data deleted!');
    console.log('Database is now clean. You can start fresh.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAllUsers();
