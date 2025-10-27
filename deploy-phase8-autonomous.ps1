# =============================================================
# MBARIE FMS AI - Phase 8.0 + 8.1 Autonomous Deployment System
# -------------------------------------------------------------
# Features:
# - Auto-detect backend URL (Railway API fallback to existing)
# - Auto-update frontend environment variables
# - Auto-trigger Netlify rebuild
# - AI Chat + Registration workflow verification
# -------------------------------------------------------------
# Author: Haroon A. - Intelligent Deployment Sequence
# =============================================================

$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\MBARIESERVICESLTD\OneDrive\Documents\mbarie-fms-ai"
$serverDir  = "$projectRoot\server"
$clientDir  = "$projectRoot\client"
$logFile    = "$projectRoot\phase8_autonomous.log"

Start-Transcript -Path $logFile -Append
Write-Host "`n🚀 Starting Autonomous Deployment for Mbarie FMS AI..." -ForegroundColor Cyan

# --- [1] Verify Node, NPM, and Git ---
Write-Host "`n🔍 Checking Node.js, npm, and git..."
node -v
npm -v
git --version

# --- [2] Verify and Install Railway CLI ---
Write-Host "`n⚙️  Checking Railway CLI installation..."
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Railway CLI globally..."
    npm install -g @railway/cli
}
railway --version

# --- [3] Verify Railway Authentication ---
Write-Host "`n🔐 Authenticating Railway..."
try {
    $railwayUser = railway whoami
    Write-Host "✅ Logged in as: $railwayUser"
} catch {
    Write-Host "⚠️ Not logged in. Logging in now..."
    railway login
}

# --- [4] Link to Project ---
Set-Location $serverDir
Write-Host "`n🔗 Linking to Railway project..."
railway link --project energetic-energy

# --- [5] Detect Backend URL Automatically ---
Write-Host "`n🌐 Detecting deployed backend URL..."
try {
    $railwayInfo = railway status | Out-String
    if ($railwayInfo -match "https://[^\s]+\.railway\.app") {
        $backendURL = ($railwayInfo | Select-String -Pattern "https://[^\s]+\.railway\.app").Matches.Value
        Write-Host "✅ Auto-detected Railway backend URL: $backendURL"
    } else {
        $backendURL = "https://api.mbarie-fms.com"
        Write-Host "⚠️ Could not detect active Railway URL. Using fallback: $backendURL"
    }
} catch {
    $backendURL = "https://api.mbarie-fms.com"
    Write-Host "⚠️ Fallback URL applied: $backendURL"
}

# --- [6] Apply Environment Variables ---
Write-Host "`n🧩 Updating environment variables for backend and frontend..."
$envFileServer = "$serverDir\.env"
$envFileClient = "$clientDir\.env"

if (-not (Test-Path $envFileServer)) {
    Write-Host "Creating new server .env..."
    Set-Content $envFileServer "SERVER_URL=$backendURL`nNODE_ENV=production"
}

Set-Content $envFileClient "VITE_SERVER_URL=$backendURL" -Force
Write-Host "✅ Frontend .env updated with backend URL: $backendURL"

# --- [7] Build and Deploy Frontend ---
Set-Location $clientDir
Write-Host "`n🛠️  Installing frontend dependencies..."
npm install

Write-Host "`n🏗️  Building production frontend..."
npm run build

Write-Host "`n🌍 Deploying frontend to Netlify (auto)..."
if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
    npm install -g netlify-cli
}
$deployOutput = netlify deploy --prod --dir=dist
$frontendURL = ($deployOutput | Select-String -Pattern "Website URL:\s*(https[^\s]+)").Matches.Value -replace "Website URL:\s*", ""
Write-Host "✅ Frontend deployed successfully: $frontendURL"

# --- [8] Verification Tests ---
Write-Host "`n🔎 Running verification checks..."
try {
    $statusCheck = Invoke-WebRequest -Uri "$backendURL/api/status" -UseBasicParsing
    if ($statusCheck.StatusCode -eq 200) {
        Write-Host "✅ Backend API reachable at $backendURL"
    } else {
        Write-Host "⚠️ Backend returned non-200 response."
    }
} catch {
    Write-Host "⚠️ Unable to reach backend API at $backendURL"
}

# --- [9] AI & Registration UI Tests ---
Write-Host "`n🧠 Begin visual verification at frontend:"
Write-Host "   1. Open: $frontendURL"
Write-Host "   2. Register new user:"
Write-Host "        Name: Test Admin"
Write-Host "        Email: admin@mbarie.ai"
Write-Host "        Password: SecurePass123"
Write-Host "        Role: Admin"
Write-Host "   3. Verify login, dashboard, and AI Chat."
Write-Host "   4. Check inventory and maintenance modules."
Write-Host "   5. Confirm voice and file uploads in AI chat."

# --- [10] Log Completion ---
Write-Host "`n✅ Phase 8.0 + 8.1 Autonomous Deployment complete!"
Write-Host "📘 Report saved to: $logFile"
Stop-Transcript
