const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function removeNotesField() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('attendances');

    // Remove notes field from all documents
    const result = await collection.updateMany(
      {},
      { $unset: { notes: "" } }
    );

    console.log(`Updated ${result.modifiedCount} attendance records`);
    console.log('Notes field removed successfully!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error removing notes field:', err);
    process.exit(1);
  }
}

removeNotesField();
