require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const addCourseDurationToUsers = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('ERROR: MONGO_URI not found in environment variables');
      console.log('Please ensure .env file exists in backend directory with MONGO_URI');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all users without courseDuration field
    const users = await User.find({ courseDuration: { $exists: false } });
    console.log(`Found ${users.length} users without courseDuration field`);

    if (users.length === 0) {
      console.log('All users already have courseDuration field');
      process.exit(0);
    }

    // Update each user with default courseDuration based on currentSemester
    for (const user of users) {
      const currentSem = user.currentSemester || 1;
      // Calculate minimum course duration needed (round up)
      const minDuration = Math.ceil(currentSem / 2);
      // Set to minimum or 4 years (whichever is greater)
      const courseDuration = Math.max(minDuration, 4);
      
      user.courseDuration = courseDuration;
      await user.save();
      console.log(`Updated user ${user.email}: courseDuration = ${courseDuration} years`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

addCourseDurationToUsers();
