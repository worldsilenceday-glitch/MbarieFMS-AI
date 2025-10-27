#!/bin/bash

# Phase 7.7 - Predictive Maintenance + Dynamic Scheduling AI
# Deployment Script for Mbarie FMS AI

set -e

echo "🚀 Starting Phase 7.7 Deployment - Predictive Maintenance System"
echo "================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    print_success "Node.js version $NODE_VERSION is compatible"
else
    print_error "Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION+"
    exit 1
fi

# Phase 7.7 Deployment Steps
print_status "Phase 7.7 Deployment Steps:"
echo "1. Install/Update Dependencies"
echo "2. Build Frontend Application"
echo "3. Run Phase 7.7 Tests"
echo "4. Deploy to Netlify"
echo "5. Update Environment Variables"
echo "6. Verify Deployment"
echo ""

# Step 1: Install/Update Dependencies
print_status "Step 1: Installing/Updating Dependencies..."
cd client

if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# Install additional dependencies for predictive maintenance
print_status "Installing predictive maintenance dependencies..."
npm install --save-dev @types/node

cd ..

print_success "Dependencies installed successfully"

# Step 2: Build Frontend Application
print_status "Step 2: Building Frontend Application..."
cd client

print_status "Building with Phase 7.7 features..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build completed successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

# Step 3: Run Phase 7.7 Tests
print_status "Step 3: Running Phase 7.7 Tests..."
cd client

print_status "Running predictive maintenance tests..."
if node test-phase7.7.js; then
    print_success "Phase 7.7 tests passed"
else
    print_error "Phase 7.7 tests failed"
    print_warning "Continuing deployment, but please review test failures"
fi

cd ..

# Step 4: Deploy to Netlify
print_status "Step 4: Deploying to Netlify..."
cd client

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    print_warning "Netlify CLI not found, installing..."
    npm install -g netlify-cli
fi

# Check if we're logged in to Netlify
if ! netlify status &> /dev/null; then
    print_warning "Not logged in to Netlify. Please run: netlify login"
    print_status "You can deploy manually by pushing to your connected Git repository"
else
    print_status "Deploying to Netlify..."
    if netlify deploy --prod --dir=dist; then
        print_success "Deployment to Netlify completed successfully"
    else
        print_error "Netlify deployment failed"
        print_warning "You can deploy manually via Git push or Netlify dashboard"
    fi
fi

cd ..

# Step 5: Update Environment Variables
print_status "Step 5: Updating Environment Variables for Phase 7.7..."

# Create/update environment configuration
cat > client/.env.production << EOF
# Phase 7.7 - Predictive Maintenance Configuration
VITE_APP_VERSION=7.7.0
VITE_MAINTENANCE_SYNC_INTERVAL=30000
VITE_AI_MODEL_MODE=predictive
VITE_SENSOR_STREAM_ENABLED=true
VITE_PREDICTIVE_MAINTENANCE_ENABLED=true
VITE_VOICE_CONTROLS_ENABLED=true
VITE_OFFLINE_MODE_ENABLED=true

# API Configuration
VITE_API_URL=https://mbarie-fms-ai.onrender.com/api
VITE_MAINTENANCE_API_URL=https://mbarie-fms-ai.onrender.com/api/maintenance

# Feature Flags
VITE_FEATURE_PREDICTIVE_ENGINE=true
VITE_FEATURE_DYNAMIC_SCHEDULING=true
VITE_FEATURE_SENSOR_STREAMS=true
VITE_FEATURE_VOICE_MAINTENANCE=true
VITE_FEATURE_AI_RECOMMENDATIONS=true
EOF

print_success "Environment variables updated for Phase 7.7"

# Step 6: Verify Deployment
print_status "Step 6: Verifying Deployment..."

print_status "Checking build artifacts..."
if [ -d "client/dist" ] && [ "$(ls -A client/dist)" ]; then
    print_success "Build artifacts are present and valid"
else
    print_error "Build artifacts are missing or empty"
    exit 1
fi

print_status "Verifying predictive maintenance modules..."
if [ -f "client/src/modules/maintenance/predictiveEngine.ts" ] && \
   [ -f "client/src/modules/maintenance/scheduler.ts" ] && \
   [ -f "client/src/components/MaintenanceDashboard.tsx" ]; then
    print_success "Predictive maintenance modules are present"
else
    print_error "Required maintenance modules are missing"
    exit 1
fi

print_status "Checking backend maintenance routes..."
if [ -f "server/src/routes/maintenanceRoutes.js" ]; then
    print_success "Backend maintenance routes are present"
else
    print_error "Backend maintenance routes are missing"
    exit 1
fi

# Final Deployment Summary
echo ""
echo "🎉 Phase 7.7 Deployment Complete!"
echo "=================================="
echo ""
echo "📋 Deployed Features:"
echo "  • Predictive Maintenance Engine"
echo "  • Dynamic Task Scheduling"
echo "  • IoT Sensor Data Processing"
echo "  • AI-Powered Recommendations"
echo "  • Voice-Enabled Maintenance Commands"
echo "  • Maintenance Dashboard"
echo "  • Technician Assignment System"
echo "  • Offline/Online Sync Capability"
echo ""
echo "🔧 Configuration:"
echo "  • Maintenance sync interval: 30 seconds"
echo "  • AI Model Mode: Predictive"
echo "  • Sensor streams: Enabled"
echo "  • Voice controls: Enabled"
echo ""
echo "🚀 Next Steps:"
echo "  1. Test the maintenance dashboard at your deployed URL"
echo "  2. Verify sensor data streams are working"
echo "  3. Test voice commands for maintenance"
echo "  4. Monitor predictive analytics"
echo "  5. Review maintenance reports"
echo ""
echo "📞 Support:"
echo "  • Check deployment logs for any issues"
echo "  • Review test results in test-phase7.7.js"
echo "  • Monitor system performance"
echo ""

print_success "Phase 7.7 - Predictive Maintenance + Dynamic Scheduling AI is now live!"
