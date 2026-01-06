const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function addSubjectNameField() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const attendanceCollection = db.collection('attendances');
    const subjectCollection = db.collection('subjects');

    // Get all attendance records
    const attendances = await attendanceCollection.find({}).toArray();
    console.log(`Found ${attendances.length} attendance records`);

    let updated = 0;
    for (const attendance of attendances) {
      // Find the subject
      const subject = await subjectCollection.findOne({ _id: attendance.subject });
      
      if (subject) {
        // Update attendance with subject name
        await attendanceCollection.updateOne(
          { _id: attendance._id },
          { $set: { subjectName: subject.name } }
        );
        updated++;
      } else {
        console.warn(`Subject not found for attendance ${attendance._id}`);
      }
    }

    console.log(`Updated ${updated} attendance records with subjectName`);
    console.log('Migration completed successfully!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error adding subjectName field:', err);
    process.exit(1);
  }
}

addSubjectNameField();
