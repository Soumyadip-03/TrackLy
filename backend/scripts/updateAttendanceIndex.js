const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function updateAttendanceIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('attendances');

    // Drop the old unique index
    try {
      await collection.dropIndex('user_1_subject_1_date_1');
      console.log('Dropped old index: user_1_subject_1_date_1');
    } catch (err) {
      console.log('Old index not found or already dropped');
    }

    // Create new unique index with scheduleClassId
    await collection.createIndex(
      { user: 1, subject: 1, date: 1, scheduleClassId: 1 },
      { unique: true }
    );
    console.log('Created new index: user_1_subject_1_date_1_scheduleClassId_1');

    console.log('Index update completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating index:', err);
    process.exit(1);
  }
}

updateAttendanceIndex();
