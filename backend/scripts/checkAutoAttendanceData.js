const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Schedule = require('../models/Schedule');
const AcademicPeriod = require('../models/AcademicPeriod');
const Attendance = require('../models/Attendance');

async function checkData() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MONGO_URI not found in .env file');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Get first user
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found in database');
      process.exit(0);
    }

    console.log('✅ User found:', user.email);
    console.log('   Current Semester:', user.currentSemester);
    console.log('   Auto-Attendance Enabled:', user.autoAttendanceEnabled);
    console.log('');

    // Check schedule
    const schedule = await Schedule.findOne({
      userId: user._id,
      userSemester: user.currentSemester
    }).sort({ createdAt: -1 });

    if (!schedule) {
      console.log('❌ No schedule found for this user/semester');
      process.exit(0);
    }

    console.log('✅ Schedule found');
    console.log('   Schedule ID:', schedule.scheduleId);
    console.log('   Classes:', schedule.schedule.classes.length);
    console.log('   Created At:', schedule.createdAt);
    console.log('   Academic Period ID:', schedule.academicPeriodId || 'None');
    console.log('');

    // Check academic period
    if (schedule.academicPeriodId) {
      const academicPeriod = await AcademicPeriod.findById(schedule.academicPeriodId);
      if (academicPeriod) {
        console.log('✅ Academic Period found');
        console.log('   Start Date:', academicPeriod.startDate);
        console.log('   End Date:', academicPeriod.endDate);
        console.log('');
      } else {
        console.log('⚠️  Academic Period ID exists but not found in database');
        console.log('   Will use schedule.createdAt as start date:', schedule.createdAt);
        console.log('');
      }
    } else {
      console.log('⚠️  No Academic Period linked');
      console.log('   Will use schedule.createdAt as start date:', schedule.createdAt);
      console.log('');
    }

    // Check existing attendance
    const attendanceCount = await Attendance.countDocuments({ user: user._id });
    console.log('📊 Existing Attendance Records:', attendanceCount);

    // Check classes in schedule
    console.log('\n📚 Classes in Schedule:');
    schedule.schedule.classes.forEach((cls, index) => {
      console.log(`   ${index + 1}. ${cls.subject} (${cls.day}) - ${cls.startTime} to ${cls.endTime}`);
      console.log(`      Subject ID: ${cls.subjectId || 'MISSING!'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
