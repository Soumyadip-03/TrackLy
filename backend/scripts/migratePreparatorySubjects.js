const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Subject = require('../models/Subject');

async function migratePreparatorySubjects() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MONGO_URI not found in .env file');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all Preparatory subjects
    const preparatorySubjects = await Subject.find({ 
      classType: 'preparatory',
      name: 'Preparatory'
    });

    console.log(`📊 Found ${preparatorySubjects.length} Preparatory subject(s)\n`);

    let updated = 0;

    for (const subject of preparatorySubjects) {
      // Remove classesPerWeek field
      if (subject.classesPerWeek !== undefined) {
        subject.classesPerWeek = undefined;
        await subject.save();
        
        console.log(`✅ Updated Preparatory subject for user: ${subject.user}`);
        console.log(`   - Removed classesPerWeek field`);
        updated++;
      } else {
        console.log(`⏭️  Preparatory subject already migrated for user: ${subject.user}`);
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   Total Preparatory subjects: ${preparatorySubjects.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Already migrated: ${preparatorySubjects.length - updated}`);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migratePreparatorySubjects();
