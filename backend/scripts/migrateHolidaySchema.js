const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const HolidaySchema = new mongoose.Schema({
  academicPeriodId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  date: Date,
  day: Number,
  month: Number,
  year: Number,
  reason: String,
  createdAt: Date
}, { strict: false });

const Holiday = mongoose.model('Holiday', HolidaySchema);

async function migrateHolidays() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const holidays = await Holiday.find({});
    console.log(`📊 Found ${holidays.length} holidays to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const holiday of holidays) {
      if (holiday.date) {
        console.log(`⏭️  Skipping holiday ${holiday._id} - already has date field`);
        skipped++;
        continue;
      }

      if (holiday.day && holiday.month && holiday.year) {
        holiday.date = new Date(holiday.year, holiday.month - 1, holiday.day);
        await holiday.save();
        console.log(`✅ Migrated holiday ${holiday._id}: ${holiday.day}/${holiday.month}/${holiday.year} -> ${holiday.date.toISOString().split('T')[0]}`);
        migrated++;
      } else {
        console.log(`⚠️  Skipping holiday ${holiday._id} - missing day/month/year fields`);
        skipped++;
      }
    }

    console.log('\n🎉 Migration Complete!');
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${holidays.length}`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateHolidays();
