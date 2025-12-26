const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env') });

const User = require('../models/User');

const clearAllUserData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const users = await User.find({});
    console.log(`Found ${users.length} users\n`);

    for (const user of users) {
      console.log(`Processing user: ${user.email}`);
      
      const userDbName = `trackly_user_${user._id}`;
      const baseUri = process.env.MONGODB_URI.substring(0, process.env.MONGODB_URI.lastIndexOf('/') + 1);
      const userConn = mongoose.createConnection(`${baseUri}${userDbName}`);
      
      await new Promise((resolve) => userConn.once('connected', resolve));
      console.log(`  Connected to ${userDbName}`);
      
      // Delete all subjects
      const Subject = userConn.model('Subject', new mongoose.Schema({}, { strict: false }));
      const subjectResult = await Subject.deleteMany({});
      console.log(`  ✓ Deleted ${subjectResult.deletedCount} subjects`);
      
      // Delete all attendance records
      const Attendance = userConn.model('Attendance', new mongoose.Schema({}, { strict: false }));
      const attendanceResult = await Attendance.deleteMany({});
      console.log(`  ✓ Deleted ${attendanceResult.deletedCount} attendance records`);
      
      // Clear schedule data from UserInfo
      const UserInfo = userConn.model('UserInfo', new mongoose.Schema({}, { strict: false }));
      await UserInfo.updateOne(
        { mainUserId: user._id },
        { 
          $unset: { 
            pdfSchedule: "",
            uploads: ""
          }
        }
      );
      console.log(`  ✓ Cleared schedule from UserInfo`);
      
      await userConn.close();
      console.log(`  ✓ Closed connection\n`);
    }

    // Clear PDF schedule from main User collection
    const userUpdateResult = await User.updateMany({}, { $unset: { pdfSchedule: "" } });
    console.log(`✓ Cleared PDF schedules from ${userUpdateResult.modifiedCount} users in main DB\n`);

    console.log('✅ All user data (subjects, schedules, attendance) deleted successfully!');
    console.log('\nUsers can now add their own subjects and schedules.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

clearAllUserData();
