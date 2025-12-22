# TrackLy - Attendance Tracker

A modern web application for tracking student attendance, built with Next.js and Supabase.

## Features

- User authentication with Supabase Auth
- Attendance tracking
- Subject management
- Todo list management
- Notifications system
- Profile management

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd frontend
npm install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Disable all symlink functionality for Windows/OneDrive
NEXT_DISABLE_SYMLINKS=true
NEXT_FORCE_DISK_CACHE=true
NEXT_EXPERIMENTAL_SYMBOLIC_LINK_PROTECTION=false

# Use polling for file watching (helps with OneDrive)
CHOKIDAR_USEPOLLING=1
WATCHPACK_POLLING=true
```

You can get your Supabase URL and anon key from your Supabase project dashboard.

### Running the Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Setup

1. Create a new project on [Supabase](https://supabase.com/)
2. Set up the database tables using the schema in `lib/supabase/schema.sql`
3. Enable Email Auth in Authentication settings
4. Copy your project URL and anon key to the `.env.local` file

## Project Structure

- `app/` - Next.js app router pages and layouts
- `components/` - Reusable UI components
- `lib/` - Utility functions and Supabase client
  - `supabase/` - Supabase client and database types
- `public/` - Static assets
- `styles/` - Global CSS styles

## Deployment

The easiest way to deploy this app is using [Vercel](https://vercel.com/):

1. Push your code to a Git repository
2. Import the project in Vercel
3. Add your environment variables
4. Deploy!

## License

MIT
