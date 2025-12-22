@echo off
echo Starting ultra-fast Next.js development environment...

REM Next.js Optimization Settings
set NEXT_TELEMETRY_DISABLED=1
set NODE_ENV=production
set NEXT_RUNTIME=edge
set NEXT_TURBO=1

REM Reduce Webpack processing
set NEXT_WEBPACK_USEPOLLING=0
set NEXT_MINIMIZE=1

REM Memory optimizations
set NODE_OPTIONS=--max-old-space-size=4096

REM Disable source maps in development for faster builds
set GENERATE_SOURCEMAP=false

REM Disable type checking during development
set DISABLE_ESLINT_PLUGIN=true
set TSC_COMPILE_ON_ERROR=true
set ESLINT_NO_DEV_ERRORS=true

REM API Configuration
set NEXT_PUBLIC_API_URL=http://localhost:5000
set NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

REM Clear Next.js cache
echo Clearing Next.js cache...
if exist .next\cache (
    rmdir /s /q .next\cache
)

echo Starting Next.js with Turbopack in ultra-fast mode...
npx next dev --turbo 