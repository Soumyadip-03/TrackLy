const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Schedule = require('../models/Schedule');
const Subject = require('../models/Subject');

async function checkFormat() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected\n');

    const schedule = await Schedule.findOne().sort({ createdAt: -1 });
    const firstClass = schedule.schedule.classes[0];
    
    console.log('First class subjectId:');
    console.log('  Value:', firstClass.subjectId);
    console.log('  Type:', typeof firstClass.subjectId);
    console.log('  Constructor:', firstClass.subjectId.constructor.name);
    console.log('  toString():', firstClass.subjectId.toString());
    console.log('');

    // Try to find subject with this ID
    console.log('Trying to find subject...');
    const subject1 = await Subject.findById(firstClass.subjectId);
    console.log('  Direct findById:', subject1 ? 'FOUND' : 'NOT FOUND');

    const subject2 = await Subject.findById(firstClass.subjectId.toString());
    console.log('  With toString():', subject2 ? 'FOUND' : 'NOT FOUND');

    // Check all subjects
    const allSubjects = await Subject.find({ user: schedule.userId });
    console.log('\nAll subjects for this user:', allSubjects.length);
    allSubjects.forEach(s => {
      console.log(`  ${s.name}: ${s._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFormat();
