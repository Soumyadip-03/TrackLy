# Holiday Schema Migration

## Purpose
Migrates existing Holiday records from `day/month/year` fields to the new `date` field structure.

## What It Does
- Finds all Holiday documents in the database
- For each holiday with `day`, `month`, `year` fields:
  - Creates a `date` field from these values
  - Saves the updated document
- Skips holidays that already have a `date` field
- Provides detailed migration report

## How to Run

### From backend directory:
```bash
cd backend
node scripts/migrateHolidaySchema.js
```

### From project root:
```bash
node backend/scripts/migrateHolidaySchema.js
```

## Expected Output
```
✅ Connected to MongoDB
📊 Found 15 holidays to migrate
✅ Migrated holiday 507f1f77bcf86cd799439011: 26/1/2024 -> 2024-01-26
✅ Migrated holiday 507f1f77bcf86cd799439012: 10/10/2024 -> 2024-10-10
...
🎉 Migration Complete!
✅ Migrated: 15
⏭️  Skipped: 0
📊 Total: 15
✅ Database connection closed
```

## Safety Features
- Non-destructive: Only adds `date` field, doesn't remove existing fields
- Idempotent: Can be run multiple times safely
- Skips already migrated records
- Detailed logging for each operation

## After Migration
The old `day`, `month`, `year` fields will be removed automatically by the model's virtual fields on next save/update operations.

## Rollback
Not needed - the migration only adds data, doesn't remove anything. Old fields remain intact.
