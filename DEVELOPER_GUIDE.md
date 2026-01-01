# TrackLy - Developer Guide & Architecture Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Core Workflows](#core-workflows)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Frontend Structure](#frontend-structure)
8. [Backend Structure](#backend-structure)
9. [Key Features Implementation](#key-features-implementation)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

**TrackLy** is a full-stack student attendance tracking system with AI assistance.

### Tech Stack
- **Frontend**: Next.js 15.5.9, React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT with cookies
- **AI**: OpenAI GPT-3.5 (with local fallback)
- **Email**: Nodemailer + Gmail SMTP

### Ports
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  Next.js App Router + React + TypeScript + Tailwind         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Pages      │  │  Components  │  │   Services   │       │
│  │  (Routes)    │  │   (UI/UX)    │  │   (API)      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                           │                                 │
│                    localStorage                             │
│                    (Offline-first)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST API
                          │ JWT Authentication
┌─────────────────────────┴───────────────────────────────────┐
│                         BACKEND                             │
│              Express.js + Node.js                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Routes     │  │  Middleware  │  │   Utils      │       │
│  │  (Endpoints) │  │   (Auth)     │  │  (Services)  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                           │                                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ Mongoose ODM
┌─────────────────────────┴───────────────────────────────────┐
│                    MongoDB Atlas                            │
│  Collections: users, subjects, attendance, todos,           │
│               notifications, projectversions                │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Gmail account (for email notifications)
- OpenAI API key (optional)

### Backend Setup
```bash
cd backend
npm install
```

Create `backend/config/config.env`:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
OPENAI_API_KEY=your_openai_key (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

Start backend:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_DISABLE_SYMLINKS=true
NEXT_FORCE_DISK_CACHE=true
```

Start frontend:
```bash
npm run dev
```

---

## Core Workflows

### 1. Authentication Flow

#### Registration
```
User Input → Frontend Validation → POST /api/auth/register
  ↓
Backend validates & hashes password
  ↓
Create User in MongoDB
  ↓
Send welcome emails
  ↓
Generate JWT token
  ↓
Return token → Store in localStorage + cookies
  ↓
Initialize default points (100)
  ↓
Redirect to /dashboard
```

#### Login
```
User Input → POST /api/auth/login
  ↓
Verify credentials
  ↓
Log login history (IP, device, browser)
  ↓
Create login notification
  ↓
Send security email (if enabled)
  ↓
Generate JWT token
  ↓
Return token + user data
  ↓
Store in localStorage + cookies
  ↓
Redirect to /dashboard
```

#### Session Management
```
Frontend Middleware (middleware.ts):
  - Check trackly_token cookie
  - Redirect based on auth state

Backend Middleware (auth.js):
  - Extract Bearer token
  - Verify JWT
  - Attach user to req.user
```

### 2. Attendance Tracking Flow

#### Whole Day Attendance
```
Select date + status → POST /api/attendance/whole-day
  ↓
Get all user subjects
  ↓
Filter subjects with classes on selected day
  ↓
For each subject:
  - Create/Update Attendance record
  - Update totalClasses & attendedClasses
  - Calculate percentage
  ↓
If percentage < 75% → Create warning notification
  ↓
If absent → Deduct 2 points per subject
  ↓
Update localStorage
  ↓
Refresh dashboard
```

#### Per Subject Attendance
```
Select subject + date + status → POST /api/attendance/per-subject
  ↓
Validate subject ownership
  ↓
Create/Update Attendance record
  ↓
Update subject stats
  ↓
Deduct 2 points (penalty)
  ↓
Create notification
  ↓
Return updated data
```

### 3. Schedule Management Flow

#### PDF Upload
```
Upload PDF → POST /api/uploads/schedule
  ↓
Multer saves to /uploads/schedules/
  ↓
pdfParser extracts text
  ↓
Parse schedule data
  ↓
Update User.pdfSchedule
  ↓
Return parsed schedule
  ↓
Store in localStorage 'schedule'
  ↓
Display in dashboard
```

### 4. AI Chatbot Flow

```
User message → POST /api/chatbot/message
  ↓
Prepare conversation context
  ↓
Try OpenAI API (gpt-3.5-turbo)
  ↓
If fails → Use local fallback (pattern matching)
  ↓
Store in chat history
  ↓
Return response
  ↓
Display in chat UI
```

### 5. Notification Flow

```
Backend Event (login, low attendance, etc.)
  ↓
notificationHelper.createNotification()
  ↓
Create Notification in MongoDB
  ↓
If email enabled:
  - Check preferences (frequency, muted types)
  - Send via emailService
  - Update emailHistory
  ↓
Frontend displays in NotificationPopup
  ↓
Store in localStorage
```

---

## API Reference

### Authentication Endpoints

#### POST /api/auth/register
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "studentId": "STU001",
  "currentSemester": 3
}

Response:
{
  "success": true,
  "token": "jwt_token_here"
}
```

#### POST /api/auth/login
```json
Request:
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt_token_here"
}
```

#### GET /api/auth/me
```
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": { user_object }
}
```

### Attendance Endpoints

#### POST /api/attendance/whole-day
```json
Headers: Authorization: Bearer {token}

Request:
{
  "date": "2024-01-15",
  "status": "present"
}

Response:
{
  "success": true,
  "data": [attendance_records],
  "pointsDeducted": 0
}
```

#### POST /api/attendance/per-subject
```json
Headers: Authorization: Bearer {token}

Request:
{
  "date": "2024-01-15",
  "subjectId": "subject_id_here",
  "status": "present"
}

Response:
{
  "success": true,
  "data": attendance_record,
  "pointsDeducted": 2
}
```

#### GET /api/attendance/stats
```
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "overall": {
      "percentage": 87,
      "attendedClasses": 45,
      "totalClasses": 52
    },
    "subjects": [subject_stats],
    "points": 100
  }
}
```

### Subject Endpoints

#### GET /api/subject
```
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [subjects_array]
}
```

#### POST /api/subject
```json
Headers: Authorization: Bearer {token}

Request:
{
  "name": "Data Structures",
  "code": "CS201",
  "classType": "lecture",
  "semester": 3,
  "schedule": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "10:00"
    }
  ]
}

Response:
{
  "success": true,
  "data": subject_object
}
```

### Todo Endpoints

#### GET /api/todo
```
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [todos_array]
}
```

#### POST /api/todo
```json
Headers: Authorization: Bearer {token}

Request:
{
  "title": "Complete assignment",
  "description": "Finish CS assignment",
  "dueDate": "2024-01-20",
  "priority": "high"
}

Response:
{
  "success": true,
  "data": todo_object
}
```

### Notification Endpoints

#### GET /api/notification
```
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [notifications_array]
}
```

#### PUT /api/notification/:id/read
```
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": updated_notification
}
```

### Chatbot Endpoints

#### POST /api/chatbot/message
```json
Headers: Authorization: Bearer {token}

Request:
{
  "message": "What's my attendance?",
  "conversationHistory": []
}

Response:
{
  "success": true,
  "data": {
    "message": "Your attendance is 87.5%",
    "isLocalFallback": false
  }
}
```

---

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  studentId: String (unique),
  currentSemester: Number,
  profilePicture: String,
  pdfSchedule: {
    name: String,
    path: String,
    uploadDate: Date
  },
  points: Number (default: 100),
  role: String (enum: ['user', 'admin']),
  notificationPreferences: {
    emailNotifications: {
      enabled: Boolean,
      frequency: String (enum: ['instant', 'daily', 'weekly', 'never'])
    }
  },
  loginHistory: [{
    timestamp: Date,
    ipAddress: String,
    userAgent: String
  }],
  createdAt: Date
}
```

### Subject Model
```javascript
{
  name: String,
  code: String,
  classType: String (enum: ['lecture', 'lab', 'tutorial', etc.]),
  semester: Number,
  totalClasses: Number,
  attendedClasses: Number,
  user: ObjectId (ref: 'User'),
  schedule: [{
    day: String,
    startTime: String,
    endTime: String
  }],
  createdAt: Date
}
```

### Attendance Model
```javascript
{
  user: ObjectId (ref: 'User'),
  subject: ObjectId (ref: 'Subject'),
  date: Date,
  status: String (enum: ['present', 'absent']),
  calculationType: String (enum: ['wholeDay', 'perSubject']),
  createdAt: Date
}
```

### Todo Model
```javascript
{
  user: ObjectId (ref: 'User'),
  title: String,
  description: String,
  dueDate: Date,
  priority: String (enum: ['low', 'medium', 'high']),
  completed: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model
```javascript
{
  user: ObjectId (ref: 'User'),
  title: String,
  message: String,
  type: String (enum: ['info', 'alert', 'success']),
  category: String (enum: ['system', 'attendance', 'points']),
  priority: String,
  isRead: Boolean,
  createdAt: Date
}
```

---

## Frontend Structure

```
frontend/
├── app/
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (main)/              # Protected pages (dashboard, attendance, etc.)
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Home page
├── components/
│   ├── attendance/          # Attendance components
│   ├── dashboard/           # Dashboard widgets
│   ├── profile/             # Profile components
│   ├── todo/                # Todo components
│   ├── ui/                  # Reusable UI components (shadcn)
│   ├── ai-chat.tsx          # AI chatbot
│   └── app-sidebar.tsx      # Navigation sidebar
├── lib/
│   ├── services/            # API service layer
│   ├── api.ts               # API utilities
│   ├── auth-context.tsx     # Auth provider
│   ├── storage-utils.ts     # localStorage helpers
│   └── utils.ts             # General utilities
├── middleware.ts            # Route protection
└── next.config.js           # Next.js config
```

### Key Frontend Files

**middleware.ts**: Route protection
```typescript
- PUBLIC_ROUTES: ['/login', '/register']
- PROTECTED_ROUTES: ['/dashboard', '/profile', etc.]
- Checks trackly_token cookie
- Redirects based on auth state
```

**lib/auth-context.tsx**: Authentication state
```typescript
- signIn(email, password)
- signUp(email, password, name, studentId, semester)
- signOut()
- checkConnection()
- enableOfflineMode() / disableOfflineMode()
```

**lib/api.ts**: API communication
```typescript
- fetchWithAuth(endpoint, options)
- sendChatMessage(message, history)
- Offline cache support
- Error handling
```

---

## Backend Structure

```
backend/
├── config/
│   └── config.env           # Environment variables
├── controllers/
│   └── notificationController.js
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── error.js             # Error handling
│   └── userDb.js            # User DB attachment
├── models/
│   ├── User.js
│   ├── Subject.js
│   ├── Attendance.js
│   ├── Todo.js
│   └── Notification.js
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── attendance.js        # Attendance routes
│   ├── subject.js           # Subject routes
│   ├── todo.js              # Todo routes
│   ├── notification.js      # Notification routes
│   ├── chatbot.js           # AI chatbot routes
│   └── uploads.js           # File upload routes
├── utils/
│   ├── dbManager.js         # Database connection manager
│   ├── emailService.js      # Email sending service
│   ├── notificationHelper.js # Notification utilities
│   ├── pdfParser.js         # PDF parsing
│   └── scheduler.js         # Scheduled tasks
├── uploads/                 # File storage
│   ├── profiles/
│   └── schedules/
└── server.js                # Main server file
```

### Key Backend Files

**middleware/auth.js**: JWT verification
```javascript
exports.protect = async (req, res, next) => {
  // Extract Bearer token
  // Verify JWT
  // Fetch user from DB
  // Attach to req.user
}

exports.authorize = (...roles) => {
  // Check user role
}
```

**utils/emailService.js**: Email sending
```javascript
class EmailService {
  sendEmail(recipient, subject, message, options)
  sendNotificationEmail(notification, email)
  sendSecurityEmail(notification, email, metadata)
  sendDigest(email, notifications, digestType)
}
```

**utils/notificationHelper.js**: Notification creation
```javascript
exports.createNotification = async ({
  userId, title, message, type, category, priority
})
```

---

## Key Features Implementation

### 1. Offline Mode
```javascript
// Frontend checks backend availability
const isBackendAvailable = await checkApiAvailability()

// If unavailable, enable offline mode
if (!isBackendAvailable) {
  enableOfflineMode()
  // Use localStorage data
  // Queue API calls
}

// When connection restored
if (isConnected) {
  disableOfflineMode()
  // Sync queued operations
}
```

### 2. Points System
```javascript
// Initial points: 100
// Deductions:
//   - Absent (whole day): -2 per subject
//   - Per-subject calculator: -2

// Stored in localStorage:
{
  total: 100,
  streak: 0,
  achievements: []
}

// History tracked in points_history
```

### 3. Auto-Marked Attendance
```javascript
// Frontend calculates based on:
// - Schedule from localStorage
// - Current date/time
// - Existing attendance records

// For each scheduled class:
if (!attendanceMarked && classTimePassed) {
  markAsAbsent()
}
```

### 4. Email Notifications
```javascript
// User preferences:
{
  emailNotifications: {
    enabled: true,
    frequency: 'instant', // or 'daily', 'weekly', 'never'
    mutedTypes: [] // e.g., ['system']
  }
}

// Sent for:
// - Login (security alert)
// - Low attendance warning
// - Daily/weekly digest
```

### 5. AI Chatbot Fallback
```javascript
// Try OpenAI API
try {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: conversationHistory
  })
} catch (error) {
  // Use local pattern matching
  const fallback = generateFallbackResponse(userMessage)
}
```

---

## Troubleshooting

### Backend Won't Start
```bash
# Check MongoDB connection
# Verify MONGODB_URI in config.env

# Check port availability
netstat -ano | findstr :5000

# Check environment variables
node -e "require('dotenv').config({path:'./config/config.env'}); console.log(process.env.MONGODB_URI)"
```

### Frontend Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Check Node version
node -v  # Should be 18+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Authentication Issues
```javascript
// Check JWT token in localStorage
localStorage.getItem('trackly_token')

// Check cookie
document.cookie

// Verify token on backend
// Use jwt.io to decode token
```

### Email Not Sending
```bash
# Check Gmail app password (not regular password)
# Enable "Less secure app access" or use App Password

# Test email config
node backend/scripts/sendTestEmail.js your-email@example.com
```

### Database Connection Errors
```javascript
// Check IP whitelist in MongoDB Atlas
// Add 0.0.0.0/0 for development

// Check connection string format
mongodb+srv://username:password@cluster.mongodb.net/dbname

// Test connection
node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_URI').then(() => console.log('Connected')).catch(err => console.error(err))"
```

### OpenAI API Issues
```bash
# Check API key
echo $OPENAI_API_KEY

# Check quota
# Visit: https://platform.openai.com/account/usage

# App works without OpenAI (uses fallback)
```

---

## Development Tips

### Adding New Features

1. **Backend Route**:
   - Create route in `backend/routes/`
   - Add controller logic
   - Update model if needed
   - Add middleware if needed

2. **Frontend Page**:
   - Create page in `app/(main)/`
   - Create components in `components/`
   - Add API service in `lib/services/`
   - Update navigation in `app-sidebar.tsx`

3. **Database Model**:
   - Create model in `backend/models/`
   - Add validation
   - Add methods if needed
   - Update API routes

### Testing

```bash
# Backend
cd backend
npm run dev
# Test with Postman or curl

# Frontend
cd frontend
npm run dev
# Test in browser

# Email
node backend/scripts/sendTestEmail.js test@example.com
```

### Deployment Checklist

- [ ] Update environment variables
- [ ] Set production MongoDB URI
- [ ] Configure CORS for production domain
- [ ] Set secure JWT_SECRET
- [ ] Enable HTTPS
- [ ] Configure email service
- [ ] Test all API endpoints
- [ ] Build frontend: `npm run build`
- [ ] Test production build

---

## Useful Commands

```bash
# Backend
npm run dev          # Start with nodemon
npm start            # Start without nodemon
npm run test-email   # Test email service

# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
# Clear all data
node backend/scripts/clearAllUserData.js

# Delete all users
node backend/scripts/deleteAllUsers.js
```

---

## Environment Variables Reference

### Backend (config.env)
```env
MONGODB_URI=mongodb+srv://...
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
OPENAI_API_KEY=sk-...
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_DISABLE_SYMLINKS=true
NEXT_FORCE_DISK_CACHE=true
```

---

## Support & Resources

- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **OpenAI API**: https://platform.openai.com/
- **Next.js Docs**: https://nextjs.org/docs
- **Express.js Docs**: https://expressjs.com/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintainer**: TrackLy Development Team
