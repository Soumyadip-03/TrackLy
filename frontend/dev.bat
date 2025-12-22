@echo off
echo Starting Next.js development server with Windows compatibility...

REM Set environment variables
set NEXT_TELEMETRY_DISABLED=1
set NODE_ENV=development
set NEXT_DISABLE_SYMLINKS=true
set NEXT_FORCE_DISK_CACHE=true
set NEXT_EXPERIMENTAL_SYMBOLIC_LINK_PROTECTION=false
set CHOKIDAR_USEPOLLING=1

REM Remove .babelrc if it exists
if exist .babelrc (
    echo Removing incompatible .babelrc file...
    del /f .babelrc
)

echo Starting Next.js with Windows compatibility settings...
npx cross-env NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS="--no-warnings" CHOKIDAR_USEPOLLING=1 NEXT_DISABLE_SYMLINKS=true NEXT_FORCE_DISK_CACHE=true NEXT_EXPERIMENTAL_SYMBOLIC_LINK_PROTECTION=false next dev