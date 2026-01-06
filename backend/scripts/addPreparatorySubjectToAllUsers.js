const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const addPreparatorySubjectToAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if user already has Preparatory subject
      const existingPrep = await Subject.findOne({
        user: user._id,
        name: 'Preparatory',
        classType: 'preparatory'
      });

      if (existingPrep) {
        console.log(`User ${user.email} already has Preparatory subject. Skipping...`);
        skippedCount++;
        continue;
      }

      // Create Preparatory subject for user
      await Subject.create({
        user: user._id,
        name: 'Preparatory',
        code: 'PREP',
        classType: 'preparatory',
        semester: 1,
        totalClasses: 0,
        attendedClasses: 0,
        schedule: []
      });

      console.log(`✅ Added Preparatory subject for user: ${user.email}`);
      addedCount++;
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Added: ${addedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total: ${users.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

addPreparatorySubjectToAllUsers();
