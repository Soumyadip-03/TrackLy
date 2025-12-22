# 10 Components - Locations & Functionalities

## 1. **academic-period-selector.tsx**
**Location:** `components/attendance/academic-period-selector.tsx`

**Used In:**
- Attendance tracking pages
- Settings/Profile pages for academic period configuration

**Actual Functionality:** ✅ FULLY FUNCTIONAL
- Select semester (1-8)
- Set start and end dates for academic period
- Save semester periods to localStorage
- Load and display saved periods
- Validate date ranges (start date must be before end date)
- Dispatch custom event `academicPeriodUpdated` when period is saved
- Support multiple semesters with different date ranges
- Backward compatibility with legacy storage format

---

## 2. **multi-date-subject-selector.tsx**
**Location:** `components/attendance/multi-date-subject-selector.tsx`

**Used In:**
- Bulk attendance marking pages
- Attendance correction/adjustment features

**Actual Functionality:** ✅ FULLY FUNCTIONAL
- Select multiple subjects for multiple dates
- Calendar view and subject view modes
- Navigate between dates with prev/next buttons
- Mark subjects as absent/present for specific dates
- Display scheduled subjects for each date
- Show date overview with absence count
- Calculate total dates with absences
- Calculate total subjects marked absent
- Load subjects from localStorage with schedule information
- Extract subject schedules from class schedule data
- Dispatch selection changes to parent component

---

## 3. **target-attendance-calculator.tsx**
**Location:** `components/attendance/target-attendance-calculator.tsx`

**Used In:**
- Dashboard analytics
- Attendance planning pages
- Goal-setting features

**Actual Functionality:** ✅ FULLY FUNCTIONAL
- Calculate overall target attendance
- Calculate per-subject target attendance
- Set target percentage (50-100%) with slider
- Calculate required consecutive classes to reach target
- Display current attendance percentage
- Show if target is already achieved
- Load subjects and attendance records from localStorage
- Generate auto-present records for past classes
- Exclude holidays and off days from calculations
- Display results with visual progress bars
- Show detailed calculation results with recommendations

---

## 4. **connection-error-notification.tsx**
**Location:** `components/connection-error-notification.tsx`

**Used In:**
- App layout/root component
- Global error handling

**Actual Functionality:** ✅ FULLY FUNCTIONAL
- Monitor connection status
- Show error notification when connection fails
- Show offline mode enabled notification
- Show connection restored notification
- Track notification display state to avoid duplicates
- Use connection monitor hook with:
  - 30-second check interval
  - Auto-enable offline mode on 3 failed attempts
  - Auto-reconnect every 60 seconds
- Integrate with toast notification system
- Return null (no UI rendering - notification only)

---

## 5. **sync-indicator.tsx**
**Location:** `components/sync-indicator.tsx`

**Used In:**
- Header/Navigation bar
- Status bar components

**Actual Functionality:** ✅ FULLY FUNCTIONAL
- Display sync status (synced/offline/syncing)
- Show cloud icon when synced
- Show cloud-off icon when offline
- Show spinning refresh icon when syncing
- Manual sync trigger button
- Display last sync time in human-readable format
- Compact and full-size display modes
- Tooltip showing sync status and last sync time
- Call `performFullSync()` on button click
- Show success/error toast after sync attempt
- Only show for authenticated users

---

## 6. **mode-toggle.tsx**
**Location:** `components/mode-toggle.tsx`

**Used In:**
- Header/Navigation bar
- Theme switcher location

**Actual Functionality:** ✅ FULLY FUNCTIONAL
- Toggle between light and dark themes
- Support system preference option
- Use next-themes for theme management
- Dropdown menu with three options: Light, Dark, System
- Animated sun/moon icons
- Persist theme preference
- Responsive button with icon

---

## 7. **send-email-button.tsx**
**Location:** `components/send-email-button.tsx`

**Used In:**
- Dashboard
- Report generation pages
- Email action buttons

**Actual Functionality:** ✅ FULLY FUNCTIONAL
- Send attendance summary email to current user
- Generate HTML formatted email with attendance data
- Show loading state during email sending
- Display success/error toast notifications
- Call `sendEmailToCurrentUser()` API function
- Include attendance summary in email:
  - Overall attendance percentage
  - Courses at risk status
  - Last class attended information
- Handle errors gracefully

---

## 8. **settings-subject-list.tsx**
**Location:** `components/profile/settings-subject-list.tsx`

**Used In:**
- Settings/Profile page
- Subject management section

**Actual Functionality:** ✅ FULLY FUNCTIONAL
- Display subjects in card grid layout
- Add new subjects with form
- Edit existing subjects (inline editing)
- Delete individual subjects
- Clear all subjects at once
- Subject fields:
  - Name (required, auto-uppercase)
  - Code (optional)
  - Class Type (lecture, lab, tutorial, seminar, workshop, sports, yoga)
  - Classes per week (auto-calculated from schedule)
- Load subjects from localStorage
- Load schedule data to auto-calculate classes per week
- Group classes by subject-classType combination
- Color-coded cards by class type
- Save changes to localStorage
- Notify parent component of updates
- Show confirmation dialog before clearing all
- Toast notifications for all actions

---

## 9. **settings-todo-form.tsx**
**Location:** `components/todo/settings-todo-form.tsx`

**Used In:**
- Settings/Todo management page
- Todo configuration section

**Actual Functionality:** ✅ FULLY FUNCTIONAL
- Create new todos with form
- Edit existing todos
- Delete todos
- Mark todos as complete/incomplete
- Todo fields:
  - Title (required)
  - Description (optional)
  - Due date (optional, with calendar picker)
  - Priority (low, medium, high)
- Display todos in table format
- Load todos from localStorage
- Save todos to localStorage
- Show priority badges with color coding
- Show completion status with checkmark
- Disable edit button for completed todos
- Notify parent component of updates
- Toast notifications for all actions
- Form reset after adding todo

---

## 10. **subject-list.tsx**
**Location:** `components/profile/subject-list.tsx`

**Used In:**
- Profile page
- Subject display section

**Actual Functionality:** ✅ FULLY FUNCTIONAL
- Display subjects in table format
- Add new subjects
- Edit subjects (inline editing)
- Delete subjects
- Subject fields:
  - Name (required)
  - Code (required)
  - Classes per week (required)
- Load subjects from localStorage
- Save subjects to localStorage
- Show empty state when no subjects
- Inline editing with save/cancel
- Toast notifications for all actions
- Validate required fields before saving

---

## Summary

| Component | Status | Location | Functionality |
|-----------|--------|----------|----------------|
| academic-period-selector | ✅ Complete | attendance/ | Semester period management |
| multi-date-subject-selector | ✅ Complete | attendance/ | Bulk absence marking |
| target-attendance-calculator | ✅ Complete | attendance/ | Attendance goal calculation |
| connection-error-notification | ✅ Complete | root | Connection monitoring |
| sync-indicator | ✅ Complete | header | Data sync status |
| mode-toggle | ✅ Complete | header | Theme switching |
| send-email-button | ✅ Complete | dashboard | Email sending |
| settings-subject-list | ✅ Complete | profile/ | Subject management (settings) |
| settings-todo-form | ✅ Complete | todo/ | Todo management (settings) |
| subject-list | ✅ Complete | profile/ | Subject display (profile) |

**All 10 components have full functionality implemented!**
