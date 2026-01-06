# Preparatory Class System - New Implementation

## Overview
Complete redesign of the preparatory class system. Preparatory is now a tag-based system where users can mark multiple subjects as preparatory on the same day, and those tagged slots count toward a dedicated "Preparatory" subject instead of the original subject.

---

## Key Changes

### 1. **Default Preparatory Subject**
- Every user now has a "Preparatory" subject by default
- Initial values: `totalClasses = 0`, `attendedClasses = 0`
- Created automatically for new users
- Migration script adds it to existing users

### 2. **Tag-Based System**
- Preparatory is now a **tag** that can be applied to any class slot
- Multiple subjects can be tagged as preparatory on the same day
- Tags are visible as amber badges next to subject names
- Tags can be removed before upload

### 3. **Dropdown Filtering**
- Preparatory dropdown shows **ONLY unmarked subjects** (no tick/cross)
- Once a subject is marked (present/absent), it disappears from dropdown
- Prevents tagging already-marked subjects

### 4. **UI Changes**
- Removed tick/cross buttons from preparatory slot
- Added "Okay" button to apply preparatory tag
- Tag appears as amber badge: `[Preparatory] ✕`
- Clicking ✕ removes the tag
- Dropdown resets to "Select" after tagging

### 5. **Counter Logic**
**Tagged Subjects:**
- Original subject counters = **FROZEN** (no increment)
- Preparatory subject counters = **INCREMENT**
- Present: `Preparatory.totalClasses++`, `Preparatory.attendedClasses++`
- Absent: `Preparatory.totalClasses++`

**Normal Subjects:**
- Work as before (increment their own counters)

### 6. **Persistence**
- Tags saved in localStorage: `preparatory_tags_YYYY-MM-DD`
- Tags persist on page refresh
- Tags saved to database on upload
- Tags stay visible after upload

---

## Database Changes

### Attendance Model
**New Field:**
```javascript
hasPreparatoryTag: {
  type: Boolean,
  default: false
}
```

### Subject Collection
**New Default Subject:**
```javascript
{
  name: 'Preparatory',
  code: 'PREP',
  classType: 'preparatory',
  totalClasses: 0,
  attendedClasses: 0
}
```

---

## Files Modified

### Backend
1. **`backend/models/Attendance.js`**
   - Added `hasPreparatoryTag` field

2. **`backend/routes/attendance.js`**
   - Modified `/per-subject` route to handle `hasPreparatoryTag`
   - If `hasPreparatoryTag = true`, updates Preparatory subject counters
   - If `hasPreparatoryTag = false`, updates original subject counters

3. **`backend/scripts/addPreparatorySubjectToAllUsers.js`** (NEW)
   - Migration script to add Preparatory subject to all existing users

### Frontend
4. **`frontend/components/attendance/visual-attendance-form.tsx`**
   - Added `hasPreparatoryTag` to ClassSlot interface
   - Replaced `preparatoryStatus` state with `preparatoryTags` Set
   - Added `getPreparatoryTagsKey()` function
   - Updated `loadLocalAttendance()` to load tags
   - Added `savePreparatoryTags()` function
   - Added `addPreparatoryTag()` function
   - Added `removePreparatoryTag()` function
   - Updated `uploadAttendance()` to send `hasPreparatoryTag` flag
   - Updated UI to show amber tag badges
   - Filtered dropdown to show only unmarked subjects
   - Replaced tick/cross with "Okay" button

---

## User Workflow

### Step 1: Select Subject
User opens preparatory dropdown → Sees only unmarked subjects

### Step 2: Click "Okay"
- Amber "Preparatory" tag appears next to subject name
- Dropdown resets to "Select"
- Tag saved to localStorage

### Step 3: Mark Attendance
User clicks tick/cross on tagged subject:
- ✓ Present: Preparatory totalClasses++, attendedClasses++
- ✗ Absent: Preparatory totalClasses++
- Original subject counters = FROZEN

### Step 4: Upload
- All attendance records saved to database
- Tagged subjects have `hasPreparatoryTag: true`
- Tags remain visible after upload

### Step 5: Remove Tag (Optional)
User clicks ✕ on tag → Tag removed → Subject counters unfrozen

---

## Migration Instructions

### Run Migration Script
```bash
cd backend
node scripts/addPreparatorySubjectToAllUsers.js
```

**Output:**
```
MongoDB Connected...
Found 10 users
✅ Added Preparatory subject for user: user1@example.com
✅ Added Preparatory subject for user: user2@example.com
...
=== Migration Complete ===
Added: 10
Skipped: 0
Total: 10
```

---

## Testing Checklist

- [ ] Run migration script successfully
- [ ] New users automatically get Preparatory subject
- [ ] Preparatory dropdown shows only unmarked subjects
- [ ] Click "Okay" → Tag appears on subject
- [ ] Tag persists on page refresh (localStorage)
- [ ] Click ✕ → Tag removed
- [ ] Tag multiple subjects on same day
- [ ] Mark tagged subject present → Preparatory counters increment
- [ ] Mark tagged subject absent → Only Preparatory totalClasses increments
- [ ] Upload attendance → Tags saved to database
- [ ] Tags visible after upload
- [ ] Open on another device → Tags visible (from database)
- [ ] Original subject counters frozen for tagged slots

---

## Key Differences from Old System

| Feature | Old System | New System |
|---------|-----------|------------|
| Preparatory UI | Separate card at bottom | Tag on subject slot |
| Multiple preparatory | No (only one) | Yes (multiple tags) |
| Subject selection | All subjects | Only unmarked subjects |
| Action button | Tick/Cross | "Okay" button |
| Tag removal | No | Yes (✕ button) |
| Counter behavior | Separate "Preparatory Paper" | Dedicated "Preparatory" subject |
| Visibility | Disappears after marking | Stays visible as tag |
| Database field | `isPreparatory` + `linkedSubjectId` | `hasPreparatoryTag` |

---

## Benefits

1. **Clearer UX**: Tag visually shows which slots are preparatory
2. **Multiple tags**: Can mark multiple preparatory classes per day
3. **Flexible**: Can remove tags before upload
4. **Consistent**: Tags persist across devices after upload
5. **Accurate counting**: Preparatory subject has its own attendance percentage
6. **No confusion**: Original subject counters frozen for tagged slots

---

## Notes

- Preparatory subject is **NOT** included in overall attendance calculation (can be configured)
- Tags are date-specific (different tags for different dates)
- Removing a tag after upload requires re-uploading attendance
- Preparatory subject appears in subject list like any other subject
