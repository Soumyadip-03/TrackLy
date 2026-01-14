# Profile Page Documentation

## Overview
The Profile Page is a comprehensive user management interface with 4 tabs: Personal Info, Academic Period, Subjects, and Schedule. Each tab manages specific aspects of the student's academic profile.

---

## Page Structure

### Main Page Component
**File:** `frontend/app/(main)/profile/page.tsx`

**Layout:**
- Full-screen flex container with overflow control
- Tabs component with 4 triggers (Personal Info, Academic Period, Subjects, Schedule)
- Each tab content is scrollable independently
- Uses `ClientOnly` wrapper for hydration safety

**Key Features:**
- Tab navigation with icons
- Responsive grid layout (4 columns)
- Reduced top margin (`mt-4`) for better space utilization

---

## Component 1: Personal Info Form

### File
`frontend/components/profile/personal-info-form.tsx`

### Purpose
Displays and manages user profile information with profile picture upload/removal functionality.

### State Management
```typescript
- profileData: { name, email, studentId, currentSemester, profilePicture }
- isAdmin: boolean (for admin badge display)
- isLoading: boolean
- isSaving: boolean
- hasChanges: boolean (tracks if profile picture changed)
- selectedFile: File | null
- previewUrl: string (for image preview)
```

### Workflow

1. **Load Profile Data**
   - Fetches user data from `/auth/me` endpoint
   - Formats profile picture path (ensures leading `/`)
   - Sets admin status if user role is 'admin'
   - Listens to `academicPeriodUpdated` and `profilePictureUpdated` events

2. **Profile Picture Upload**
   - Click avatar → triggers file input
   - File selected → creates preview using FileReader
   - Sets `selectedFile` and `previewUrl`
   - Save button enabled when file selected

3. **Save Changes**
   - Creates FormData with profile picture
   - POSTs to `/user/profile-picture`
   - Updates localStorage with new picture path
   - Dispatches `profilePictureUpdated` event
   - Clears preview and selected file

4. **Remove Picture**
   - DELETE request to `/user/profile-picture`
   - Clears profile picture from state and localStorage
   - Dispatches `profilePictureUpdated` event

### UI Elements
- Avatar with hover overlay (camera icon)
- Disabled input fields: Student ID, Course Duration, Current Semester
- Save button (only enabled when changes exist)
- Remove Picture button (only visible when picture exists)

---

## Component 2: Academic Period Selector

### File
`frontend/components/attendance/academic-period-selector.tsx`

### Purpose
Manages academic period dates and holidays for each semester.

### State Management
```typescript
- startDate: Date | undefined
- endDate: Date | undefined
- currentSemester: string
- maxSemester: number (calculated from courseDuration * 2)
- isPeriodSaved: boolean
- refreshKey: number (for HolidayList refresh)
```

### Workflow

1. **Initialize**
   - Calculates max semester from user's course duration
   - Loads academic period for current semester from `/academic-period/{semester}`
   - Validates dates (ignores if start and end are same)

2. **Save Academic Period**
   - Validates start/end dates
   - POSTs to `/academic-period` with semester, startDate, endDate
   - Updates user's currentSemester via `/user/profile`
   - Updates localStorage
   - Dispatches `academicPeriodUpdated` and `userUpdated` events
   - Sets `isPeriodSaved` to true

3. **Semester Change**
   - Fetches academic period for selected semester
   - Updates dates if period exists
   - Resets dates if no period found

4. **Holiday Management**
   - Shows HolidayManager and HolidayList only when period is saved
   - Refreshes HolidayList when holiday added via `refreshKey` increment

### Layout
- 2-column grid (xl breakpoint)
- Left column: Academic Period card + Holiday Manager card (stacked)
- Right column: Holiday List card (matches combined height of left cards)

---

## Component 3: Holiday Manager

### File
`frontend/components/attendance/holiday-manager.tsx`

### Purpose
Adds single or multiple holidays for the current semester.

### State Management
```typescript
- startDate: string (date input value)
- endDate: string (optional, for date range)
- reason: string (holiday reason)
- isLoading: boolean
```

### Workflow

1. **Validation**
   - Requires startDate and reason
   - Validates start date not after end date
   - Only shows if periodStart and periodEnd exist

2. **Add Holiday**
   - Creates Date objects from input strings
   - POSTs to `/holidays/range` with date range and reason
   - Clears form on success
   - Calls `onHolidayAdded` callback to refresh list
   - Shows count of holidays added

### UI Elements
- Start Date input (constrained by academic period)
- End Date input (optional, disabled until start date selected)
- Reason input (required)
- Add Holiday button (shows "Add Holidays" if date range)

---

## Component 4: Holiday List

### File
`frontend/components/attendance/holiday-list.tsx`

### Purpose
Displays all holidays for current semester with delete functionality.

### State Management
```typescript
- holidays: Holiday[] (array of holiday objects)
```

### Workflow

1. **Load Holidays**
   - Fetches from `/holidays/{currentSemester}`
   - Sorts by date (earliest first)
   - Re-loads when currentSemester changes

2. **Date Validation**
   - Checks if holiday is in past
   - Disables delete for past holidays
   - Shows "Past" badge for past holidays

3. **Remove Holiday**
   - Validates holiday is not in past
   - DELETE request to `/holidays/{holidayId}`
   - Reloads holiday list
   - Calls `onRefresh` callback

### UI Elements
- Scrollable list (max-height: 520px)
- Holiday cards with date badge and reason
- Delete button (only for future holidays)
- Past badge for expired holidays
- Empty state with calendar icon

---

## Component 5: Subject Manager

### File
`frontend/components/profile/subject-manager.tsx`

### Purpose
Displays all subjects with attendance tracking and course code editing.

### State Management
```typescript
- subjects: SubjectData[] (regular subjects)
- preparatorySubject: SubjectData | null (special preparatory subject)
- isLoading: boolean
- error: string | null
- editingId: string | null (subject being edited)
- editCode: string (temporary code value during edit)
- isClearing: boolean
- showClearDialog: boolean
```

### Workflow

1. **Load Subjects**
   - Fetches from subject service
   - Separates Preparatory subject from others
   - Formats data with attendance percentages

2. **Edit Course Code**
   - Click edit icon → enables inline editing
   - Updates code via subject service
   - Dispatches `subjectsUpdated` event
   - Reloads subjects

3. **Clear All Subjects**
   - Shows confirmation dialog
   - Warns about deletion of subjects and attendance records
   - Calls `subjectService.clearAll()`
   - Dispatches `subjectsUpdated` event

### UI Elements
- Grid layout (3 columns on large screens)
- Color-coded cards by class type
- Inline code editing with save/cancel buttons
- Attendance percentage display
- Special styling for Preparatory subject (amber gradient)
- Clear All button (destructive action)

---

## Component 6: Schedule Manager

### File
`frontend/components/profile/schedule-manager.tsx`

### Purpose
Manages weekly class schedule with day-wise tabs.

### State Management
```typescript
- schedule: { classes: ClassEntry[] }
- subjects: { name, classType }[] (for dropdown)
- offDays: string[] (days marked as off)
- newEntry: ClassEntry (form data for new class)
- isAdding: boolean
- editingId: string | null
- currentDay: string
- isUploading: boolean
```

### Workflow

1. **Load Data**
   - Loads schedule from `/schedule`
   - Loads subjects from subject service
   - Ensures each class has unique ID

2. **Add Class**
   - Click "Add Class" → shows form
   - Fill subject, class type, times, room
   - Validates required fields
   - Saves to database
   - Resets form

3. **Edit Class**
   - Click "Edit" → enables inline editing
   - Modify fields directly in table
   - Click "Save" → updates database

4. **Copy Class**
   - Duplicates class to next time slot
   - Calculates new times based on duration
   - Adds to schedule

5. **Delete Class**
   - Removes class from schedule
   - Updates database

6. **Off Days**
   - Checkbox to mark day as off
   - Hides classes for that day
   - Shows special off-day UI

7. **Upload to Subjects**
   - Extracts unique subjects from schedule
   - Creates Preparatory subject if none exist
   - Creates new subjects (skips duplicates)
   - Updates schedule with subject IDs
   - Shows count of created/skipped subjects

8. **Clear Schedule**
   - Confirmation dialog
   - DELETE request to `/schedule`
   - Clears all classes and off days

### UI Elements
- Day tabs with class count badges
- Scrollable class table (max-height: 360px)
- Add class form (collapsible)
- Subject dropdown (with custom option)
- Class type selector (9 types including break)
- Copy and delete buttons per class
- Upload to Subjects button with tooltip
- Clear Schedule button (destructive)

---

## Data Flow

### Event System
```
academicPeriodUpdated → PersonalInfoForm (updates current semester)
profilePictureUpdated → PersonalInfoForm (reloads profile)
subjectsUpdated → (notifies other components of subject changes)
userUpdated → (notifies of user profile changes)
```

### API Endpoints
```
GET  /auth/me                    - Get user profile
POST /user/profile-picture       - Upload profile picture
DELETE /user/profile-picture     - Remove profile picture
PUT  /user/profile               - Update user profile

GET  /academic-period/{semester} - Get academic period
POST /academic-period            - Save academic period

GET  /holidays/{semester}        - Get holidays
POST /holidays/range             - Add holiday range
DELETE /holidays/{id}            - Remove holiday

GET  /schedule                   - Get schedule
POST /schedule                   - Save schedule
DELETE /schedule                 - Clear schedule

Subject Service (via lib/services/subject-service.ts)
- getAll()                       - Get all subjects
- create(data)                   - Create subject
- update(id, data)               - Update subject
- clearAll()                     - Delete all subjects
```

### LocalStorage
```
trackly_token  - Authentication token
trackly_user   - User profile data (synced with server)
```

---

## Key Design Patterns

1. **Optimistic UI Updates**: Update state immediately, then sync with server
2. **Event-Driven Communication**: Components communicate via custom events
3. **Conditional Rendering**: Show/hide sections based on state (e.g., isPeriodSaved)
4. **Inline Editing**: Edit directly in display mode without separate forms
5. **Validation**: Client-side validation before API calls
6. **Error Handling**: Try-catch with user-friendly toast notifications
7. **Loading States**: Disable buttons and show loading indicators during async operations

---

## Styling Conventions

- **Cards**: `shadow-md hover:shadow-lg transition-all duration-300`
- **Spacing**: Reduced padding (`pt-3`, `pb-2`) for compact layout
- **Text Sizes**: `text-lg` for titles, `text-sm` for descriptions
- **Colors**: Class type-based color coding (blue=lecture, green=lab, etc.)
- **Scrolling**: Fixed max-heights with `overflow-y-auto`
- **Responsive**: Grid layouts with breakpoints (md, lg, xl)

---

## Rebuild Checklist

1. ✅ Create main profile page with 4 tabs
2. ✅ Implement PersonalInfoForm with profile picture upload
3. ✅ Implement AcademicPeriodSelector with date pickers
4. ✅ Implement HolidayManager with date range selection
5. ✅ Implement HolidayList with delete functionality
6. ✅ Implement SubjectManager with inline editing
7. ✅ Implement ScheduleManager with day tabs and CRUD operations
8. ✅ Set up event listeners for cross-component communication
9. ✅ Connect all API endpoints
10. ✅ Add validation and error handling
11. ✅ Test all workflows end-to-end
