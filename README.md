# TrackLy - Student Attendance Tracking System

TrackLy is a comprehensive system designed to help students track, manage, and optimize their class attendance. It provides tools to monitor attendance percentages, plan absences, and maintain good academic standing.

## Project Structure

- `frontend/`: Next.js application with Supabase integration
- `backend/`: Express.js API server

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

The backend will run on http://localhost:5000.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```
   npm run dev
   ```

The application will run on http://localhost:3000.

## Features

- User authentication with Supabase Auth
- Real-time updates using Supabase Realtime
- Secure data storage with Supabase Database
- File storage with Supabase Storage
- Modern UI with Tailwind CSS
- Type-safe database operations

## Environment Variables

### Backend
Environment variables are stored in `backend/config/config.env`.

### Frontend
The frontend uses the following environment variables:
- `NEXT_PUBLIC_API_URL`: The URL of the backend API (defaults to http://localhost:5000/api)
- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for Supabase authentication

## Authentication

The system uses Supabase Auth for authentication. User sessions are managed securely through Supabase's built-in authentication system.

## Routes

- `/login`: User login
- `/register`: User registration
- `/dashboard`: Main dashboard (authenticated)
- `/profile`: User profile (authenticated)
- `/about`: About page with system information (authenticated)
- `/attendance`: Attendance tracking (authenticated)
- `/todo`: To-do list management (authenticated)
- `/notifications`: User notifications (authenticated)
- `/history`: Attendance history (authenticated)

## Troubleshooting

If you encounter any issues:

1. Make sure your Supabase project is properly configured
2. Check that environment variables are set correctly
3. Clear browser cache and localStorage if experiencing authentication issues
4. Ensure all dependencies are installed correctly

## Database Schema

The application uses the following Supabase tables:

- profiles: User profiles and settings
- subjects: Course/subject information
- attendance: Attendance records
- todos: Task management
- notifications: System notifications
- project_versions: Version tracking

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 