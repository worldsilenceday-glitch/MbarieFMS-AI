# Simple Phase 7.7 Deployment Script
Write-Host "🚀 Starting Phase 7.7 Deployment" -ForegroundColor Cyan

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Blue
npm install

# Build the application
Write-Host "Building application..." -ForegroundColor Blue
npm run build

# Run tests
Write-Host "Running tests..." -ForegroundColor Blue
node test-phase7.7.js

# Update environment variables
Write-Host "Updating environment configuration..." -ForegroundColor Blue
$EnvContent = @"
VITE_APP_VERSION=7.7.0
VITE_MAINTENANCE_SYNC_INTERVAL=30000
VITE_AI_MODEL_MODE=predictive
VITE_SENSOR_STREAM_ENABLED=true
VITE_PREDICTIVE_MAINTENANCE_ENABLED=true
VITE_VOICE_CONTROLS_ENABLED=true
"@
$EnvContent | Out-File -FilePath ".env.production" -Encoding UTF8

Write-Host "🎉 Phase 7.7 Deployment Complete!" -ForegroundColor Green
Write-Host "Predictive Maintenance + Dynamic Scheduling AI is now live!" -ForegroundColor Green
