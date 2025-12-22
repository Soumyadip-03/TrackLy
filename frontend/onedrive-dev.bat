@echo off
echo Starting Next.js development server with special OneDrive compatibility settings...

REM Set environment variables
set NEXT_TELEMETRY_DISABLED=1
set NODE_ENV=development
set NEXT_DISABLE_SYMLINKS=true
set NEXT_FORCE_DISK_CACHE=true
set NEXT_EXPERIMENTAL_SYMBOLIC_LINK_PROTECTION=false
set CHOKIDAR_USEPOLLING=1
set WATCHPACK_POLLING=true

REM Remove .next directory if it exists
if exist .next (
    echo Removing .next directory...
    rmdir /s /q .next
)

REM Remove .babelrc if it exists
if exist .babelrc (
    echo Removing incompatible .babelrc file...
    del /f .babelrc
)

echo Starting Next.js with OneDrive compatibility settings...
npx --no-install cross-env NODE_ENV=development NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS="--no-warnings --max-old-space-size=4096" CHOKIDAR_USEPOLLING=1 NEXT_DISABLE_SYMLINKS=true NEXT_FORCE_DISK_CACHE=true WATCHPACK_POLLING=true NEXT_EXPERIMENTAL_SYMBOLIC_LINK_PROTECTION=false next dev 