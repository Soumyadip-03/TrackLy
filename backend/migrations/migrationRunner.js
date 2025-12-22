const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Migration = require('./migrationSchema');

// Connect to MongoDB
require('dotenv').config({ path: '../config/config.env' });

/**
 * Run all pending migrations
 */
async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'scripts');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort(); // Sort to ensure order
    
    // For each migration file
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.js');
      
      // Check if migration has already been applied
      const existingMigration = await Migration.findOne({ name: migrationName });
      if (existingMigration && existingMigration.status === 'applied') {
        console.log(`Migration ${migrationName} already applied`);
        continue;
      }
      
      try {
        // Load migration script
        const migration = require(path.join(migrationsDir, file));
        
        // Create migration record
        const migrationRecord = await Migration.findOneAndUpdate(
          { name: migrationName },
          {
            name: migrationName,
            description: migration.description || '',
            version: migration.version || '1.0.0',
            status: 'pending'
          },
          { upsert: true, new: true }
        );
        
        console.log(`Applying migration: ${migrationName}`);
        
        // Run the migration
        await migration.up();
        
        // Update status to applied
        migrationRecord.status = 'applied';
        migrationRecord.appliedAt = new Date();
        await migrationRecord.save();
        
        console.log(`Successfully applied migration: ${migrationName}`);
      } catch (err) {
        console.error(`Error applying migration ${migrationName}:`, err);
        
        // Update status to failed
        await Migration.findOneAndUpdate(
          { name: migrationName },
          { status: 'failed' }
        );
        
        throw err; // Stop the migration process
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => console.log('Migration process completed'))
    .catch(err => console.error('Migration process failed:', err));
}

module.exports = { runMigrations }; 