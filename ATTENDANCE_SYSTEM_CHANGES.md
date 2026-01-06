# Attendance System Changes - Changelog

## Overview
This document describes all changes made to the attendance system to fix critical issues and improve functionality.

---

## 1. Local Storage-Based Attendance Marking

### Problem
Attendance was being saved to the database immediately upon clicking tick/cross buttons, causing unnecessary API calls and preventing users from reviewing before submission.

### Solution
- Implemented local storage to temporarily store attendance marks
- Added "Upload Attendance" button to batch upload all marks at once
- UI updates immediately when marking attendance (stored in localStorage)
- Database is only updated when user clicks "Upload Attendance"

### Files Changed
- `frontend/components/attendance/visual-attendance-form.tsx`
  - Added `getLocalStorageKey()` function
  - Added `saveToLocalStorage()` function
  - Added `loadLocalAttendance()` function
  - Modified `markAttendance()` to save to localStorage instead of API
  - Modified `markAllAttendance()` to save to localStorage
  - Added `uploadAttendance()` function for batch upload

---

## 2. Toast Notifications

### Problem
System was using browser `alert()` for success/error messages, which didn't match the application's design system.

### Solution
- Integrated `useToastNotification` hook
- Replaced all `alert()` calls with styled toast notifications
- Success and error messages now appear as system-styled pop-ups

### Files Changed
- `frontend/components/attendance/visual-attendance-form.tsx`
  - Imported `useToastNotification` hook
  - Replaced `alert()` with `success()` and `error()` toast methods

---

## 3. Toggle Attendance Marks

### Problem
Users couldn't undo their attendance marks before uploading - clicking the same button twice would do nothing.

### Solution
- Implemented toggle functionality for tick/cross buttons
- Clicking the same status button again reverts to unmarked (null)
- Example: Click ✓ → Present (green), Click ✓ again → Unmarked (default)

### Files Changed
- `frontend/components/attendance/visual-attendance-form.tsx`
  - Modified `markAttendance()` to check if `cls.status === status` and toggle to `null`

---

## 4. Persistent UI State After Upload

### Problem
After uploading attendance, the UI would revert to default state, losing the visual feedback of marked attendance.

### Solution
- Removed localStorage clearing after successful upload
- UI colors (green/red) remain visible after upload
- Users can still change attendance even after uploading to database

### Files Changed
- `frontend/components/attendance/visual-attendance-form.tsx`
  - Removed `localStorage.removeItem()` from `uploadAttendance()`
  - Added delayed `loadLocalAttendance()` call after loading DB data

---

## 5. Multiple Slots Support (Same Subject, Same ClassType)

### Problem
When a subject had multiple 1-hour slots (e.g., OOP lab 09:00-10:00, 10:00-11:00, 11:00-12:00), only one attendance record could be created due to unique index constraint.

### Solution
- Updated database unique index to include `scheduleClassId`
- Changed from: `{user, subject, date}` → To: `{user, subject, date, scheduleClassId}`
- Backend now queries by `scheduleClassId` to differentiate between time slots
- Each 1-hour slot is now counted individually

### Files Changed
- `backend/models/Attendance.js`
  - Updated unique index to include `scheduleClassId`
- `backend/routes/attendance.js`
  - Modified query to find attendance by `scheduleClassId`
- `frontend/components/attendance/visual-attendance-form.tsx`
  - Updated localStorage keys to include class ID: `subjectId + '_' + cls.id`

### Database Migration
```javascript
// Drop old index
db.attendances.dropIndex('user_1_subject_1_date_1')

// Create new index
db.attendances.createIndex(
  { user: 1, subject: 1, date: 1, scheduleClassId: 1 },
  { unique: true }
)
```

---

## 6. Removed Notes Field

### Problem
The `notes` field in Attendance model was unused and cluttering the schema.

### Solution
- Removed `notes` field from Attendance schema

### Files Changed
- `backend/models/Attendance.js`
  - Deleted `notes` field

### Database Migration
```javascript
// Remove notes field from all documents
db.attendances.updateMany({}, { $unset: { notes: "" } })
```

---

## 7. Subject Name Field in Attendance

### Problem
Attendance records only stored subject ObjectId reference, making it difficult to identify which subject without populating.

### Solution
- Added `subjectName` field to Attendance model
- Field is populated automatically when creating/updating attendance
- Positioned between `date` and `status` fields

### Files Changed
- `backend/models/Attendance.js`
  - Added `subjectName` field (required, String)
- `backend/routes/attendance.js`
  - Set `subjectName: subject.name` when creating/updating attendance

### Database Migration
```javascript
// Add subjectName to existing records
const attendances = await db.attendances.find({}).toArray()
for (const attendance of attendances) {
  const subject = await db.subjects.findOne({ _id: attendance.subject })
  if (subject) {
    await db.attendances.updateOne(
      { _id: attendance._id },
      { $set: { subjectName: subject.name } }
    )
  }
}
```

---

## 8. Subject Name + ClassType Matching

### Problem
When marking attendance for "OOP lab", the system was incorrectly counting it under "OOP lecture" because it only matched by subject name.

### Solution
- Updated subject matching logic to match by BOTH name AND classType
- Added backend validation to verify classType matches before saving
- Returns error if there's a mismatch

### Files Changed
- `backend/routes/attendance.js`
  - Added validation: `if (subject.classType !== classType)` return error
- `frontend/components/attendance/visual-attendance-form.tsx`
  - Updated `matchedSubject` to find by: `s.name === cls.subject && s.classType === cls.classType`

---

## 9. Backend Double Counting Fix

### Problem
When updating existing attendance records, the backend was incrementing subject counters again, causing double counting.

### Solution
- Added `isNewRecord` flag to track if attendance is new or existing
- Only increment counters for new records
- For existing records, adjust counters based on status change (present→absent or vice versa)

### Files Changed
- `backend/routes/attendance.js`
  - Added `isNewRecord` and `oldStatus` variables
  - Conditional counter updates based on record status

---

## 10. Added Preparatory ClassType

### Problem
Preparatory classes weren't recognized as a valid classType in the Attendance model.

### Solution
- Added 'preparatory' to classType enum

### Files Changed
- `backend/models/Attendance.js`
  - Updated enum: `['lecture', 'lab', 'tutorial', 'seminar', 'workshop', 'sports', 'yoga', 'preparatory', 'none']`

---

## Summary of Database Schema Changes

### Attendance Collection

**Before:**
```javascript
{
  user: ObjectId,
  subject: ObjectId,
  date: Date,
  status: String,
  classType: String,
  notes: String,  // ❌ Removed
  isAutoMarked: Boolean,
  scheduleClassId: String,
  isPreparatory: Boolean,
  linkedSubjectId: ObjectId,
  calculationType: String,
  createdAt: Date
}

// Index: { user: 1, subject: 1, date: 1 }
```

**After:**
```javascript
{
  user: ObjectId,
  subject: ObjectId,
  date: Date,
  subjectName: String,  // ✅ Added
  status: String,
  classType: String,  // ✅ Added 'preparatory' to enum
  isAutoMarked: Boolean,
  scheduleClassId: String,
  isPreparatory: Boolean,
  linkedSubjectId: ObjectId,
  calculationType: String,
  createdAt: Date
}

// Index: { user: 1, subject: 1, date: 1, scheduleClassId: 1 }  // ✅ Updated
```

---

## Testing Checklist

- [ ] Mark individual class attendance (tick/cross buttons)
- [ ] Toggle attendance by clicking same button twice
- [ ] Mark all present/absent
- [ ] Upload attendance to database
- [ ] Verify UI colors persist after upload
- [ ] Change attendance after uploading
- [ ] Mark multiple slots of same subject (e.g., 3 OOP lab slots)
- [ ] Verify OOP lab attendance goes to OOP lab subject, not OOP lecture
- [ ] Check toast notifications appear on success/error
- [ ] Switch dates and verify localStorage persists marks
- [ ] Mark preparatory class attendance

---

## Migration Commands (Already Applied)

```bash
# 1. Update attendance index
node scripts/updateAttendanceIndex.js

# 2. Remove notes field
node scripts/removeAttendanceNotes.js

# 3. Add subjectName field
node scripts/addSubjectNameToAttendance.js
```

**Note:** All migrations have been successfully applied to the database.
