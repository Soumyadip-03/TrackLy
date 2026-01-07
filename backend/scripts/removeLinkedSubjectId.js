const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const removeLinkedSubjectId = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    const db = mongoose.connection.db;
    
    const result = await db.collection('attendances').updateMany(
      {},
      { $unset: { linkedSubjectId: '' } }
    );

    console.log(`\n=== Migration Complete ===`);
    console.log(`Processed: ${result.matchedCount} records`);
    console.log(`Modified: ${result.modifiedCount} records`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

removeLinkedSubjectId();
