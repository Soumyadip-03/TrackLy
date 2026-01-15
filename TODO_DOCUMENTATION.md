# TODO Component - Complete Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Notification System](#notification-system)
6. [Workflow Diagrams](#workflow-diagrams)
7. [Rebuild Instructions](#rebuild-instructions)

---

## Architecture Overview

### System Design
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│  - Todo Page (/todo)                                         │
│  - Todo List Component                                       │
│  - Dashboard Integration                                     │
│  - Todo Service (API calls)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Requests (JWT Auth)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER                         │
│  - Routes: /api/todo                                         │
│  - Middleware: protect (JWT verification)                    │
│  - Controllers: CRUD operations                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                            │
│  - MongoDB (User-specific databases)                         │
│  - Todo Collection per user                                  │
│  - Automatic overdue status updates                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKGROUND SERVICES                             │
│  - Scheduled Jobs (node-schedule)                            │
│  - Todo Notification Service                                 │
│  - Overdue Detection & Reminders                             │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Scheduling**: node-schedule
- **Authentication**: JWT tokens
- **Date Handling**: date-fns, UTC normalization

---

## Database Schema

### Todo Model (`backend/models/Todo.js`)

```javascript
{
  user: ObjectId,              // Reference to User
  title: String,               // Required, max 200 chars
  description: String,         // Optional, max 1000 chars
  dueDate: Date,              // Optional, null if no due date
  priority: String,           // 'low' | 'medium' | 'high'
  completed: Boolean,         // Default: false
  isOverdue: Boolean,         // Auto-calculated, default: false
  overdueNotificationSent: Date, // Last overdue notification timestamp
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-updated on save
}
```

### Key Schema Features
1. **User Isolation**: Each todo belongs to specific user
2. **Overdue Tracking**: `isOverdue` flag auto-updated
3. **Notification Control**: `overdueNotificationSent` prevents spam
4. **Timestamps**: Automatic creation and update tracking

---

## Backend Implementation

### 1. API Routes (`backend/routes/todo.js`)

#### GET /api/todo
**Purpose**: Fetch all todos for authenticated user
**Logic**:
```javascript
1. Authenticate user via JWT
2. Fetch todos from user's database
3. Normalize dates to UTC midnight
4. Update overdue status for each todo
5. Save updated todos
6. Return sorted by createdAt (newest first)
```

#### POST /api/todo
**Purpose**: Create new todo
**Validation**:
- Title is required
- Description optional
- Priority defaults to 'medium'
- Completed defaults to false

#### PUT /api/todo/:id
**Purpose**: Update existing todo
**Updates**: title, description, dueDate, priority, completed

#### DELETE /api/todo/:id
**Purpose**: Delete todo by ID

#### PATCH /api/todo/:id/toggle
**Purpose**: Toggle completion status
**Logic**: `completed = !completed`

### 2. Date Normalization Function

```javascript
const normalizeToUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};
```

**Why**: Eliminates timezone issues by comparing dates at midnight UTC

### 3. Overdue Status Update

```javascript
const updateOverdueStatus = async (todos) => {
  const now = normalizeToUTC(new Date());
  
  for (const todo of todos) {
    if (todo.dueDate && !todo.completed) {
      const dueDate = normalizeToUTC(todo.dueDate);
      todo.isOverdue = dueDate < now;
    } else {
      todo.isOverdue = false;
    }
  }
  
  return todos;
};
```

**Triggers**: Every time todos are fetched via GET /api/todo

---

## Frontend Implementation

### 1. Todo Service (`frontend/lib/services/todo-service.ts`)

```typescript
export const todoService = {
  async getAll(): Promise<Todo[]>
  async create(todo: CreateTodoDto): Promise<Todo>
  async update(id: string, todo: UpdateTodoDto): Promise<Todo>
  async delete(id: string): Promise<void>
  async toggle(id: string): Promise<Todo>
}
```

**All methods use**: `fetchWithAuth()` for authenticated API calls

### 2. Todo Page (`frontend/app/(main)/todo/page.tsx`)

**Structure**:
```
┌─────────────────────────────────────────────────────┐
│                  Todo Page                          │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │   Todo Form      │  │   Todo List      │        │
│  │  - Title         │  │  - Pending       │        │
│  │  - Description   │  │  - Completed     │        │
│  │  - Due Date      │  │  - Edit/Delete   │        │
│  │  - Priority      │  │  - Toggle        │        │
│  └──────────────────┘  └──────────────────┘        │
└─────────────────────────────────────────────────────┘
```

**Key Features**:
- Real-time updates via `todosUpdated` event
- Visual indicators (overdue, due today, due soon)
- Inline editing with dialog
- Priority color coding
- Sorted display (incomplete first, then by due date)

### 3. Date Comparison (Frontend)

```typescript
const isOverdue = (dueDate: string | null, completed: boolean) => {
  if (!dueDate || completed) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < now;
};
```

**Matches backend logic** for consistent UI display

### 4. Dashboard Integration (`frontend/components/dashboard/upcoming-tasks.tsx`)

**Displays**:
- Count of upcoming tasks
- Next task title
- Days remaining or overdue
- Priority badge

**Updates**: Automatically when `todosUpdated` event fires

---

## Notification System

### 1. Service (`backend/services/todoNotificationService.js`)

#### Main Function: `checkTodoReminders()`

**Runs**: Daily at 9:00 AM (configured in scheduler)

**Logic Flow**:
```
1. Fetch all users
2. For each user:
   a. Check if todoReminders enabled
   b. Fetch incomplete todos with due dates
   c. Get reminder preferences (days, priority filter)
   d. For each todo:
      - If overdue → handleOverdueTodo()
      - If due soon → createTodoNotification('upcoming')
```

#### Overdue Handling: `handleOverdueTodo()`

```javascript
1. Mark todo.isOverdue = true
2. Check last notification time
3. If >24 hours since last notification:
   - Send overdue notification
   - Update overdueNotificationSent timestamp
```

**Prevents spam**: Max 1 notification per day per todo

#### Notification Creation: `createTodoNotification()`

**Types**:
- `todo_reminder`: Upcoming due dates
- `todo_overdue`: Past due dates (priority escalated to 'high')

**Messages**:
- "Due today!"
- "Due tomorrow!"
- "Due in X days"
- "X days overdue!"

### 2. Scheduler Integration (`backend/utils/scheduler.js`)

```javascript
const dailyTodoReminders = schedule.scheduleJob('0 9 * * *', async () => {
  const { checkTodoReminders } = require('../services/todoNotificationService');
  await checkTodoReminders();
});
```

**Cron Expression**: `0 9 * * *` = Every day at 9:00 AM

---

## Workflow Diagrams

### Create Todo Flow
```
User fills form
    ↓
Validate title (required)
    ↓
todoService.create(data)
    ↓
POST /api/todo
    ↓
Save to user's MongoDB
    ↓
Return todo object
    ↓
Dispatch 'todosUpdated' event
    ↓
All components refresh
```

### Fetch Todos Flow
```
Component mounts
    ↓
todoService.getAll()
    ↓
GET /api/todo
    ↓
Fetch from database
    ↓
normalizeToUTC(dates)
    ↓
updateOverdueStatus()
    ↓
Save updated todos
    ↓
Return to frontend
    ↓
Render with visual indicators
```

### Notification Flow
```
Scheduler triggers (9 AM daily)
    ↓
checkTodoReminders()
    ↓
For each user with reminders enabled:
    ↓
Fetch incomplete todos
    ↓
For each todo:
    ├─ If overdue:
    │   ├─ Mark isOverdue = true
    │   ├─ Check last notification
    │   └─ Send if >24hrs
    │
    └─ If due soon:
        └─ Send upcoming reminder
```

### Overdue Detection Flow
```
GET /api/todo called
    ↓
For each todo:
    ↓
Has dueDate? → No → isOverdue = false
    ↓ Yes
Is completed? → Yes → isOverdue = false
    ↓ No
normalizeToUTC(dueDate) < normalizeToUTC(now)?
    ↓ Yes
isOverdue = true
    ↓
Save to database
```

---

## Rebuild Instructions

### Step 1: Database Model

Create `backend/models/Todo.js`:
```javascript
const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  dueDate: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  isOverdue: {
    type: Boolean,
    default: false
  },
  overdueNotificationSent: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

TodoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Todo', TodoSchema);
```

### Step 2: API Routes

Create `backend/routes/todo.js`:
```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { initializeUserDatabase } = require('../utils/dbManager');

// Date normalization
const normalizeToUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

// Update overdue status
const updateOverdueStatus = async (todos) => {
  const now = normalizeToUTC(new Date());
  for (const todo of todos) {
    if (todo.dueDate && !todo.completed) {
      const dueDate = normalizeToUTC(todo.dueDate);
      todo.isOverdue = dueDate < now;
    } else {
      todo.isOverdue = false;
    }
  }
  return todos;
};

// GET all todos
router.get('/', protect, async (req, res) => {
  try {
    const { models } = initializeUserDatabase(req.user._id);
    let todos = await models.Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
    todos = await updateOverdueStatus(todos);
    await Promise.all(todos.map(todo => todo.save()));
    res.status(200).json({ success: true, count: todos.length, data: todos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch todos', error: error.message });
  }
});

// POST create todo
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    const { models } = initializeUserDatabase(req.user._id);
    const todo = await models.Todo.create({
      user: req.user._id,
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: dueDate || null,
      priority: priority || 'medium',
      completed: false
    });
    res.status(201).json({ success: true, data: todo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create todo', error: error.message });
  }
});

// PUT update todo
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, dueDate, priority, completed } = req.body;
    const { models } = initializeUserDatabase(req.user._id);
    let todo = await models.Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    if (title !== undefined) todo.title = title.trim();
    if (description !== undefined) todo.description = description.trim();
    if (dueDate !== undefined) todo.dueDate = dueDate;
    if (priority !== undefined) todo.priority = priority;
    if (completed !== undefined) todo.completed = completed;
    await todo.save();
    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update todo', error: error.message });
  }
});

// DELETE todo
router.delete('/:id', protect, async (req, res) => {
  try {
    const { models } = initializeUserDatabase(req.user._id);
    const todo = await models.Todo.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    res.status(200).json({ success: true, message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete todo', error: error.message });
  }
});

// PATCH toggle completion
router.patch('/:id/toggle', protect, async (req, res) => {
  try {
    const { models } = initializeUserDatabase(req.user._id);
    const todo = await models.Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    todo.completed = !todo.completed;
    await todo.save();
    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle todo', error: error.message });
  }
});

module.exports = router;
```

### Step 3: Notification Service

Create `backend/services/todoNotificationService.js`:
```javascript
const Todo = require('../models/Todo');
const User = require('../models/User');
const { initializeUserDatabase } = require('../utils/dbManager');

const normalizeToUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

const checkTodoReminders = async () => {
  try {
    const users = await User.find({});
    const now = normalizeToUTC(new Date());
    
    for (const user of users) {
      try {
        const settings = user.notificationPreferences || {};
        if (!settings.todoReminders) continue;
        
        const { models } = initializeUserDatabase(user._id);
        const todos = await models.Todo.find({ 
          user: user._id, 
          completed: false,
          dueDate: { $exists: true, $ne: null }
        });
        
        const reminderDays = parseInt(settings.todoReminderTime || '1');
        const priorityOnly = settings.priorityTodosOnly || false;
        const reminderDate = new Date(now);
        reminderDate.setDate(reminderDate.getDate() + reminderDays);
        
        for (const todo of todos) {
          const dueDate = normalizeToUTC(todo.dueDate);
          if (priorityOnly && todo.priority !== 'high') continue;
          
          if (dueDate < now && !todo.isOverdue) {
            await handleOverdueTodo(user._id, todo, models);
          } else if (dueDate <= reminderDate && dueDate >= now) {
            await createTodoNotification(user._id, todo, 'upcoming');
          }
        }
      } catch (error) {
        console.error(`Error processing todos for user ${user._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in checkTodoReminders:', error);
  }
};

const handleOverdueTodo = async (userId, todo, models) => {
  try {
    todo.isOverdue = true;
    await todo.save();
    
    const lastNotification = todo.overdueNotificationSent;
    const now = new Date();
    
    if (!lastNotification || (now - lastNotification) > 24 * 60 * 60 * 1000) {
      await createTodoNotification(userId, todo, 'overdue');
      todo.overdueNotificationSent = now;
      await todo.save();
    }
  } catch (error) {
    console.error('Error handling overdue todo:', error);
  }
};

const createTodoNotification = async (userId, todo, type = 'upcoming') => {
  try {
    const { models } = initializeUserDatabase(userId);
    const now = normalizeToUTC(new Date());
    const dueDate = normalizeToUTC(todo.dueDate);
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    let message = '';
    let title = '';
    let priority = todo.priority;
    
    if (type === 'overdue') {
      const daysOverdue = Math.abs(daysUntilDue);
      title = '⚠️ Overdue Task';
      message = `Task "${todo.title}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue!`;
      priority = 'high';
    } else {
      title = 'Task Reminder';
      if (daysUntilDue === 0) {
        message = `Task "${todo.title}" is due today!`;
      } else if (daysUntilDue === 1) {
        message = `Task "${todo.title}" is due tomorrow!`;
      } else {
        message = `Task "${todo.title}" is due in ${daysUntilDue} days`;
      }
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingNotification = await models.Notification.findOne({
      user: userId,
      type: type === 'overdue' ? 'todo_overdue' : 'todo_reminder',
      'metadata.todoId': todo._id.toString(),
      createdAt: { $gte: today }
    });
    
    if (existingNotification) return;
    
    await models.Notification.create({
      user: userId,
      type: type === 'overdue' ? 'todo_overdue' : 'todo_reminder',
      title: title,
      message: message,
      priority: priority,
      metadata: {
        todoId: todo._id.toString(),
        dueDate: todo.dueDate,
        priority: todo.priority,
        isOverdue: type === 'overdue'
      }
    });
  } catch (error) {
    console.error('Error creating todo notification:', error);
  }
};

module.exports = { checkTodoReminders };
```

### Step 4: Scheduler Integration

Update `backend/utils/scheduler.js`:
```javascript
const schedule = require('node-schedule');

const dailyTodoReminders = schedule.scheduleJob('0 9 * * *', async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Database not connected, skipping todo reminders');
      return;
    }
    const { checkTodoReminders } = require('../services/todoNotificationService');
    await checkTodoReminders();
    console.log('Daily todo reminders check completed');
  } catch (error) {
    console.error('Error in daily todo reminders:', error);
  }
});
```

### Step 5: Register Route

In `backend/server.js`:
```javascript
app.use('/api/todo', require('./routes/todo'));
```

### Step 6: Frontend Service

Create `frontend/lib/services/todo-service.ts`:
```typescript
import { fetchWithAuth } from '../api';

export interface Todo {
  _id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
}

export const todoService = {
  async getAll(): Promise<Todo[]> {
    const response = await fetchWithAuth('/todo');
    if (!response.ok) throw new Error('Failed to fetch todos');
    const data = await response.json();
    return data.data;
  },

  async create(todo: CreateTodoDto): Promise<Todo> {
    const response = await fetchWithAuth('/todo', {
      method: 'POST',
      body: JSON.stringify(todo)
    });
    if (!response.ok) throw new Error('Failed to create todo');
    const data = await response.json();
    return data.data;
  },

  async update(id: string, todo: UpdateTodoDto): Promise<Todo> {
    const response = await fetchWithAuth(`/todo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(todo)
    });
    if (!response.ok) throw new Error('Failed to update todo');
    const data = await response.json();
    return data.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`/todo/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete todo');
  },

  async toggle(id: string): Promise<Todo> {
    const response = await fetchWithAuth(`/todo/${id}/toggle`, {
      method: 'PATCH'
    });
    if (!response.ok) throw new Error('Failed to toggle todo');
    const data = await response.json();
    return data.data;
  }
};
```

### Step 7: Frontend Components

Create todo page, form, and list components following the structure in:
- `frontend/app/(main)/todo/page.tsx`
- `frontend/components/todo/todo-form.tsx`
- `frontend/components/todo/todo-list.tsx`

Key patterns:
- Use `todoService` for all API calls
- Dispatch `todosUpdated` event after mutations
- Listen for `todosUpdated` to refresh data
- Normalize dates for comparison
- Show visual indicators based on status

---

## Key Implementation Details

### 1. Timezone Handling
**Always normalize dates to UTC midnight** for comparison:
```javascript
// Backend
const normalizeToUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

// Frontend
const now = new Date();
now.setHours(0, 0, 0, 0);
```

### 2. Event-Driven Updates
```javascript
// After any mutation
window.dispatchEvent(new CustomEvent('todosUpdated'));

// In components
useEffect(() => {
  const handleUpdate = () => loadTodos();
  window.addEventListener('todosUpdated', handleUpdate);
  return () => window.removeEventListener('todosUpdated', handleUpdate);
}, []);
```

### 3. Overdue Auto-Update
**Trigger**: Every GET request
**Logic**: Compare normalized dates, update `isOverdue` flag

### 4. Notification Throttling
**Mechanism**: Check `overdueNotificationSent` timestamp
**Rule**: Max 1 notification per 24 hours per todo

### 5. Priority Escalation
**Rule**: All overdue notifications sent with `priority: 'high'`

---

## Testing Checklist

- [ ] Create todo with all fields
- [ ] Create todo with only title
- [ ] Edit existing todo
- [ ] Delete todo
- [ ] Toggle completion
- [ ] View on dashboard
- [ ] Check overdue detection (set past due date)
- [ ] Verify notifications (wait for 9 AM or manually trigger)
- [ ] Test timezone handling (different timezones)
- [ ] Verify real-time updates across components
- [ ] Test notification throttling (should not spam)
- [ ] Verify priority escalation for overdue

---

## Common Issues & Solutions

### Issue: Todos not showing overdue
**Solution**: Ensure `updateOverdueStatus()` is called in GET route

### Issue: Multiple notifications for same todo
**Solution**: Check `existingNotification` query in `createTodoNotification()`

### Issue: Timezone bugs
**Solution**: Use `normalizeToUTC()` consistently on both frontend and backend

### Issue: Dashboard not updating
**Solution**: Ensure `todosUpdated` event is dispatched after mutations

### Issue: Scheduler not running
**Solution**: Verify scheduler is initialized in `server.js` after DB connection

---

## Performance Considerations

1. **Batch Updates**: Overdue status updated in bulk on fetch
2. **Indexed Queries**: Ensure `user` field is indexed
3. **Event Throttling**: Use debounce if needed for rapid updates
4. **Notification Deduplication**: Prevents unnecessary DB writes
5. **Lazy Loading**: Consider pagination for large todo lists

---

## Security Considerations

1. **User Isolation**: All queries filtered by `user._id`
2. **JWT Authentication**: All routes protected with `protect` middleware
3. **Input Validation**: Title required, length limits enforced
4. **SQL Injection**: Mongoose handles parameterization
5. **XSS Prevention**: React escapes output by default

---

## Future Enhancements

1. **Recurring Todos**: Add repeat patterns (daily, weekly, monthly)
2. **Categories/Tags**: Organize todos by category
3. **Subtasks**: Break down todos into smaller tasks
4. **Attachments**: Add file uploads to todos
5. **Collaboration**: Share todos with other users
6. **Calendar View**: Visualize todos on calendar
7. **Bulk Operations**: Select multiple todos for batch actions
8. **Search/Filter**: Advanced filtering and search
9. **Export**: Export todos to CSV/PDF
10. **Mobile App**: Native mobile application

---

## Conclusion

This TODO component is a production-ready, enterprise-grade task management system with:
- Complete CRUD operations
- Intelligent overdue detection
- Automated notification system
- Timezone-safe date handling
- Real-time UI synchronization
- User-isolated data storage
- Event-driven architecture

Follow these instructions to rebuild the component from scratch or integrate it into a new project.
