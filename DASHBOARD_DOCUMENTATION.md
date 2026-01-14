# Dashboard Documentation

## Overview
The TrackLy Dashboard is the main landing page after user login, providing a comprehensive overview of attendance, schedule, tasks, and rewards.

---

## File Structure

```
frontend/
├── app/(main)/dashboard/
│   └── page.tsx                          # Main dashboard page
├── components/dashboard/
│   ├── subject-attendance-analytics.tsx  # Subject-wise attendance cards
│   ├── today-schedule.tsx                # Today's class schedule
│   └── upcoming-tasks.tsx                # Upcoming todo tasks
└── components/history/
    └── attendance-report.tsx             # Full attendance analytics
```

---

## Layout Structure

### 1. **Header Section**
- **Component**: `PageHeader`
- **Features**:
  - Dynamic greeting with user's first name from database
  - Current date display (format: "Wednesday, January 14, 2026")
- **Styling**: `pt-4` top padding, flex layout with space-between

### 2. **Quick Stats Cards (4 Cards)**

#### Card 1: Overall Attendance
- **Data Source**: Database (`/subject` API)
- **Features**:
  - Overall attendance percentage
  - Present/Total classes count
  - Monthly trend comparison (up/down arrow)
  - Gradient background: `from-primary/10 to-primary/5`
- **Icon**: GraduationCap
- **Color**: Primary theme

#### Card 2: Classes Today
- **Data Source**: Database (`/schedule` API)
- **Features**:
  - Total classes count for today
  - Next upcoming class info (name, time, type)
  - Attendance status indicator (✓/✗)
  - "All done!" message when classes finished
  - Real-time class status detection
  - Gradient background: `from-blue-500/10 to-blue-500/5`
- **Icon**: BookOpen
- **Color**: Blue

#### Card 3: Upcoming Tasks
- **Component**: `<UpcomingTasks />`
- **Data Source**: Database (`/todo` API)
- **Features**:
  - Shows high-priority tasks
  - Due date display
  - Task count badge
  - Gradient background: Purple theme
- **Icon**: Calendar/CheckSquare
- **Color**: Purple

#### Card 4: Reward Points
- **Data Source**: LocalStorage (`points`)
- **Features**:
  - Total points earned
  - Current streak (weeks)
  - Gradient background: `from-green-500/10 to-green-500/5`
- **Icon**: CheckCircle SVG
- **Color**: Green

### 3. **Main Content Grid (2 Columns)**

#### Left Column (2/3 width): Subject Attendance Analytics
- **Component**: `<SubjectAttendanceAnalytics />`
- **Data Source**: Database (`/subject` API)
- **Features**:
  - Grid layout: 2 columns (mobile), 3 columns (desktop)
  - Each slot shows:
    - Subject name (uppercase, truncated)
    - Attendance percentage (large, bold)
  - **Color Coding** (entire slot colored):
    - Green (≥90%): `bg-green-500/20 border-green-500`
    - Blue (≥75%): `bg-blue-500/20 border-blue-500`
    - Yellow (≥60%): `bg-yellow-500/20 border-yellow-500`
    - Red (<60%): `bg-red-500/20 border-red-500`
  - Hover effect: `hover:scale-105`
  - Real-time updates on attendance/subject changes
  - Height: `h-full` to match Today's Schedule
  - Heading: `text-xl` with `h-6 w-6` icon
  - Content padding: `pt-6`

#### Right Column (1/3 width): Today's Schedule
- **Component**: `<TodaySchedule />`
- **Data Source**: Database (`/schedule` API)
- **Features**:
  - Shows all classes for current day
  - Real-time status badges:
    - NOW (green): Currently ongoing
    - NEXT (blue): Next upcoming class
    - FINISHED (gray): Completed classes
    - UPCOMING (outline): Future classes
  - Auto-attendance status indicator
  - Class details: time, room, type
  - Off-day messages with motivational suggestions
  - Updates every minute for real-time status

### 4. **Bottom Section (Full Width)**

#### Attendance Report
- **Component**: `<AttendanceReport />`
- **Data Source**: Database (multiple APIs)
- **Features**:
  - Comprehensive attendance analytics
  - Charts and graphs (Weekly/Monthly/By Subject)
  - Historical data visualization
  - Trend analysis

---

## Data Flow

### Authentication
```typescript
const { user, isLoading } = useAuth()
const firstName = user?.name ? user.name.split(' ')[0] : 'there'
```

### Data Fetching
1. **Subjects & Attendance**: `fetchWithAuth('/subject')`
2. **Schedule**: `fetchWithAuth('/schedule')`
3. **Todos**: `fetchWithAuth('/todo')`
4. **Points**: `getFromLocalStorage('points')`

### Real-time Updates
Event listeners for automatic refresh:
- `scheduleUpdated`
- `todosUpdated`
- `attendanceUpdated`
- `subjectsUpdated`

---

## State Management

### Main States
```typescript
const [attendanceStats, setAttendanceStats] = useState({
  percentage: "0",
  present: 0,
  total: 0,
  trend: "0",
  trendDirection: "up"
})

const [classesToday, setClassesToday] = useState({
  count: 0,
  nextClass: "No upcoming classes",
  nextClassInfo: undefined,
  allClassesFinished: false
})

const [pointsStats, setPointsStats] = useState({
  total: 0,
  streak: 0
})

const [todaySchedule, setTodaySchedule] = useState<ClassEntry[]>([])
const [upcomingTodos, setUpcomingTodos] = useState<TodoItem[]>([])
```

---

## Styling Guidelines

### Spacing
- Top padding: `pt-4`
- Section spacing: `space-y-8`
- Card gap: `gap-4` (stats), `gap-6` (main content)

### Responsive Grid
```typescript
// Stats Cards
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4

// Main Content
grid-cols-1 lg:grid-cols-3
```

### Color Scheme
- Primary: Attendance card
- Blue: Classes card
- Purple: Tasks card
- Green: Points card
- Status colors: Green (good), Yellow (warning), Red (critical)

### Hover Effects
- Cards: `hover:shadow-md`, `hover:border-primary/30`
- Slots: `hover:scale-105`, `transition-all duration-200`

---

## Key Features

### 1. Dynamic User Greeting
- Fetches user name from database
- Extracts first name automatically
- Fallback to "there" if name unavailable

### 2. Trend Calculation
- Compares current month vs previous month
- Shows percentage change with arrow indicator
- Filters records by month and year

### 3. Next Class Detection
- Calculates current time in minutes
- Finds next upcoming class
- Detects if all classes finished
- Shows attendance status for next class

### 4. Welcome Notification
- Shows once per session
- Stored in localStorage
- Dispatches custom event for notification panel

### 5. Loading States
- Initial loading: Full-screen spinner
- Data loading: Inline spinner
- Error state: User-friendly message

---

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/subject` | GET | Fetch subjects and attendance |
| `/schedule` | GET | Fetch class schedule |
| `/todo` | GET | Fetch todo tasks |
| `/auth/me` | GET | Fetch user data |

---

## LocalStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `points` | Object | Reward points data |
| `attendance_records` | Array | Historical attendance |
| `notifications` | Array | User notifications |
| `has_shown_welcome` | String | Session flag |

---

## Component Props

### SubjectAttendanceAnalytics
- No props (fetches own data)
- Auto-updates on events

### TodaySchedule
```typescript
interface TodayScheduleProps {
  schedule?: ClassEntry[]
}
```

### UpcomingTasks
```typescript
interface UpcomingTasksProps {
  todos: TodoItem[]
}
```

---

## Performance Optimizations

1. **Event Cleanup**: All event listeners removed on unmount
2. **Conditional Rendering**: Loading states prevent unnecessary renders
3. **Memoization**: Date formatting done once
4. **Efficient Filtering**: Array operations optimized

---

## Error Handling

1. **Try-Catch Blocks**: All API calls wrapped
2. **Fallback Values**: Default states for missing data
3. **User Feedback**: Error messages displayed
4. **Graceful Degradation**: Continues working with partial data

---

## Accessibility

- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Screen reader friendly

---

## Future Enhancements

1. Add skeleton loaders
2. Implement data caching
3. Add pull-to-refresh
4. Offline mode support
5. Customizable dashboard layout

---

## Developer Notes

### To Recreate Dashboard:

1. **Setup Layout**:
   - Create main container with `pt-4`
   - Add header with PageHeader and date
   - Create 4-column grid for stats cards

2. **Implement Stats Cards**:
   - Fetch data from respective APIs
   - Calculate trends and percentages
   - Add gradient backgrounds and icons

3. **Add Main Content**:
   - Create 3-column grid (2:1 ratio)
   - Implement SubjectAttendanceAnalytics with color coding
   - Add TodaySchedule with real-time status

4. **Add Bottom Section**:
   - Include AttendanceReport component
   - Full-width layout

5. **Implement Real-time Updates**:
   - Add event listeners for data changes
   - Cleanup on unmount

6. **Add Loading/Error States**:
   - Show spinners during data fetch
   - Display error messages when needed

---

## Testing Checklist

- [ ] User name displays correctly
- [ ] All stats cards show accurate data
- [ ] Next class detection works
- [ ] Color coding accurate for attendance
- [ ] Real-time updates trigger correctly
- [ ] Loading states appear properly
- [ ] Error handling works
- [ ] Responsive on all screen sizes
- [ ] Event listeners cleaned up
- [ ] Welcome notification shows once

---

## Dependencies

```json
{
  "date-fns": "^2.x.x",
  "lucide-react": "^0.x.x",
  "next": "^15.x.x",
  "react": "^18.x.x"
}
```

---

**Last Updated**: January 2026  
**Version**: 1.0  
**Maintained By**: TrackLy Development Team
