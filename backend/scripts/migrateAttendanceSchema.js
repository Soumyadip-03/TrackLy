const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const migrateAttendanceSchema = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    const db = mongoose.connection.db;
    
    // Remove isPreparatory field using native MongoDB driver
    const removeResult = await db.collection('attendances').updateMany(
      {},
      { $unset: { isPreparatory: '' } }
    );
    console.log(`Processed ${removeResult.matchedCount} records`);
    console.log(`Modified ${removeResult.modifiedCount} records`);

    // Add timeDuration to records that don't have it
    const attendances = await Attendance.find({ 
      $or: [
        { timeDuration: { $exists: false } },
        { 'timeDuration.startTime': { $exists: false } }
      ]
    });
    console.log(`\nFound ${attendances.length} records needing timeDuration`);

    let updated = 0;

    for (const attendance of attendances) {
      if (attendance.scheduleClassId) {
        const schedule = await Schedule.findOne({
          userId: attendance.user,
          'schedule.classes.id': attendance.scheduleClassId
        });

        if (schedule) {
          const classData = schedule.schedule.classes.find(c => c.id === attendance.scheduleClassId);
          if (classData) {
            attendance.timeDuration = {
              startTime: classData.startTime || '',
              endTime: classData.endTime || ''
            };
          } else {
            attendance.timeDuration = { startTime: '', endTime: '' };
          }
        } else {
          attendance.timeDuration = { startTime: '', endTime: '' };
        }
      } else {
        attendance.timeDuration = { startTime: '', endTime: '' };
      }

      await attendance.save();
      updated++;
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Removed isPreparatory from ${removeResult.modifiedCount} records`);
    console.log(`Added timeDuration to: ${updated} records`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateAttendanceSchema();
