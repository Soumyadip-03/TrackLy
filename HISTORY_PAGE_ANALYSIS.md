# History Page - Complete Analysis

## Overview
The History page provides comprehensive analytics and logs of user's attendance and activities through 3 main tabs.

---

## Tab 1: Attendance Trends 📊

### Purpose
Visualize attendance patterns over time using interactive charts

### Sub-Tabs

#### 1. Weekly View
**Data Source:** `attendance_records` from localStorage  
**Chart Type:** Area Chart (Blue)  
**Time Range:** Last 12 weeks  
**Calculation:**
```javascript
weeklyAttendance = (presentClasses / totalClasses) * 100
```

**Features:**
- Groups attendance by week (Monday-Sunday)
- Shows percentage (0-100%)
- Filters out holidays and off days
- X-axis: Week labels (e.g., "Week 1/4")
- Y-axis: Attendance percentage

**Example:**
```
Week 1/4: 85%
Week 1/11: 90%
Week 1/18: 78%
```

---

#### 2. Monthly View
**Data Source:** `attendance_records` from localStorage  
**Chart Type:** Area Chart (Purple)  
**Time Range:** Last 6 months  
**Calculation:**
```javascript
monthlyAttendance = (presentClasses / totalClasses) * 100
```

**Features:**
- Groups attendance by month
- Shows percentage (0-100%)
- X-axis: Month names (e.g., "Jan", "Feb")
- Y-axis: Attendance percentage

**Example:**
```
Dec: 82%
Jan: 88%
```

---

#### 3. By Subject View
**Data Source:** `attendance_records` + `subjects` from localStorage  
**Chart Type:** Multi-Line Chart (Different colors per subject)  
**Time Range:** All weeks with data  
**Calculation:**
```javascript
subjectWeeklyAttendance = (presentInSubject / totalInSubject) * 100
```

**Features:**
- Separate line for each subject
- Color-coded (Green, Orange, Purple, Pink, Cyan, Blue, Indigo)
- Shows attendance trend per subject over weeks
- Legend shows all subjects
- Compares performance across subjects

**Example:**
```
Week 1/4:
  - OS: 90%
  - DESIGN & ANALYSIS: 85%
  - OOP: 80%
```

---

### Data Processing Logic

**Auto-Present Feature:**
```javascript
generateAutoPresentRecords()
// Automatically marks past days as "present" if not manually marked
// Respects holidays and off days
```

**Filtering:**
- Excludes holidays (from `holidays` localStorage)
- Excludes off days (from `schedule.offDays`)
- Only shows weeks/months with actual data

**Empty State:**
- Shows "No Attendance Data" message
- Icon: AlertCircle
- Prompt: "Start marking your attendance to see your trends over time"

---

## Tab 2: Attendance Logs 📋

### Purpose
Show detailed day-by-day attendance records

### Data Source
`attendance_records` from localStorage

### Display Format

**Card Layout:**
```
┌─────────────────────────────────┐
│ Jan 9, 2026        [All Present]│
│ ✓ DESIGN & ANALYSIS             │
│ ✓ OS                            │
│ ✓ OOP                           │
└─────────────────────────────────┘
```

### Status Badges

**All Present (Green):**
- All classes marked present
- Background: `bg-green-100`
- Text: `text-green-800`

**Partial (Yellow):**
- Some present, some absent
- Background: `bg-yellow-100`
- Text: `text-yellow-800`

**All Absent (Red):**
- All classes marked absent
- Background: `bg-red-100`
- Text: `text-red-800`

### Features

**Grouping:**
- Groups records by date
- Shows all subjects for that date
- Sorted newest first

**Icons:**
- ✓ (CheckCircle2) - Present (Green)
- ✗ (XCircle) - Absent (Red)

**Empty State:**
- Icon: Calendar
- Message: "No attendance records found"
- Prompt: "Start marking your attendance to see logs here"

---

## Tab 3: Recent Activity 🕐

### Purpose
Timeline of all user actions across the app

### Data Source
`activity_log` from localStorage (auto-generated from multiple sources)

### Activity Types

#### 1. Attendance Activities
**Type:** `present` | `absent`  
**Icon:** CheckCircle2 (Green) | XCircle (Red)  
**Source:** `attendance_records`  
**Example:** "Marked present in OS"

#### 2. Todo Activities
**Type:** `todo_completed` | `todo_added`  
**Icon:** ListChecks (Indigo)  
**Source:** `todos`  
**Examples:**
- "Completed task: 'Submit assignment'"
- "Added new task: 'Study for exam'"

#### 3. Calendar Activities
**Type:** `calendar_event`  
**Icon:** CalendarDays (Blue)  
**Source:** `calendar_todos`  
**Example:** "Added calendar event: 'Project deadline'"

#### 4. Subject Activities
**Type:** `subject_added`  
**Icon:** (Purple background)  
**Source:** `subjects`  
**Example:** "Added subject: Operating Systems"

#### 5. Points Activities
**Type:** `points`  
**Icon:** Trophy (Yellow)  
**Example:** "Earned 10 points"

#### 6. Calculator Activities
**Type:** `calculator`  
**Icon:** Clock (Blue)  
**Example:** "Used attendance calculator"

---

### Filters

#### Type Filter
- **All Activities** - Shows everything
- **Attendance** - Only present/absent
- **Todo Items** - Only todo_completed/todo_added
- **Calendar** - Only calendar_event
- **Other** - Everything except above 3

#### Time Range Filter
- **Today** - Activities from today only
- **This Week** - Last 7 days
- **This Month** - Last 30 days
- **All Time** - Everything

---

### Display Format

**Activity Card:**
```
┌────────────────────────────────────────┐
│ [Icon] Marked present in OS            │
│        Today, 10:30 AM          [OS]   │
└────────────────────────────────────────┘
```

**Components:**
- **Icon** - Colored circle with activity icon
- **Description** - Action performed
- **Timestamp** - Relative time (Today, Yesterday, or date)
- **Subject Badge** - Optional, shows related subject

**Color Coding:**
- Present: Green background
- Absent: Red background
- Todo: Indigo background
- Calendar: Blue background
- Points: Yellow background
- Subject: Purple background

---

### Auto-Generation Logic

**How Activities are Created:**

1. **On Page Load:**
   - Scans `attendance_records`, `todos`, `calendar_todos`, `subjects`
   - Generates activities for items not already in `activity_log`
   - Avoids duplicates using `relatedId`

2. **Deduplication:**
```javascript
// Check if activity already exists
const exists = existingActivities.some(a => 
  a.id === newActivity.id || 
  a.relatedId === newActivity.relatedId
)
```

3. **Timestamp Handling:**
   - Uses actual creation/completion dates when available
   - Falls back to current time if not available
   - Stored as ISO string in localStorage
   - Converted to Date object for display

---

## Data Flow Diagram

```
User Actions
    ↓
Multiple Sources:
├─ attendance_records (Attendance tab)
├─ todos (Todo app)
├─ calendar_todos (Calendar)
└─ subjects (Profile)
    ↓
History Page Loads
    ↓
Process Data:
├─ Attendance Trends: Calculate weekly/monthly/subject stats
├─ Attendance Logs: Group by date, calculate status
└─ Recent Activity: Generate activities, filter, sort
    ↓
Display in UI
```

---

## Key Features

### ✅ Attendance Trends
- **Visual Analytics** - Charts show patterns over time
- **Multiple Views** - Weekly, Monthly, By Subject
- **Smart Filtering** - Excludes holidays and off days
- **Auto-Present** - Fills in past days automatically

### ✅ Attendance Logs
- **Daily Summary** - See all classes for each day
- **Status Badges** - Quick visual status (All Present/Partial/Absent)
- **Chronological** - Newest first
- **Subject Details** - Shows which subjects were present/absent

### ✅ Recent Activity
- **Unified Timeline** - All actions in one place
- **Smart Filters** - Filter by type and time range
- **Auto-Generated** - No manual logging needed
- **Relative Timestamps** - "Today", "Yesterday", or date
- **Color-Coded** - Easy visual identification

---

## Workflow Examples

### Example 1: Student Checks Weekly Trend
1. Navigate to History → Attendance Trends
2. Select "Weekly" tab
3. See blue area chart showing last 12 weeks
4. Identify weeks with low attendance
5. Take action to improve

### Example 2: Student Reviews Yesterday's Attendance
1. Navigate to History → Attendance Logs
2. Find yesterday's date card
3. See status badge (All Present/Partial/Absent)
4. Review which subjects were marked
5. Verify accuracy

### Example 3: Student Checks Recent Actions
1. Navigate to History → Recent Activity
2. Set filter to "This Week"
3. See timeline of all actions
4. Filter by "Attendance" to see only attendance activities
5. Review what was marked when

---

## Technical Implementation

### Data Storage
- **localStorage** - All data stored client-side
- **Keys Used:**
  - `attendance_records` - Attendance data
  - `subjects` - Subject list
  - `todos` - Todo items
  - `calendar_todos` - Calendar events
  - `activity_log` - Activity timeline
  - `holidays` - Holiday list
  - `schedule` - Class schedule with offDays

### Performance
- **Lazy Loading** - Data loaded only when tab is viewed
- **Memoization** - Calculations cached
- **Efficient Filtering** - Uses array methods (filter, map, reduce)
- **Sorting** - Pre-sorted for display

### Libraries Used
- **recharts** - Chart rendering (Area, Line charts)
- **date-fns** - Date manipulation and formatting
- **lucide-react** - Icons

---

## Future Enhancements

### Potential Features:
1. **Export Reports** - Download as PDF/CSV
2. **Comparison View** - Compare current vs previous semester
3. **Predictions** - Predict future attendance based on trends
4. **Notifications** - Alert when attendance drops below threshold
5. **Sharing** - Share reports with parents/advisors
6. **Goals** - Set attendance goals and track progress
7. **Insights** - AI-powered insights ("You attend OS more than OOP")

---

## Summary

**Attendance Trends:**
- 📊 Visual charts (Weekly, Monthly, By Subject)
- 📈 Shows attendance percentage over time
- 🎯 Helps identify patterns and trends

**Attendance Logs:**
- 📋 Day-by-day detailed records
- ✅ Status badges (All Present/Partial/Absent)
- 📅 Chronological list of all attendance

**Recent Activity:**
- 🕐 Unified timeline of all actions
- 🎨 Color-coded by activity type
- 🔍 Filterable by type and time range
- 🤖 Auto-generated from user data

**Overall Purpose:**
Provide comprehensive visibility into attendance patterns, help students track their progress, and maintain accountability through detailed logs and visual analytics.
