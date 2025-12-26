const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env') });

const User = require('../models/User');

const clearDefaultSchedules = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      const userDbName = `trackly_user_${user._id}`;
      const userConn = mongoose.createConnection(`${process.env.MONGODB_URI.substring(0, process.env.MONGODB_URI.lastIndexOf('/') + 1)}${userDbName}`);
      
      await new Promise((resolve) => userConn.once('connected', resolve));
      
      // Delete all subjects
      const SubjectSchema = new mongoose.Schema({}, { strict: false });
      const Subject = userConn.model('Subject', SubjectSchema);
      
      const result = await Subject.deleteMany({});
      console.log(`Deleted ${result.deletedCount} subjects for user: ${user.email}`);
      
      // Clear PDF schedule from UserInfo
      const UserInfoSchema = new mongoose.Schema({}, { strict: false });
      const UserInfo = userConn.model('UserInfo', UserInfoSchema);
      
      await UserInfo.updateOne(
        { mainUserId: user._id },
        { $unset: { pdfSchedule: "", uploads: "" } }
      );
      
      console.log(`Cleared schedule data for user: ${user.email}`);
      
      await userConn.close();
    }

    // Also clear PDF schedule from main User collection
    await User.updateMany({}, { $unset: { pdfSchedule: "" } });
    console.log('Cleared PDF schedules from main User collection');

    console.log('\n✅ All default schedules and subjects deleted!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

clearDefaultSchedules();
