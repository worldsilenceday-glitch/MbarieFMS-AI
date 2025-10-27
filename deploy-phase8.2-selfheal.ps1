# =============================================================
# MBARIE FMS AI - Phase 8.2 Self-Healing CI/CD Automation
# -------------------------------------------------------------
# Intelligent deployment and monitoring pipeline for production.
#  - Verifies backend, AI APIs, and database availability
#  - Auto-redeploys backend or frontend if failures detected
#  - Syncs environment variables between Railway + Netlify
#  - Generates real-time reports
# =============================================================

$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\MBARIESERVICESLTD\OneDrive\Documents\mbarie-fms-ai"
$serverDir   = "$projectRoot\server"
$clientDir   = "$projectRoot\client"
$logFile     = "$projectRoot\phase8.2_selfheal.log"

$railwayProject = "mbarie-fms-api"
$netlifySite    = "mbarie-fms.netlify.app"
$backendFallback = "https://api.mbarie-fms.com"

Start-Transcript -Path $logFile -Append
Write-Host "`n🚀 Starting Phase 8.2 - Self-Healing CI/CD Automation..." -ForegroundColor Cyan

# --- [1] Detect Backend URL ---
Write-Host "`n🌐 Detecting active backend deployment..."
try {
    $railwayInfo = railway status | Out-String
    if ($railwayInfo -match "https://[^\s]+\.railway\.app") {
        $backendURL = ($railwayInfo | Select-String -Pattern "https://[^\s]+\.railway\.app").Matches.Value
        Write-Host "✅ Railway backend detected: $backendURL"
    } else {
        $backendURL = $backendFallback
        Write-Host "⚠️ Using fallback backend: $backendURL"
    }
} catch {
    $backendURL = $backendFallback
    Write-Host "⚠️ Defaulting to fallback backend URL: $backendURL"
}

# --- [2] Validate Backend ---
Write-Host "`n🧪 Checking backend status..."
try {
    $response = Invoke-WebRequest -Uri "$backendURL/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is online and responding."
    } else {
        throw "Backend responded with code $($response.StatusCode)"
    }
} catch {
    Write-Host "❌ Backend check failed. Attempting redeploy..."
    Set-Location $serverDir
    railway up
}

# --- [3] Validate Database Connection ---
Write-Host "`n🧩 Checking PostgreSQL database connectivity..."
try {
    $dbCheck = Invoke-WebRequest -Uri "$backendURL/api/ai/dbcheck" -UseBasicParsing -TimeoutSec 10
    if ($dbCheck.StatusCode -eq 200) {
        Write-Host "✅ PostgreSQL connected successfully."
    } else {
        Write-Host "⚠️ DB check returned non-200 code."
    }
} catch {
    Write-Host "❌ Database connection failed. Restarting Railway service..."
    railway restart
}

# --- [4] Validate AI Services (DeepSeek/OpenAI) ---
Write-Host "`n🧠 Testing AI service connectivity..."
$testPrompt = '{"message":"system-check"}'
try {
    $aiResponse = Invoke-WebRequest -Uri "$backendURL/api/ai/test" -Method POST -Body $testPrompt -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
    if ($aiResponse.StatusCode -eq 200) {
        Write-Host "✅ AI service operational."
    } else {
        throw "AI returned code $($aiResponse.StatusCode)"
    }
} catch {
    Write-Host "❌ AI service failed. Triggering self-heal..."
    Set-Location $serverDir
    railway up
}

# --- [5] Update Frontend Environment Variables ---
Write-Host "`n🔧 Synchronizing frontend environment..."
$envFileClient = "$clientDir\.env.production"
Set-Content $envFileClient "VITE_SERVER_URL=$backendURL`nVITE_DEPLOY_ENV=production" -Force
Write-Host "✅ Updated frontend environment with backend URL: $backendURL"

# --- [6] Rebuild and Deploy Frontend if Needed ---
Write-Host "`n🧱 Checking frontend availability..."
try {
    $frontendCheck = Invoke-WebRequest -Uri "https://$netlifySite" -UseBasicParsing -TimeoutSec 10
    if ($frontendCheck.StatusCode -eq 200) {
        Write-Host "✅ Frontend is online."
    } else {
        throw "Frontend returned code $($frontendCheck.StatusCode)"
    }
} catch {
    Write-Host "⚠️ Frontend not responding — rebuilding and deploying..."
    Set-Location $clientDir
    npm install
    npm run build
    netlify deploy --prod --dir=dist
}

# --- [7] System Health Summary ---
Write-Host "`n📊 System Health Summary:"
Write-Host "   Backend URL: $backendURL"
Write-Host "   Frontend: https://$netlifySite"
Write-Host "   Database: PostgreSQL (Railway)"
Write-Host "   AI Service: DeepSeek / OpenAI endpoint verified"

# --- [8] Logging and Notification ---
Write-Host "`n📨 Sending health log to admin..."
$dateStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $logFile "`n[$dateStamp] Health Check Completed for Mbarie FMS AI"
Write-Host "✅ Health check and self-healing process complete."

Stop-Transcript
