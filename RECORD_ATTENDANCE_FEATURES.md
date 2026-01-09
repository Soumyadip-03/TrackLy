# Record Attendance - Feature Documentation

## Overview
The Record Attendance page is the primary interface for students to mark and manage their daily class attendance. It provides both manual and automated attendance tracking with intelligent features to simplify the attendance management process.

---

## Page Layout

### Two-Column Design
- **Left Column (35%)**: Calendar and Holiday information
- **Right Column (65%)**: Class list and attendance controls

---

## Core Features

### 1. Academic Period Validation
**Purpose**: Ensures attendance can only be recorded within the valid academic semester dates.

**How it works**:
- Loads academic period dates from the user's schedule (startDate and endDate)
- Validates selected dates against the academic period range
- Restricts calendar date selection to valid dates only

**User Experience**:
- Dates outside academic period are **disabled** (grayed out) in the calendar
- If user somehow selects an invalid date, displays: *"Selected date is outside academic period"*
- Valid dates show scheduled classes normally

**Technical Implementation**:
- Academic period loaded on component mount
- Date comparison uses normalized dates (year, month, day only - no time)
- Classes only load after academic period validation completes

---

### 2. Auto-Attendance System
**Purpose**: Automatically marks attendance for students who want to maintain consistent attendance without daily manual marking.

#### Toggle Button
- **Location**: Top of calendar card
- **States**: 
  - 🟢 **ON** (Green) - Auto-attendance enabled
  - 🔴 **OFF** (Red) - Auto-attendance disabled

#### When Enabled
**Immediate Actions**:
1. Marks ALL past classes as "present" from schedule start date to today
2. Skips holidays and off-days automatically
3. Creates notification with summary of marked classes

**Ongoing Behavior**:
1. **Hourly Checks**: Every hour, marks completed classes as "present"
2. **End of Day (11:59 PM)**: 
   - Auto-marks all unmarked classes as "present"
   - Uploads all pending records to database
   - Clears localStorage pending records

**User Control**:
- Can manually edit any auto-marked class before 11:59 PM
- Auto-marked classes show blue "Auto-Marked" badge
- Edits are saved in localStorage until upload

#### When Disabled
1. Stops automatic marking immediately
2. Uploads any pending records to database
3. User must mark attendance manually

**Confirmation Dialog**:
- Shows detailed explanation of what will happen
- Lists all actions that will be taken
- Requires explicit user confirmation

---

### 3. Calendar Interface

#### Date Selection
- Interactive calendar with month/year navigation
- Current date highlighted
- Selected date shows in header: "Thursday, 08 Jan 2026"
- Disabled dates (outside academic period) are grayed out

#### Visual Indicators
- **Today**: Highlighted with border
- **Selected**: White background
- **Disabled**: Gray, unclickable
- **Valid**: Normal, clickable

---

### 4. Holiday Display
**Purpose**: Shows holidays for the current month to help users understand why certain dates have no classes.

**Features**:
- Lists all holidays in the selected month
- Format: "05 Jan - Republic Day"
- Updates automatically when month changes
- Shows "No holiday in [Month] month" if none exist

**Integration**:
- Auto-attendance skips holiday dates
- Holidays don't count toward attendance calculations

---

### 5. Class List Display

#### Header Information
- **Title**: "Classes"
- **Count**: Total number of classes for selected date
- **Date**: Full date display (e.g., "Thursday, 08 Jan 2026")

#### Class Card Details
Each class shows:
- **Subject Name**: Bold, prominent
- **Class Type**: Lecture, Lab, Tutorial (capitalized)
- **Time**: Start - End time (e.g., "10:00 - 11:00")
- **Room**: Building and room number (if available)
- **Status Indicators**:
  - 🟢 Green background: Marked Present
  - 🔴 Red background: Marked Absent
  - ⚪ White background: Unmarked
  - 🔵 Blue ring: Auto-marked (pending upload)

#### Status Badges
- **"Auto-Marked"** (Blue): Class marked by auto-attendance system
- **"Preparatory"** (Amber): Class tagged as preparatory

---

### 6. Manual Attendance Marking

#### Individual Class Marking
**Present Button (✓)**:
- Click to mark present
- Click again to clear status (toggle)
- Green icon and background when active

**Absent Button (✗)**:
- Click to mark absent
- Click again to clear status (toggle)
- Red icon and background when active

**Behavior**:
- Toggle functionality: clicking same button clears status
- Instant visual feedback
- Updates local state immediately
- If class is auto-marked, removes from pending records

---

### 7. Preparatory Class Tagging
**Purpose**: Allows students to tag extra classes (not in schedule) as "Preparatory" which counts toward a separate Preparatory subject.

#### How to Use
1. Select unmarked class from dropdown
2. Dropdown shows: "Subject • Time"
3. Click "Okay" button
4. Class gets amber "Preparatory" badge

#### Features
- Only shows unmarked, non-auto-marked classes
- Can remove tag by clicking the badge
- Attendance counts toward "Preparatory" subject instead of original
- Dropdown resets after selection

#### Use Cases
- Extra classes attended
- Makeup classes
- Additional study sessions
- Classes from other sections

---

### 8. Bulk Actions

#### Mark All Present
- Marks all classes for the day as present
- Clears any auto-marked pending status
- Removes pending records from localStorage
- Instant update across all classes

#### Mark All Absent
- Marks all classes for the day as absent
- Clears any auto-marked pending status
- Removes pending records from localStorage
- Instant update across all classes

**Button States**:
- Disabled when no classes scheduled
- Green/Red color coding
- Hover effects for better UX

---

### 9. Upload Attendance

#### Upload Button
**Enabled When**:
- At least one class has status marked
- Not currently uploading
- Classes exist for the day

**Disabled When**:
- No classes scheduled
- No classes marked
- Upload in progress

#### Upload Process
1. Validates each class has matching subject
2. Uploads each class individually to `/attendance/per-subject`
3. Includes all metadata:
   - Date, subject ID, status
   - Class type, schedule class ID
   - Preparatory tag status
   - Start/end time
4. Clears pending records for uploaded classes
5. Shows success/error count

#### Success Feedback
- Toast notification: "Attendance Uploaded!"
- Shows count: "Successfully uploaded X record(s)"
- If errors: "X failed"
- Reloads classes from database to sync

#### Error Handling
- Continues uploading even if some fail
- Logs errors to console
- Shows error count to user
- Doesn't clear pending for failed uploads

---

### 10. Auto-Marked Class Editing

#### Visual Identification
- Blue ring around class card
- "Auto-Marked" badge
- Same marking buttons available

#### Editing Behavior
**Change Status**:
- Click Present/Absent button
- Updates pending record in localStorage
- Badge remains (still pending)
- New status saved for 11:59 PM upload

**Clear Status**:
- Click same button again
- Removes from pending records
- Badge disappears
- Class becomes unmarked

**Manual Upload**:
- Can upload before 11:59 PM
- Clears from pending after successful upload
- Won't be uploaded again at 11:59 PM

---

## State Management

### Local State
- `selectedDate`: Currently selected calendar date
- `classes`: Array of class slots with status
- `academicPeriod`: Start and end dates
- `periodLoaded`: Flag indicating period loaded
- `loading`: Classes loading state
- `uploading`: Upload in progress state

### Persistent State (localStorage)
- `autoAttendance_pending`: Pending auto-marked records
- `autoAttendance_lastUpload`: Last upload date
- Auto-attendance enabled status

### Database State
- Uploaded attendance records
- Subject information
- Schedule data
- Holiday data

---

## Data Flow

### On Component Mount
1. Load academic period from schedule
2. Set `periodLoaded` flag
3. Load classes for selected date (if period loaded)
4. Load holidays for current month

### On Date Change
1. Validate date against academic period
2. If invalid: Show message, clear classes
3. If valid: Load schedule for that day
4. Check database for existing attendance
5. Check localStorage for pending records
6. Merge and display

### On Manual Mark
1. Update local state immediately
2. If auto-marked: Update/remove pending record
3. Visual feedback instant
4. No database call until upload

### On Upload
1. Validate all marked classes
2. Upload each to database
3. Clear pending records
4. Reload from database
5. Show success/error feedback

---

## Edge Cases Handled

### 1. Date Outside Academic Period
- Calendar disables dates
- Shows appropriate message
- No classes loaded
- Upload button disabled

### 2. No Classes Scheduled
- Shows "No classes scheduled for this day"
- Disables all action buttons
- Hides preparatory section

### 3. Auto-Marked Before Manual Upload
- Allows editing
- Clears from pending on upload
- Prevents duplicate at 11:59 PM

### 4. Network Errors
- Shows error toast
- Doesn't clear pending records
- Allows retry
- Logs to console

### 5. Subject Mismatch
- Validates subject exists
- Checks class type matches
- Skips invalid classes
- Shows error count

### 6. Concurrent Edits
- Local state takes precedence
- Database reload syncs state
- Pending records preserved

---

## Performance Optimizations

### 1. Lazy Loading
- Academic period loaded once on mount
- Classes loaded only when date changes
- Holidays loaded per month, not per day

### 2. Conditional Rendering
- Classes only render when loaded
- Preparatory section hidden when no classes
- Buttons disabled when not applicable

### 3. Efficient State Updates
- Local state updates instant
- Database calls batched where possible
- Pending records in localStorage (not re-fetched)

### 4. Smart Validation
- Date validation before API calls
- Subject validation before upload
- Prevents unnecessary network requests

---

## User Experience Highlights

### Visual Feedback
- Color-coded status (green/red/blue)
- Instant button state changes
- Loading indicators
- Toast notifications
- Disabled state styling

### Intuitive Controls
- Toggle buttons for status
- Bulk actions for efficiency
- Clear labels and icons
- Confirmation dialogs for critical actions

### Error Prevention
- Disabled dates in calendar
- Validation before upload
- Confirmation for auto-attendance
- Clear error messages

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast colors
- Clear focus indicators

---

## Integration Points

### Backend APIs
- `GET /schedule` - Load schedule and academic period
- `GET /subject` - Load subject details
- `GET /attendance/range` - Load existing attendance
- `POST /attendance/per-subject` - Upload attendance
- `GET /holidays` - Load holidays
- `GET /auto-attendance/status` - Check auto-attendance state
- `PUT /auto-attendance/toggle` - Toggle auto-attendance
- `POST /auto-attendance/mark-past` - Mark past classes
- `POST /auto-attendance/bulk-upload` - Upload pending records

### Custom Hooks
- `useAutoAttendance` - Auto-attendance logic and state
- `useToastNotification` - Toast notifications

### External Libraries
- `date-fns` - Date formatting and manipulation
- `lucide-react` - Icons
- `@radix-ui` - UI components (Calendar, Dialog)

---

## Future Enhancement Possibilities

1. **Attendance Patterns**: Show attendance trends
2. **Quick Actions**: Swipe gestures for mobile
3. **Batch Date Selection**: Mark multiple dates at once
4. **Attendance Reminders**: Notifications for unmarked classes
5. **Offline Mode**: Queue uploads when offline
6. **Export**: Download attendance records
7. **Statistics**: Show attendance percentage per subject
8. **Filters**: Filter by subject, status, or date range

---

## Technical Notes

### Component Structure
- Functional component with hooks
- TypeScript for type safety
- Modular function design
- Clear separation of concerns

### State Management Pattern
- React hooks (useState, useEffect)
- Custom hooks for complex logic
- localStorage for persistence
- Database for permanent storage

### Error Handling
- Try-catch blocks for async operations
- Console logging for debugging
- User-friendly error messages
- Graceful degradation

### Code Quality
- TypeScript interfaces for type safety
- Descriptive variable names
- Commented complex logic
- Consistent formatting
