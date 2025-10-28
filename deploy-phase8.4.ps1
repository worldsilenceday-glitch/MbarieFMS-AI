# Phase 8.4 Deployment and Verification Script for Windows
# Auto-email webhook setup and comprehensive deployment verification

Write-Host "🚀 Phase 8.4: Mbarie FMS AI Deployment Verification" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FrontendUrl = "https://mbarie-fms.netlify.app"
$BackendUrl = "https://mbarie-fms-ai-production.up.railway.app"
$TestEmail = "haroon.amin@mbarieservicesltd.com"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Frontend: $FrontendUrl" -ForegroundColor White
Write-Host "  Backend:  $BackendUrl" -ForegroundColor White
Write-Host "  Test Email: $TestEmail" -ForegroundColor White
Write-Host ""

# Step 1: Check if Node.js is available
Write-Host "🔍 Step 1: Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Install required dependencies
Write-Host "📦 Step 2: Installing dependencies..." -ForegroundColor Yellow
try {
    npm install axios
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Run the deployment verification
Write-Host "🔍 Step 3: Running comprehensive deployment verification..." -ForegroundColor Yellow
Write-Host "This will test:" -ForegroundColor White
Write-Host "  • Frontend accessibility" -ForegroundColor White
Write-Host "  • Backend health endpoints" -ForegroundColor White
Write-Host "  • Notification service" -ForegroundColor White
Write-Host "  • Auto-email webhook functionality" -ForegroundColor White
Write-Host "  • Core API endpoints" -ForegroundColor White
Write-Host ""

# Set environment variables for the verification script
$env:FRONTEND_URL = $FrontendUrl
$env:BACKEND_URL = $BackendUrl
$env:TEST_EMAIL = $TestEmail

try {
    node deploy-and-verify-phase8.4.js
    Write-Host ""
    Write-Host "✅ Phase 8.4 verification completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Verification script failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Display next steps
Write-Host "📝 Step 4: Next Steps for Production Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Frontend Deployment (Netlify):" -ForegroundColor Yellow
Write-Host "   • Go to https://app.netlify.com/" -ForegroundColor White
Write-Host "   • Connect your GitHub repository" -ForegroundColor White
Write-Host "   • Set build command: npm run build" -ForegroundColor White
Write-Host "   • Set publish directory: client/dist" -ForegroundColor White
Write-Host "   • Deploy and get your frontend URL" -ForegroundColor White
Write-Host ""

Write-Host "2. Backend Deployment (Railway):" -ForegroundColor Yellow
Write-Host "   • Go to https://railway.app/" -ForegroundColor White
Write-Host "   • Connect your GitHub repository" -ForegroundColor White
Write-Host "   • Add environment variables:" -ForegroundColor White
Write-Host "     - DATABASE_URL=postgresql://<your_database_url>" -ForegroundColor White
Write-Host "     - OPENAI_API_KEY=<your_openai_api_key>" -ForegroundColor White
Write-Host "     - DEEPSEEK_API_KEY=<your_deepseek_api_key>" -ForegroundColor White
Write-Host "     - JWT_SECRET=<your_custom_secret>" -ForegroundColor White
Write-Host "     - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS" -ForegroundColor White
Write-Host "   • Deploy and get your backend URL" -ForegroundColor White
Write-Host ""

Write-Host "3. Update Configuration:" -ForegroundColor Yellow
Write-Host "   • Update FRONTEND_URL and BACKEND_URL in deploy-and-verify-phase8.4.js" -ForegroundColor White
Write-Host "   • Or set them as environment variables" -ForegroundColor White
Write-Host ""

Write-Host "4. Run Final Verification:" -ForegroundColor Yellow
Write-Host "   • Re-run this script after deployment" -ForegroundColor White
Write-Host "   • Check that all systems are operational" -ForegroundColor White
Write-Host "   • Verify email notifications are working" -ForegroundColor White
Write-Host ""

Write-Host "5. Production Readiness:" -ForegroundColor Yellow
Write-Host "   • Test all features: login, chat, file upload, etc." -ForegroundColor White
Write-Host "   • Verify mobile responsiveness" -ForegroundColor White
Write-Host "   • Set up monitoring and alerts" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Your Mbarie FMS AI system is ready for production!" -ForegroundColor Green
Write-Host ""

# Optional: Open deployment URLs
$openUrls = Read-Host "Would you like to open the deployment URLs in browser? (y/n)"
if ($openUrls -eq 'y' -or $openUrls -eq 'Y') {
    Write-Host "🌐 Opening deployment URLs..." -ForegroundColor Cyan
    Start-Process $FrontendUrl
    Start-Process "$BackendUrl/api/health"
}
