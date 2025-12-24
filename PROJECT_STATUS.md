# TrackLy - Project Status & Setup Guide

## Project Overview

TrackLy is a comprehensive student attendance tracking system built with:
- **Frontend**: Next.js 15.5.9 with Tailwind CSS
- **Backend**: Express.js with MongoDB Atlas
- **Database**: MongoDB Atlas
- **Authentication**: JWT-based authentication
- **Email Service**: Gmail SMTP
- **AI Integration**: OpenAI API (for chatbot)

---

## Current Project Status

### ✅ Completed Setup

1. **Backend Configuration**
   - Express.js server running on port 5000
   - MongoDB Atlas connection configured
   - JWT authentication implemented
   - Email notification system configured with Gmail
   - OpenAI integration (lazy-loaded to allow startup without API key)

2. **Frontend Setup**
   - Next.js development server running on port 3000
   - Build cache issues resolved
   - CORS configured for localhost:3000

3. **Environment Configuration**
   - Backend config file: `backend/config/config.env`
   - Frontend config file: `frontend/.env.local`

### 📋 Environment Variables

#### Backend (`backend/config/config.env`)
```
MONGODB_URI=mongodb+srv://soumyadipkhansarkar_db_user:RWX5LoZDFA4TlbJD@trackly.hum7e5a.mongodb.net/?appName=TrackLy
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f
OPENAI_API_KEY=<pending - add your OpenAI API key>
EMAIL_SERVICE=gmail
EMAIL_USER=trackly.notification@gmail.com
EMAIL_PASSWORD=Soumyadip@18
```

#### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
NEXT_DISABLE_SYMLINKS=true
NEXT_FORCE_DISK_CACHE=true
NEXT_EXPERIMENTAL_SYMBOLIC_LINK_PROTECTION=false
CHOKIDAR_USEPOLLING=1
WATCHPACK_POLLING=true
```

---

## Running the Application

### Backend
```bash
cd backend
npm run dev
```
Server runs on: http://localhost:5000

### Frontend
```bash
cd frontend
npm run dev
```
Application runs on: http://localhost:3000

---

## Key Features

### Authentication
- User registration and login with JWT tokens
- Protected routes with authentication middleware
- Role-based authorization

### Attendance Tracking
- Track class attendance
- View attendance history
- Attendance percentage calculations
- Subject management

### Notifications
- Email notifications for important events
- Welcome emails for new users
- Security alerts for login events
- Daily/weekly notification digests
- In-app notification system

### Todo Management
- Create and manage tasks
- Task status tracking
- Priority levels

### AI Chatbot
- Attendance-related queries
- Schedule information
- Productivity tips
- Fallback responses when OpenAI API is unavailable

### File Management
- PDF schedule uploads
- File storage and retrieval
- Schedule parsing

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create attendance record
- `PUT /api/attendance/:id` - Update attendance

### Subjects
- `GET /api/subject` - Get all subjects
- `POST /api/subject` - Create subject
- `PUT /api/subject/:id` - Update subject

### Todo
- `GET /api/todo` - Get todos
- `POST /api/todo` - Create todo
- `PUT /api/todo/:id` - Update todo
- `DELETE /api/todo/:id` - Delete todo

### Notifications
- `GET /api/notification` - Get notifications
- `POST /api/notification` - Create notification
- `PUT /api/notification/:id/read` - Mark as read
- `DELETE /api/notification/:id` - Delete notification

### Chatbot
- `GET /api/chatbot/history` - Get chat history
- `POST /api/chatbot/message` - Send message to chatbot
- `DELETE /api/chatbot/history` - Clear chat history

### File Uploads
- `POST /api/uploads/schedule` - Upload schedule PDF
- `GET /uploads/:filename` - Retrieve uploaded file

---

## Database Schema

### Main Database (MongoDB Atlas)
- **users**: User accounts and authentication
- **subjects**: Course/subject information
- **attendance**: Attendance records
- **todos**: Task management
- **notifications**: System notifications
- **projects**: Project versions and tracking

### User-Specific Databases
- Each user has their own MongoDB database for:
  - Chat history
  - User-specific settings
  - Personal data

---

## Pending Tasks

1. **OpenAI API Key**
   - Add your OpenAI API key to `backend/config/config.env`
   - Get it from: https://platform.openai.com/api-keys

2. **Frontend Supabase Configuration** (if using Supabase)
   - Configure Supabase URL and keys in `frontend/.env.local`
   - Or update frontend to use backend API instead

3. **Email Testing**
   - Test email notifications with: `npm run test-email your-email@example.com`
   - Test security emails with: `npm run test-security-email your-email@example.com`

---

## Troubleshooting

### Backend Issues
- **MongoDB Connection Error**: Verify MongoDB URI in config.env
- **Email Configuration Error**: Check EMAIL_USER and EMAIL_PASSWORD
- **OpenAI Error**: Add OPENAI_API_KEY or chatbot will use fallback responses

### Frontend Issues
- **Build Cache Error**: Delete `.next` folder and restart
- **Port Already in Use**: Change PORT in config.env or kill process on port 5000/3000
- **CORS Error**: Verify FRONTEND_URL matches frontend URL

### Git Warning
- **LF/CRLF Warning**: Run `git config core.safecrlf false` to suppress

---

## Project Structure

```
PROJECT-1 (Trackly)/TrackLy/
├── backend/
│   ├── config/
│   │   └── config.env          # Environment variables
│   ├── routes/                 # API routes
│   ├── models/                 # Database models
│   ├── middleware/             # Auth & error handling
│   ├── utils/                  # Helper functions
│   ├── controllers/            # Business logic
│   ├── migrations/             # Database migrations
│   ├── scripts/                # Utility scripts
│   ├── uploads/                # File storage
│   ├── server.js               # Main server file
│   └── package.json
├── frontend/
│   ├── app/                    # Next.js pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities
│   ├── public/                 # Static assets
│   ├── .env.local              # Frontend env vars
│   └── package.json
└── PROJECT_STATUS.md           # This file
```

---

## Development Notes

- Backend uses nodemon for auto-restart on file changes
- Frontend uses Next.js hot reload
- All API calls use JWT authentication (except login/register)
- Email service uses Gmail SMTP with app-specific passwords
- MongoDB uses connection pooling for better performance

---

## Next Steps

1. Add OpenAI API key to backend config
2. Configure Supabase (if needed) or update frontend to use backend API
3. Test email notifications
4. Run both servers and test the application
5. Create test user accounts
6. Verify attendance tracking functionality

---

**Last Updated**: Current Session
**Status**: Ready for Development
