# History Page Documentation

## Overview
The History Page provides comprehensive attendance analytics and historical data with 3 tabs: Attendance Report (charts), Attendance Logs (detailed records), and Previous Semesters (archived data).

---

## Page Structure

### Main Page Component
**File:** `frontend/app/(main)/history/page.tsx`

**Layout:**
- Full-screen flex container with overflow control
- Tabs component with 3 triggers (Attendance Report, Attendance Logs, Previous Semesters)
- Each tab content is scrollable independently
- Top margin: `mt-6` for spacing

**Key Features:**
- Tab navigation with icons (BarChart, ClipboardList, Archive)
- Responsive grid layout (3 columns)
- No separate report page - all analytics integrated in History

---

## Component 1: Attendance Report

### File
`frontend/components/history/attendance-report.tsx`

### Purpose
Displays attendance trends through interactive charts (weekly, monthly, by subject).

### State Management
```typescript
- weeklyData: WeeklyData[] (last 12 weeks attendance %)
- monthlyData: MonthlyData[] (last 6 months attendance %)
- subjectData: SubjectData[] (per-subject attendance %)
- isLoading: boolean
- hasData: boolean (determines if data exists)
```

### Workflow

1. **Load Attendance Data**
   - Fetches from `/attendance/history`
   - Fetches subjects from subject service
   - Converts date strings to Date objects
   - Sorts records chronologically
   - Calculates three chart datasets

2. **Calculate Weekly Attendance**
   - Uses `eachWeekOfInterval` from date-fns
   - Limits to last 12 weeks if more exist
   - Groups records by week (Monday start)
   - Calculates percentage: (present / total) * 100
   - Filters out weeks with no data

3. **Calculate Monthly Attendance**
   - Uses `eachMonthOfInterval` from date-fns
   - Shows last 6 months maximum
   - Groups records by month
   - Calculates percentage per month
   - Filters out months with no data

4. **Calculate Subject Attendance**
   - Groups by subject name + class type combination
   - Counts present vs total per subject
   - Adds class type abbreviation to display name
   - Maps: lecture→LEC, lab→LAB, tutorial→TUT, etc.

5. **Event Listeners**
   - Listens to `attendanceUpdated` event
   - Auto-refreshes when new attendance marked
   - Manual refresh button available

### UI Elements
- **Tabs**: Weekly, Monthly, By Subject
- **Charts**: 
  - Weekly/Monthly: AreaChart (blue/purple gradient)
  - By Subject: LineChart with angled labels
- **Empty State**: Shows when no data exists
- **Loading State**: Spinner during data fetch
- **Refresh Button**: Manual reload with spinning icon

### Chart Configuration
```typescript
Weekly Chart: Blue (#0ea5e9), Area fill with 20% opacity
Monthly Chart: Purple (#8b5cf6), Area fill with 20% opacity
Subject Chart: Purple line, 2px width, 5px dots
Y-Axis: Domain [0, 100] for percentage
Tooltip: Custom styled with theme colors
```

---

## Component 2: Attendance Logs

### File
`frontend/components/history/attendance-logs.tsx`

### Purpose
Displays detailed day-by-day attendance records with filtering options.

### State Management
```typescript
- logs: ProcessedLog[] (all processed logs)
- filteredLogs: ProcessedLog[] (after applying filters)
- isLoading: boolean
- dayFilter: string (filter by day of week)
- statusFilter: string (filter by present/absent/preparatory)
- availableDays: string[] (days from schedule)
```

### Workflow

1. **Load Attendance Logs**
   - Fetches current schedule from `/schedule/current`
   - Extracts available days (excluding off days)
   - Fetches attendance history from `/attendance/history`
   - Filters records within current academic period dates

2. **Process Records**
   - Groups records by date (yyyy-MM-dd format)
   - Calculates day status: present/partial/absent
   - Converts date to day of week (Monday-Sunday)
   - Sorts by date (newest first)

3. **Apply Filters**
   - **Day Filter**: Shows only selected day's records
   - **Status Filter**: 
     - "present" → shows only present subjects
     - "absent" → shows only absent subjects
     - "preparatory" → shows only preparatory tagged subjects
     - "all" → shows everything

4. **Day Status Logic**
   ```
   All subjects present → "present"
   All subjects absent → "absent"
   Mixed → "partial"
   ```

5. **Event Listeners**
   - Listens to `attendanceUpdated` event
   - Auto-refreshes when new attendance marked

### UI Elements
- **Filters**: Day dropdown, Status dropdown
- **Refresh Button**: Manual reload
- **Log Cards**: 
  - Date + Day of week
  - Overall status badge (green/yellow/red)
  - Subject list with icons
  - Class type and time duration
  - Preparatory tag (amber badge)
- **Empty State**: Shows when no records or filters exclude all

### Color Coding
```
Present: Green border-left, CheckCircle2 icon
Absent: Red border-left, XCircle icon
All Present: Green badge
Partial: Yellow badge
All Absent: Red badge
Preparatory: Amber badge
```

---

## Component 3: Previous Semesters

### File
`frontend/components/history/previous-semesters.tsx`

### Purpose
Displays archived semester data with overall and per-subject attendance statistics.

### State Management
```typescript
- semesters: ArchivedSemester[] (list of completed semesters)
- isLoading: boolean
```

### Workflow

1. **Load Archived Semesters**
   - Fetches from `/academic-period/archived/all`
   - Receives pre-calculated statistics from backend
   - Each semester includes:
     - Semester number
     - Start/End dates
     - Total attended/total classes
     - Overall percentage
     - Subject-wise breakdown

2. **Display Logic**
   - Shows semesters in cards
   - Each card has gradient header
   - Overall attendance in highlighted section
   - Subjects in 2-column grid (responsive)

3. **Percentage Color Coding**
   ```typescript
   >= 75% → Green
   >= 60% → Yellow
   < 60% → Red
   ```

### UI Elements
- **Semester Cards**: 
  - Header with semester number and date range
  - Overall attendance section (highlighted)
  - Subjects grid (2 columns on md+)
  - Each subject shows: name, code, class type, attendance
- **Empty State**: Shows when no archived semesters
- **Loading State**: Spinner during fetch

### Card Structure
```
┌─────────────────────────────────────┐
│ 🎓 Semester X    📅 DD/MM - DD/MM  │ ← Gradient header
├─────────────────────────────────────┤
│ Total Attendance: XX/XX (XX%)       │ ← Highlighted
├─────────────────────────────────────┤
│ 📚 Subjects                         │
│ ┌──────────┬──────────┐            │
│ │ Subject1 │ Subject2 │            │ ← 2-column grid
│ │ XX/XX    │ XX/XX    │            │
│ └──────────┴──────────┘            │
└─────────────────────────────────────┘
```

---

## Data Flow

### Event System
```
attendanceUpdated → AttendanceReport (reloads charts)
attendanceUpdated → AttendanceLogs (reloads logs)
```

### API Endpoints
```
GET /attendance/history           - Get all attendance records
GET /schedule/current             - Get current schedule with dates
GET /academic-period/archived/all - Get archived semesters with stats

Subject Service (via lib/services/subject-service.ts)
- getAll()                        - Get all subjects for mapping
```

### Data Processing Pipeline

#### Attendance Report:
```
Raw Records → Parse Dates → Sort → Group by Week/Month/Subject → Calculate % → Chart Data
```

#### Attendance Logs:
```
Raw Records → Filter by Date Range → Group by Date → Calculate Status → Sort → Apply Filters → Display
```

#### Previous Semesters:
```
Backend Pre-calculated → Fetch → Display (no client-side processing)
```

---

## Key Algorithms

### 1. Weekly Attendance Calculation
```typescript
1. Get all weeks in date range (Monday start)
2. Limit to last 12 weeks
3. For each week:
   - Filter records in week range
   - Count present vs total
   - Calculate percentage
4. Filter out empty weeks
```

### 2. Day of Week Conversion
```typescript
getDay() returns: 0=Sunday, 1=Monday, ..., 6=Saturday
Convert to: Monday=0, Tuesday=1, ..., Sunday=6
Formula: (dayIndex + 6) % 7
```

### 3. Subject Grouping Key
```typescript
Key = `${subjectName}_${classType}`
Example: "Mathematics_lecture", "Physics_lab"
Prevents merging different class types of same subject
```

### 4. Status Determination
```typescript
if (presentCount === totalCount) → "present"
else if (presentCount === 0) → "absent"
else → "partial"
```

---

## Chart Libraries

### Recharts Components Used
```typescript
- AreaChart: For weekly/monthly trends
- LineChart: For subject comparison
- CartesianGrid: Grid lines
- XAxis, YAxis: Axes
- Tooltip: Hover information
- ResponsiveContainer: Auto-sizing
```

### Chart Customization
- Custom tooltip styling (theme-aware)
- Angled labels for subject chart (-45°)
- Fixed Y-axis domain [0, 100]
- No vertical grid lines (cleaner look)
- Gradient fills with opacity

---

## Date Handling

### Libraries Used
```typescript
date-fns functions:
- format: Display formatting
- parseISO: String to Date
- isWithinInterval: Date range check
- startOfWeek, endOfWeek: Week boundaries
- eachWeekOfInterval: Generate weeks
- eachMonthOfInterval: Generate months
- startOfMonth, endOfMonth: Month boundaries
- subMonths: Subtract months
- formatISO: Date to ISO string
- getDay: Get day of week
```

### Date Formats
```
Display: "MMM d, yyyy" → "Jan 5, 2024"
Month: "MMM" → "Jan"
Date Range: "dd/MM/yyyy" → "05/01/2024"
Storage: ISO 8601 → "2024-01-05T00:00:00.000Z"
```

---

## Filtering Logic

### Day Filter
```typescript
if (dayFilter !== "all") {
  filtered = logs.filter(log => log.dayOfWeek === dayFilter)
}
```

### Status Filter
```typescript
if (statusFilter === "preparatory") {
  // Show only subjects with preparatory tag
  filtered = logs.map(log => ({
    ...log,
    subjects: log.subjects.filter(s => s.hasPreparatoryTag)
  })).filter(log => log.subjects.length > 0)
}
else if (statusFilter !== "all") {
  // Show only subjects with matching status
  filtered = logs.map(log => ({
    ...log,
    subjects: log.subjects.filter(s => s.status === statusFilter)
  })).filter(log => log.subjects.length > 0)
}
```

---

## Styling Conventions

### Cards
- `shadow-md hover:shadow-lg transition-all` - Elevation on hover
- Gradient headers for Previous Semesters
- Compact padding: `pt-3 pb-3 px-4`

### Colors
- **Green**: Present, >= 75%
- **Yellow**: Partial, >= 60%
- **Red**: Absent, < 60%
- **Blue**: Weekly chart (#0ea5e9)
- **Purple**: Monthly/Subject charts (#8b5cf6)
- **Amber**: Preparatory tag

### Spacing
- Chart height: `300px`
- Logs max-height: `500px` with scroll
- Card spacing: `space-y-4`
- Subject grid: 2 columns on md+

### Typography
- Card titles: `text-xl`
- Section labels: `text-xs font-semibold`
- Percentages: `font-bold` with color coding
- Dates: `text-xs text-muted-foreground`

---

## Performance Optimizations

1. **Memoization**: Date calculations done once, not per render
2. **Filtering**: Client-side filtering for instant response
3. **Lazy Loading**: Charts only render when tab active
4. **Event Cleanup**: Remove listeners on unmount
5. **Conditional Rendering**: Empty states prevent unnecessary processing

---

## Error Handling

### All Components
```typescript
try {
  // API calls
} catch (error) {
  console.error("Error:", error)
  toast({
    title: "Error",
    description: "Failed to load data",
    variant: "destructive"
  })
} finally {
  setIsLoading(false)
}
```

### Empty States
- No data: Show helpful message with icon
- No filtered results: Suggest adjusting filters
- Loading: Show spinner

---

## Rebuild Checklist

### 1. History Page
- ✅ Create main page with 3 tabs
- ✅ Set up tab navigation with icons
- ✅ Configure overflow and scrolling

### 2. Attendance Report
- ✅ Set up state for 3 chart types
- ✅ Implement data fetching from API
- ✅ Create weekly calculation function
- ✅ Create monthly calculation function
- ✅ Create subject calculation function
- ✅ Set up Recharts components
- ✅ Add refresh functionality
- ✅ Add event listener for auto-refresh
- ✅ Create empty and loading states

### 3. Attendance Logs
- ✅ Set up state for logs and filters
- ✅ Fetch schedule for available days
- ✅ Fetch and process attendance records
- ✅ Group records by date
- ✅ Calculate day status
- ✅ Implement day filter
- ✅ Implement status filter
- ✅ Create log card UI
- ✅ Add refresh functionality
- ✅ Add event listener for auto-refresh

### 4. Previous Semesters
- ✅ Set up state for semesters
- ✅ Fetch archived data from API
- ✅ Create semester card layout
- ✅ Implement percentage color coding
- ✅ Create 2-column subject grid
- ✅ Add loading and empty states

### 5. Integration
- ✅ Connect all components to History page
- ✅ Test tab switching
- ✅ Test data refresh
- ✅ Test filters
- ✅ Test responsive design
- ✅ Verify event listeners work

---

## Testing Scenarios

1. **No Data**: All components show appropriate empty states
2. **Single Record**: Charts display correctly with minimal data
3. **Large Dataset**: Performance remains smooth, charts readable
4. **Filter Combinations**: All filter combinations work correctly
5. **Date Boundaries**: Week/month calculations handle edge cases
6. **Responsive**: Layout adapts to mobile/tablet/desktop
7. **Theme**: Charts and colors work in light/dark mode
8. **Real-time Updates**: Event listeners trigger refreshes

---

## Common Issues & Solutions

### Issue: Charts not displaying
**Solution**: Ensure ResponsiveContainer has explicit height

### Issue: Wrong day of week
**Solution**: Use `(getDay() + 6) % 7` conversion

### Issue: Empty weeks in chart
**Solution**: Filter out weeks with no records

### Issue: Subject names too long
**Solution**: Use angled labels and truncate if needed

### Issue: Filters not working
**Solution**: Ensure filter state updates trigger re-render

### Issue: Dates in wrong timezone
**Solution**: Use ISO strings and parse consistently

---

## Future Enhancements

1. **Export**: Download charts as images
2. **Date Range Picker**: Custom date range selection
3. **Comparison**: Compare multiple semesters
4. **Predictions**: Forecast future attendance
5. **Goals**: Set and track attendance goals
6. **Notifications**: Alert when attendance drops
7. **CSV Export**: Download logs as spreadsheet
8. **Print View**: Printer-friendly format
