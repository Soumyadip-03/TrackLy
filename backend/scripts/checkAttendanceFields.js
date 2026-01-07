const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    const db = mongoose.connection.db;
    const attendances = await db.collection('attendances').find({}).toArray();
    
    console.log(`\nTotal records: ${attendances.length}\n`);
    
    attendances.forEach((att, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  Has isPreparatory: ${att.hasOwnProperty('isPreparatory')}`);
      if (att.hasOwnProperty('isPreparatory')) {
        console.log(`  isPreparatory value: ${att.isPreparatory}`);
      }
      console.log(`  Has timeDuration: ${att.hasOwnProperty('timeDuration')}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
};

checkAttendance();
