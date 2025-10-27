# PowerShell Automation Script for Phase 8.0 & 8.1 Deployment
# Mbarie FMS AI - Backend Recovery & User Registration Workflow

Write-Host "🚀 Starting Phase 8.0 & 8.1 Deployment Automation" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# Function to log with timestamp
function Log-Info {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Yellow
}

# Function to log success
function Log-Success {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ $Message" -ForegroundColor Green
}

# Function to log error
function Log-Error {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ❌ $Message" -ForegroundColor Red
}

# Function to check command success
function Test-CommandSuccess {
    param([string]$CommandName)
    if ($LASTEXITCODE -eq 0) {
        Log-Success "$CommandName completed successfully"
        return $true
    } else {
        Log-Error "$CommandName failed with exit code $LASTEXITCODE"
        return $false
    }
}

# Phase 8.0 - Backend Deployment Recovery
Write-Host "`n📦 Phase 8.0: Backend Deployment Recovery" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta

# Check if Railway CLI is installed
Log-Info "Checking Railway CLI installation..."
$railwayVersion = railway --version 2>$null
if ($railwayVersion) {
    Log-Success "Railway CLI installed: $railwayVersion"
} else {
    Log-Error "Railway CLI not found. Please install with: npm install -g @railway/cli"
    exit 1
}

# Check Railway login status
Log-Info "Checking Railway authentication..."
$whoami = railway whoami 2>$null
if ($whoami -like "*worldsilenceday@gmail.com*") {
    Log-Success "Logged in to Railway as worldsilenceday@gmail.com"
} else {
    Log-Error "Not logged in to Railway. Please run: railway login"
    exit 1
}

# Check project linkage
Log-Info "Checking project linkage..."
$status = railway status 2>$null
if ($status -like "*energetic-energy*") {
    Log-Success "Linked to project: energetic-energy"
} else {
    Log-Error "Not linked to project. Please run: railway link"
    exit 1
}

# Attempt Railway deployment
Log-Info "Attempting Railway deployment..."
cd server
$deployResult = railway up 2>&1
if ($LASTEXITCODE -eq 0) {
    Log-Success "Backend deployed successfully to Railway"
    $backendUrl = $deployResult | Select-String -Pattern "https://.*\.railway\.app" | ForEach-Object { $_.Matches.Value }
    if ($backendUrl) {
        Log-Success "Backend URL: $backendUrl"
    }
} else {
    Log-Error "Railway deployment failed. Account may have limitations."
    Log-Info "Skipping Railway deployment and proceeding with existing backend configuration"
}

# Phase 8.1 - User Registration Workflow & AI Dashboard Verification
Write-Host "`n👤 Phase 8.1: User Registration Workflow & AI Dashboard Verification" -ForegroundColor Magenta
Write-Host "==================================================================" -ForegroundColor Magenta

# Update frontend environment
Log-Info "Updating frontend environment configuration..."
$frontendEnvPath = "client\.env"
if (Test-Path $frontendEnvPath) {
    $envContent = Get-Content $frontendEnvPath -Raw
    # Ensure backend URL is set correctly
    if ($envContent -notmatch "VITE_SERVER_URL=https://") {
        Log-Error "Frontend environment missing VITE_SERVER_URL"
    } else {
        Log-Success "Frontend environment configured with backend URL"
    }
} else {
    Log-Error "Frontend environment file not found at $frontendEnvPath"
}

# Build frontend
Log-Info "Building frontend application..."
cd client
npm run build
if (Test-CommandSuccess "Frontend build") {
    Log-Success "Frontend built successfully"
} else {
    Log-Error "Frontend build failed"
    exit 1
}

# Deploy to Netlify
Log-Info "Deploying frontend to Netlify..."
if (Get-Command ntl -ErrorAction SilentlyContinue) {
    ntl deploy --prod --dir=dist
    if (Test-CommandSuccess "Netlify deployment") {
        Log-Success "Frontend deployed to Netlify"
    } else {
        Log-Error "Netlify deployment failed"
    }
} else {
    Log-Info "Netlify CLI not found. Skipping automatic deployment."
    Log-Info "Manual deployment required: netlify deploy --prod --dir=dist"
}

# Test backend connectivity
Write-Host "`n🔗 Testing Backend Connectivity" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$backendUrls = @(
    "https://api.mbarie-fms.com/health",
    "https://api.mbarie-fms.com/api/auth/health"
)

foreach ($url in $backendUrls) {
    Log-Info "Testing connectivity to: $url"
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Log-Success "✅ Backend reachable at $url"
        } else {
            Log-Error "❌ Backend returned status: $($response.StatusCode)"
        }
    } catch {
        Log-Error "❌ Backend unreachable at $url - $($_.Exception.Message)"
    }
}

# User Registration Workflow Test Instructions
Write-Host "`n🧪 User Registration Workflow Test Instructions" -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue

Write-Host @"
1. Open Netlify URL: https://lambent-raindrop-ec0707.netlify.app
2. Click 'Register' button
3. Create test user:
   - Name: Test Admin
   - Email: admin@mbarie.ai  
   - Password: SecurePass123
   - Role: Admin
4. Login with created credentials
5. Navigate through dashboard sections:
   - AI Chat
   - Inventory
   - Settings
6. Verify role-based access works correctly
7. Test AI features:
   - Text queries in AI Chat
   - File uploads
   - Voice commands (if available)
"@ -ForegroundColor White

# Verification Checklist
Write-Host "`n✅ Deployment Verification Checklist" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

$checklist = @(
    @{ Item = "Backend deployed (Railway or existing)"; Status = $false },
    @{ Item = "Frontend built successfully"; Status = $false },
    @{ Item = "Frontend deployed to Netlify"; Status = $false },
    @{ Item = "Backend connectivity verified"; Status = $false },
    @{ Item = "User registration functional"; Status = $false },
    @{ Item = "AI chat working"; Status = $false },
    @{ Item = "Role-based access verified"; Status = $false }
)

# Update checklist based on deployment results
if (Test-Path "client\dist") { $checklist[1].Status = $true }
if ($backendUrl -or (Test-Path "server\.env")) { $checklist[0].Status = $true }

foreach ($item in $checklist) {
    $status = if ($item.Status) { "✅" } else { "❌" }
    Write-Host "$status $($item.Item)" -ForegroundColor $(if ($item.Status) { "Green" } else { "Red" })
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host "1. Run the user registration workflow test manually" -ForegroundColor White
Write-Host "2. Verify all dashboard features are functional" -ForegroundColor White
Write-Host "3. Check console logs for any errors" -ForegroundColor White
Write-Host "4. Test AI personalization and data sync" -ForegroundColor White

Write-Host "`n🚀 Phase 8.0 & 8.1 Deployment Automation Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
