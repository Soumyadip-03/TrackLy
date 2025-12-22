# PowerShell script to set optimization environment variables
Write-Host "Setting environment variables for Next.js optimization..." -ForegroundColor Green

# Next.js Optimization Settings
$env:NEXT_TELEMETRY_DISABLED = 1
$env:NODE_ENV = "production"
$env:NEXT_RUNTIME = "edge"
$env:NEXT_TURBO = 1

# Reduce Webpack processing
$env:NEXT_WEBPACK_USEPOLLING = 0
$env:NEXT_MINIMIZE = 1

# Memory optimizations
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# Disable source maps in development for faster builds
$env:GENERATE_SOURCEMAP = "false"

# Disable type checking during development
$env:DISABLE_ESLINT_PLUGIN = "true"
$env:TSC_COMPILE_ON_ERROR = "true"
$env:ESLINT_NO_DEV_ERRORS = "true"

# API Configuration
$env:NEXT_PUBLIC_API_URL = "http://localhost:5000"
$env:NEXT_PUBLIC_BACKEND_URL = "http://localhost:5000"

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "Run 'npx next dev' to start Next.js in optimized mode" -ForegroundColor Cyan 