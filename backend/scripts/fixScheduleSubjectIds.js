const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Schedule = require('../models/Schedule');
const Subject = require('../models/Subject');

async function fixScheduleSubjectIds() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const schedule = await Schedule.findOne().sort({ createdAt: -1 });
    if (!schedule) {
      console.log('No schedule found');
      process.exit(0);
    }

    console.log('Found schedule with', schedule.schedule.classes.length, 'classes\n');

    // Get all subjects for this user
    const subjects = await Subject.find({ user: schedule.userId });
    console.log('Found', subjects.length, 'subjects\n');

    // Create a map of subject name + classType -> subject ID
    const subjectMap = new Map();
    subjects.forEach(subject => {
      const key = `${subject.name}|${subject.classType}`;
      subjectMap.set(key, subject._id);
      console.log(`Mapped: ${subject.name} (${subject.classType}) -> ${subject._id}`);
    });

    console.log('\n--- Updating Schedule ---\n');

    let updatedCount = 0;
    let notFoundCount = 0;

    // Update each class in the schedule
    schedule.schedule.classes.forEach((cls, index) => {
      const key = `${cls.subject}|${cls.classType || 'none'}`;
      const correctSubjectId = subjectMap.get(key);

      if (correctSubjectId) {
        console.log(`✅ ${cls.subject} (${cls.classType}) -> ${correctSubjectId}`);
        cls.subjectId = correctSubjectId;
        updatedCount++;
      } else {
        console.log(`❌ ${cls.subject} (${cls.classType}) -> NOT FOUND`);
        notFoundCount++;
      }
    });

    // Save the updated schedule
    await schedule.save();

    console.log('\n--- Summary ---');
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`❌ Not Found: ${notFoundCount}`);
    console.log('\n✅ Schedule updated successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixScheduleSubjectIds();
