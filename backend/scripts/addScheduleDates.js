const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const AcademicPeriod = require('../models/AcademicPeriod');
require('dotenv').config();

async function addScheduleDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const schedules = await Schedule.find({});
    console.log(`📋 Found ${schedules.length} schedules`);

    let updated = 0;
    let skipped = 0;

    for (const schedule of schedules) {
      // Skip if already has dates
      if (schedule.startDate && schedule.endDate) {
        console.log(`⏭️  Schedule ${schedule.scheduleId} already has dates`);
        skipped++;
        continue;
      }

      // Try to get dates from linked academic period
      if (schedule.academicPeriodId) {
        const period = await AcademicPeriod.findById(schedule.academicPeriodId);
        if (period) {
          schedule.startDate = period.startDate;
          schedule.endDate = period.endDate;
          await schedule.save();
          console.log(`✅ Updated ${schedule.scheduleId} from academic period`);
          updated++;
          continue;
        }
      }

      // Fallback: Use schedule creation date + 6 months
      const createdDate = schedule.createdAt || new Date();
      schedule.startDate = createdDate;
      schedule.endDate = new Date(createdDate.getTime() + (180 * 24 * 60 * 60 * 1000)); // +6 months
      await schedule.save();
      console.log(`✅ Updated ${schedule.scheduleId} with default dates (6 months from creation)`);
      updated++;
    }

    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${schedules.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addScheduleDates();
