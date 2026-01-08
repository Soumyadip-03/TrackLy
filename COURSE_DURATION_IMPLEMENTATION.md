# Course Duration Implementation Summary

## Overview
Replaced `currentSemester` field in signup with `courseDuration` field. Users now select course duration (1-5 years) during signup, and set their current semester later in the Academic Period tab.

---

## Changes Made

### 1. Backend - User Model (`backend/models/User.js`)
**Added Field:**
```javascript
courseDuration: {
  type: Number,
  required: [true, 'Please provide course duration in years'],
  min: 1,
  max: 5
}
```
- Stores user's total course duration in years (1-5)
- Required field for all new users
- Used to calculate maximum available semesters (courseDuration × 2)

---

### 2. Backend - Auth Route (`backend/routes/auth.js`)
**Updated Registration Endpoint:**
- Changed validation from `currentSemester` to `courseDuration`
- Sets `currentSemester` to 1 by default for new users
- Updated welcome email to include course duration
- Creates default academic period with semester 1

**Request Body:**
```javascript
{
  name, 
  email, 
  password, 
  studentId,
  courseDuration,  // NEW: 1-5 years
  currentSemester  // Optional, defaults to 1
}
```

---

### 3. Frontend - Register Page (`frontend/app/(auth)/register/page.tsx`)
**Replaced Field:**
- **Old:** Current Semester dropdown (1-8)
- **New:** Course Duration dropdown (1-5 years)

**UI Changes:**
```tsx
<Label>Course Duration</Label>
<Select value={courseDuration} onChange={setCourseDuration}>
  {[1, 2, 3, 4, 5].map(year => (
    <SelectItem value={year}>
      {year} Year{year > 1 ? 's' : ''}
    </SelectItem>
  ))}
</Select>
```

---

### 4. Frontend - Auth Context (`frontend/lib/auth-context.tsx`)
**Updated signUp Function:**
```typescript
signUp(email, password, name, studentId, courseDuration)
```
- Accepts `courseDuration` instead of `currentSemester`
- Sends `currentSemester: 1` by default to backend
- Stores courseDuration in user object

---

### 5. Frontend - Academic Period Selector (`frontend/components/attendance/academic-period-selector.tsx`)
**Dynamic Semester Dropdown:**
```typescript
const maxSemester = (user?.courseDuration || 4) * 2;

// Dropdown shows: Semester 1 to maxSemester
Array.from({ length: maxSemester }, (_, i) => i + 1)
  .filter(sem => sem >= user?.currentSemester)
```

**Examples:**
- 2 year course → Semesters 1-4
- 3 year course → Semesters 1-6
- 4 year course → Semesters 1-8
- 5 year course → Semesters 1-10

---

### 6. Migration Script (`backend/scripts/addCourseDurationToUsers.js`)
**Purpose:** Add `courseDuration` field to existing users

**Logic:**
```javascript
const currentSem = user.currentSemester || 1;
const minDuration = Math.ceil(currentSem / 2);
const courseDuration = Math.max(minDuration, 4);
```

**Examples:**
- User in Semester 1-2 → 4 years (default)
- User in Semester 3-4 → 4 years
- User in Semester 5-6 → 4 years
- User in Semester 7-8 → 4 years
- User in Semester 9-10 → 5 years

**Run Command:**
```bash
cd backend
node scripts/addCourseDurationToUsers.js
```

---

## Workflow

### New User Signup Flow:
1. **Signup Page:**
   - User enters: Name, Email, Student ID, Password
   - User selects: **Course Duration (1-5 years)**
   - System sets: `currentSemester = 1` automatically

2. **After Login:**
   - User navigates to Profile → Academic Period tab
   - User selects: Current Semester (from dropdown based on course duration)
   - User sets: Start Date and End Date
   - System saves: `currentSemester` to User collection + AcademicPeriod collection

3. **Profile Info Tab:**
   - Displays: `currentSemester` fetched from User collection
   - Field is read-only (updated via Academic Period tab)

---

## Data Flow

```
Signup:
courseDuration (1-5 years) → User.courseDuration
currentSemester = 1 → User.currentSemester

Academic Period Tab:
User selects semester → Updates User.currentSemester
maxSemester = courseDuration × 2

Profile Info Tab:
Displays User.currentSemester (read-only)
```

---

## Validation Rules

### Course Duration:
- **Min:** 1 year
- **Max:** 5 years
- **Default:** 4 years (for existing users)

### Current Semester:
- **Min:** 1
- **Max:** courseDuration × 2
- **Default:** 1 (for new signups)
- **Dropdown Range:** currentSemester to maxSemester

---

## Components Affected (Verified No Breaking Changes)

### ✅ Preserved Workflows:
1. **Subject Collection:** Uses `req.user.currentSemester` (single source of truth)
2. **Attendance Routes:** No changes needed (uses subject references)
3. **Auto-Attendance:** No changes needed (queries subjects by semester)
4. **Schedule Routes:** No changes needed (independent of semester logic)
5. **Personal Info Form:** Displays currentSemester from User collection
6. **Academic Period Selector:** Now dynamically calculates max semester

### ✅ No Breaking Changes:
- All existing queries use `User.currentSemester`
- Academic Period creation/update unchanged
- Subject filtering by semester unchanged
- Attendance marking logic unchanged

---

## Testing Checklist

### New User Registration:
- [ ] Can select course duration (1-5 years)
- [ ] currentSemester defaults to 1
- [ ] Registration succeeds with courseDuration
- [ ] Welcome email includes course duration

### Academic Period Tab:
- [ ] Semester dropdown shows correct range (1 to courseDuration × 2)
- [ ] Can only select semesters >= currentSemester
- [ ] Saving updates User.currentSemester
- [ ] Profile Info tab reflects updated semester

### Existing Users (After Migration):
- [ ] Migration script adds courseDuration field
- [ ] Existing currentSemester values preserved
- [ ] Academic Period dropdown works correctly
- [ ] No data loss or corruption

### Edge Cases:
- [ ] 1 year course → Shows Semesters 1-2
- [ ] 5 year course → Shows Semesters 1-10
- [ ] User in Semester 8 with 4-year course → Can't select Semester 9+
- [ ] Changing semester updates profile info immediately

---

## Migration Instructions

### For Existing Users:
1. **Run Migration Script:**
   ```bash
   cd backend
   node scripts/addCourseDurationToUsers.js
   ```

2. **Verify Migration:**
   - Check MongoDB: All users have `courseDuration` field
   - Default value: 4 years (or calculated from currentSemester)

3. **No User Action Required:**
   - Existing users continue with current semester
   - Academic Period dropdown automatically adjusts

---

## Future Enhancements

### Potential Features:
1. **Course Duration Update:** Allow users to change course duration in profile settings
2. **Semester Validation:** Prevent selecting semester beyond course duration
3. **Graduation Tracking:** Auto-detect when user completes all semesters
4. **Course Extension:** Handle cases where users extend their course duration

---

## Summary

### What Changed:
- ✅ Signup: Course Duration (1-5 years) instead of Current Semester
- ✅ Academic Period: Dynamic semester dropdown based on course duration
- ✅ User Model: Added `courseDuration` field
- ✅ Default Behavior: New users start at Semester 1

### What Stayed Same:
- ✅ Current Semester stored in User collection
- ✅ Academic Period creation/update logic
- ✅ Subject and Attendance workflows
- ✅ Profile Info display
- ✅ All existing features preserved

### Key Benefits:
- ✅ More intuitive signup process
- ✅ Prevents invalid semester selection
- ✅ Flexible for different course durations
- ✅ No breaking changes to existing workflows
