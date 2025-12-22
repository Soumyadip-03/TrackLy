# PowerShell script to run Next.js in development mode with optimizations
Write-Host "Starting Next.js in fast development mode..." -ForegroundColor Green

# Set environment variables
$env:NEXT_TELEMETRY_DISABLED = 1
$env:NODE_ENV = "development"
$env:NEXT_TURBO = "true"

# Clear Next.js cache
Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path "./.next") {
    Remove-Item -Path "./.next/cache" -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove .babelrc if it exists
if (Test-Path "./.babelrc") {
    Write-Host "Removing incompatible .babelrc file..." -ForegroundColor Yellow
    Remove-Item -Path "./.babelrc" -Force -ErrorAction SilentlyContinue
}

# Run Next.js dev server with Turbo mode
Write-Host "Starting Next.js with Turbopack..." -ForegroundColor Cyan
npx next dev --turbo 