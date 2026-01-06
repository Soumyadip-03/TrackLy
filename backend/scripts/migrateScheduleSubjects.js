const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const Schedule = require('../models/Schedule');
const Subject = require('../models/Subject');

async function migrateScheduleSubjects() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all schedules
    const schedules = await Schedule.find({});
    console.log(`Found ${schedules.length} schedules to process`);

    let totalUpdated = 0;
    let totalSubjectsCreated = 0;

    for (const schedule of schedules) {
      console.log(`\nProcessing schedule for user: ${schedule.userName}`);
      
      if (!schedule.schedule || !schedule.schedule.classes) {
        console.log('  No classes found, skipping...');
        continue;
      }

      let scheduleUpdated = false;

      for (let i = 0; i < schedule.schedule.classes.length; i++) {
        const cls = schedule.schedule.classes[i];
        
        // Skip if already has subjectId
        if (cls.subjectId) {
          console.log(`  Class "${cls.subject}" already has subjectId`);
          continue;
        }

        // Find or create subject
        let subject = await Subject.findOne({
          user: schedule.userId,
          name: cls.subject,
          academicPeriodId: schedule.academicPeriodId || null
        });

        if (!subject) {
          subject = await Subject.create({
            name: cls.subject,
            code: cls.subject,
            classType: cls.classType || 'none',
            semester: schedule.userSemester,
            user: schedule.userId,
            academicPeriodId: schedule.academicPeriodId || null
          });
          console.log(`  ✓ Created subject: ${subject.name}`);
          totalSubjectsCreated++;
        } else {
          console.log(`  ✓ Found existing subject: ${subject.name}`);
        }

        // Link subject to schedule class
        schedule.schedule.classes[i].subjectId = subject._id;
        scheduleUpdated = true;
      }

      if (scheduleUpdated) {
        await schedule.save();
        console.log(`  ✓ Schedule updated with subject links`);
        totalUpdated++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Schedules updated: ${totalUpdated}`);
    console.log(`Subjects created: ${totalSubjectsCreated}`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
migrateScheduleSubjects();
