# Simple Backend Deployment Script for Railway
Write-Host "🚀 Deploying Mbarie FMS Backend to Railway..." -ForegroundColor Cyan

# Navigate to server directory
Set-Location server

# Check if we're logged in to Railway
Write-Host "Checking Railway login status..." -ForegroundColor Yellow
railway whoami

# Deploy the backend
Write-Host "Deploying backend to Railway..." -ForegroundColor Green
railway up

Write-Host "✅ Backend deployment initiated!" -ForegroundColor Green
Write-Host "Check Railway dashboard for deployment status: https://railway.app" -ForegroundColor Yellow
