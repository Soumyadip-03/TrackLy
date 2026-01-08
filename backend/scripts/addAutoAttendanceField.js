const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const addAutoAttendanceField = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    const result = await User.updateMany(
      { autoAttendanceEnabled: { $exists: false } },
      { $set: { autoAttendanceEnabled: false } }
    );

    console.log('\n=== Migration Complete ===');
    console.log(`Matched: ${result.matchedCount} users`);
    console.log(`Modified: ${result.modifiedCount} users`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

addAutoAttendanceField();
