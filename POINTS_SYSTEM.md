# TrackLy Points System Documentation

## Overview
The TrackLy Points System is a gamification feature designed to encourage students to maintain good attendance habits and use the platform responsibly. Users start with an initial balance and can earn or lose points based on their actions.

---

## Initial Points Balance

### New User Registration
- **Starting Points**: 100 points
- **Minimum Points**: 0 points (cannot go below zero)
- **Maximum Points**: Unlimited

---

## Points Deduction Rules

### 1. Attendance Marking

#### 1.1 Marking Present
- **Points Deducted**: 0 points
- **Reason**: FREE - No penalty for attending classes
- **Applies To**: 
  - Manual per-subject marking
  - Manual whole-day marking
  - Visual attendance form

#### 1.2 Marking Absent
- **Points Deducted**: -2 points per subject
- **Reason**: Punishment for missing class
- **Applies To**:
  - Manual per-subject marking (absent)
  - Manual whole-day marking (absent for all subjects)
  - Visual attendance form (absent)

#### 1.3 Auto-Attendance (Auto-Marked Classes)
- **Points Deducted**: 0 points
- **Reason**: FREE - Automated system marking
- **Applies To**:
  - Classes marked automatically when auto-attendance is ON
  - Past classes marked when enabling auto-attendance
  - Hourly auto-marked classes
  - End-of-day bulk upload

---

### 2. Calculator Usage

All calculators deduct points to encourage mindful usage and prevent over-reliance on calculation tools.

#### 2.1 Attendance Calculator
- **Points Deducted**: -5 points per use
- **Location**: Attendance page → Calculator tab
- **Purpose**: Calculate required attendance to reach target percentage

#### 2.2 Target Attendance Calculator
- **Points Deducted**: -5 points per use
- **Location**: Attendance page → Calculator tab
- **Purpose**: Calculate classes needed to maintain target attendance

#### 2.3 Class-Specific Attendance Calculator
- **Points Deducted**: -5 points per use
- **Location**: Dashboard → Class breakdown section
- **Purpose**: Calculate attendance for specific class types (lecture/lab/tutorial)

#### 2.4 Subject-Specific Calculator
- **Points Deducted**: -5 points per use
- **Location**: Subject details page
- **Purpose**: Calculate attendance for individual subjects

---

## Points Earning Rules

### 1. Weekly Streak Bonus (Future Implementation)

#### 1.1 Eligibility Criteria
- Maintain attendance **above 75%** for ALL subjects
- Calculated at the end of each week (Sunday 11:59 PM)
- Must have at least one class attended during the week

#### 1.2 Reward
- **Points Earned**: +20 points
- **Frequency**: Every weekend (if criteria met)
- **Notification**: User receives notification about streak bonus

#### 1.3 Streak Reset Conditions
- Any subject falls below 75% attendance
- No classes attended during the week
- User manually marks absent without valid reason

---

## Points Calculation Examples

### Example 1: Regular Week with Manual Marking
```
Starting Points: 100

Monday:
- Mark 3 classes present: 100 - 0 = 100 points
- Mark 1 class absent: 100 - 2 = 98 points

Tuesday:
- Mark 4 classes present: 98 - 0 = 98 points

Wednesday:
- Use Attendance Calculator: 98 - 5 = 93 points
- Mark 3 classes present: 93 - 0 = 93 points

Ending Points: 93 points
```

### Example 2: Week with Auto-Attendance Enabled
```
Starting Points: 100

Monday:
- Enable auto-attendance
- System auto-marks 15 past classes: 100 - 0 = 100 points

Tuesday-Friday:
- Auto-attendance marks 20 classes: 100 - 0 = 100 points

Weekend:
- Streak bonus (all subjects > 75%): 100 + 20 = 120 points

Ending Points: 120 points
```

### Example 3: Heavy Calculator Usage
```
Starting Points: 100

Week Activities:
- Use Attendance Calculator 3 times: 100 - 15 = 85 points
- Use Target Calculator 2 times: 85 - 10 = 75 points
- Mark 25 classes present: 75 - 0 = 75 points
- Mark 2 classes absent: 75 - 4 = 71 points

Ending Points: 71 points
```

---

## Points Display & Notifications

### 1. Points Display Locations
- **Dashboard**: Main points counter in header/sidebar
- **Profile Page**: Detailed points history
- **Attendance Stats**: Points shown alongside attendance percentage

### 2. Notification Triggers

#### 2.1 Points Deducted
- **Trigger**: When points are deducted
- **Type**: Alert notification
- **Category**: points
- **Priority**: Low to Medium
- **Message Format**: "You've lost X points for [reason]"

#### 2.2 Points Earned (Future)
- **Trigger**: Weekly streak bonus awarded
- **Type**: Success notification
- **Category**: points
- **Priority**: Medium
- **Message Format**: "🎉 Streak Bonus! You've earned 20 points for maintaining 75%+ attendance"

#### 2.3 Low Points Warning (Future)
- **Trigger**: Points fall below 20
- **Type**: Warning notification
- **Category**: points
- **Priority**: High
- **Message Format**: "⚠️ Low Points! You have only X points remaining"

---

## Technical Implementation Details

### 1. Database Schema
```javascript
User Model:
  points: {
    type: Number,
    default: 100
  }
```

### 2. Points Update Logic

#### Manual Attendance Marking
```javascript
// Per-Subject Marking
if (status === 'absent') {
  user.points = Math.max(0, user.points - 2);
}

// Whole-Day Marking
if (status === 'absent') {
  const pointsToDeduct = numberOfSubjects * 2;
  user.points = Math.max(0, user.points - pointsToDeduct);
}
```

#### Calculator Usage
```javascript
// Any Calculator
user.points = Math.max(0, user.points - 5);
```

#### Auto-Attendance
```javascript
// No points deduction
// isAutoMarked: true flag prevents point deduction
```

### 3. API Endpoints

#### Get User Points
```
GET /api/user/points
Response: { points: 85 }
```

#### Update Points (Admin)
```
PUT /api/user/points
Body: { points: 10, operation: 'add' | 'subtract' }
```

---

## Future Enhancements

### 1. Streak System (Planned)
- Weekly attendance streak tracking
- Bonus points for consistent attendance
- Streak multipliers for longer streaks

### 2. Achievements System (Planned)
- Milestone-based point rewards
- Special badges for point thresholds
- Leaderboard integration

### 3. Points Redemption (Planned)
- Use points to unlock premium features
- Exchange points for attendance forgiveness
- Donate points to classmates

### 4. Dynamic Point Values (Planned)
- Adjust point values based on semester progress
- Higher penalties near exam periods
- Bonus points during difficult weeks

---

## Best Practices for Users

### Maximize Your Points
1. ✅ Enable auto-attendance to avoid manual marking penalties
2. ✅ Mark attendance as present regularly (free)
3. ✅ Maintain 75%+ attendance for weekly bonuses
4. ✅ Use calculators sparingly (5 points each)
5. ✅ Avoid marking absent unless necessary (2 points penalty)

### Avoid Point Loss
1. ❌ Don't use calculators unnecessarily
2. ❌ Don't mark absent without reason
3. ❌ Don't let attendance fall below 75%
4. ❌ Don't disable auto-attendance if you forget to mark manually

---

## FAQ

### Q1: Do I lose points for auto-marked attendance?
**A:** No, auto-attendance is completely FREE and does not deduct any points.

### Q2: How many points do I lose for marking absent?
**A:** You lose 2 points per subject marked absent.

### Q3: Can I earn points back?
**A:** Yes, through the weekly streak bonus system (20 points per week for maintaining 75%+ attendance).

### Q4: What happens if my points reach 0?
**A:** Your points cannot go below 0. You can still use the app, but you won't be able to use calculators until you earn points back.

### Q5: Do all calculators cost the same?
**A:** Yes, all 4 calculator types cost 5 points per use.

### Q6: How often can I earn streak bonuses?
**A:** Every weekend (Sunday 11:59 PM) if you maintain 75%+ attendance across all subjects.

---

## Version History

- **v1.0** - Initial points system with deduction rules
- **v1.1** - Added auto-attendance free marking
- **v1.2** - Planned: Weekly streak bonus system
- **v1.3** - Planned: Calculator point deduction (5 points)

---

**Last Updated**: January 2026  
**Maintained By**: TrackLy Development Team
