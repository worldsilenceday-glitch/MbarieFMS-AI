# Enhanced Deployment Verification & Netlify Deployment Script

## Overview

This comprehensive deployment verification and Netlify deployment script provides automated testing and deployment for your Mbarie FMS application. It includes automatic retry logic, SPA routing validation, asset verification, and automatic Netlify deployment with SPA redirects.

## Key Features

### 🚀 Automatic Retry Logic
- **3 retry attempts** for failed endpoints with 1-second delays
- **Warning indicators** (⚠️) for routes that required retries
- **Detailed attempt tracking** showing how many retries were needed

### 🔍 SPA Routing Validation
- **Content-Type validation** to ensure routes return HTML
- **Blank page detection** for misconfigured SPA routes
- **Netlify redirect validation** for proper SPA configuration

### 📦 Asset Verification
- **Automatic asset discovery** from HTML source
- **CSS, JS, and image validation** (png, jpg, gif, svg, ico, fonts)
- **Missing asset reporting** with full URLs and status codes

### 🎨 Enhanced Reporting
- **Color-coded output** using chalk for better visibility
- **Emoji-based status indicators**:
  - ✅ Success (no retries needed)
  - ⚠️ Success with retries
  - ❌ Failure after all retries
- **Comprehensive summary** with failure counts and details

### 🔧 CI/CD Integration
- **Proper exit codes** (0 = success, 1 = failure)
- **Environment variable support** for different deployment environments
- **Command-line options** for flexible usage

### 🚀 Automatic Netlify Deployment
- **Automatic _redirects generation** for SPA routing
- **Production deployment** to Netlify
- **Environment variable validation** for deployment credentials
- **Deployment abort** on verification failures

## Scripts Available

### 1. Comprehensive Deployment & Verification Script (`deployAndVerify.js`)
**Features:** Full verification + automatic Netlify deployment with SPA redirects

#### Basic Usage
```bash
# Test with default URLs (localhost:3000 and localhost:5000)
node deployAndVerify.js
```

#### Production Deployment
```bash
# Set environment variables and deploy
export VITE_SERVER_URL=https://api.mbarie-fms.com
export VITE_CLIENT_URL=https://app.mbarie-fms.netlify.app
export NETLIFY_AUTH_TOKEN=your_token_here
export NETLIFY_SITE_ID=your_site_id_here

node deployAndVerify.js
```

### 2. Verification Only Script (`verifyDeployment.js`)
**Features:** Comprehensive testing without deployment

#### Basic Usage
```bash
# Test with default URLs (localhost:3000 and localhost:5000)
node verifyDeployment.js
```

#### Production Testing
```bash
# Test production deployment
VITE_SERVER_URL=https://api.yourdomain.com VITE_CLIENT_URL=https://app.yourdomain.com node verifyDeployment.js
```

#### Command Line Options
```bash
# Show help
node verifyDeployment.js --help

# List URLs to be tested
node verifyDeployment.js --urls

# Quiet mode (summary only)
node verifyDeployment.js --quiet
```

## What It Tests

### Frontend Routes (7 routes)
- `/` - Home page
- `/dashboard` - Main dashboard
- `/activity` - Activity feed
- `/ai-insights` - AI insights dashboard
- `/chat-agent` - Chat interface
- `/admin-org-editor` - Organization editor
- `/copilot-demo` - Copilot demo page

### Backend APIs (15 endpoints)
- `/api/org` - Organization management
- `/api/activity` - Activity tracking
- `/api/users` - User management
- `/api/ai/insights` - AI insights
- `/api/ai/services` - AI services
- `/api/auth/health` - Authentication health
- `/api/communication` - Communication services
- `/api/chat-agent` - Chat agent API
- `/api/hsse` - HSSE management
- `/api/materials` - Materials management
- `/api/permit` - Permit system
- `/api/document` - Document management
- `/api/reports` - Reporting system
- `/api/toolbox` - Toolbox services
- `/api/access` - Access control

### Additional Checks
- **Service Worker** availability
- **Frontend Assets** (CSS, JS, images, fonts)
- **SPA Routing** configuration

## Installation

### For deployAndVerify.js (Comprehensive Script)
```bash
# Install dependencies
npm install node-fetch@2 chalk@4

# Install Netlify CLI globally (required for deployment)
npm install -g netlify-cli
```

### For verifyDeployment.js (Verification Only)
```bash
# Install dependencies
npm install node-fetch@2 chalk@4
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Deployment Verification
on: [deployment]

jobs:
  verify-deployment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install node-fetch@2 chalk@4
      
      - name: Verify deployment
        run: node verifyDeployment.js
        env:
          VITE_SERVER_URL: ${{ secrets.PRODUCTION_SERVER_URL }}
          VITE_CLIENT_URL: ${{ secrets.PRODUCTION_CLIENT_URL }}
```

### Netlify Integration with Automatic Deployment

#### Using deployAndVerify.js
The comprehensive script automatically:
- Generates `_redirects` file for SPA routing
- Deploys to Netlify production
- Validates all checks before deployment

#### Manual Netlify Configuration
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"

# Post-deployment verification
[[plugins]]
  package = "netlify-plugin-verify-deployment"
```

## Troubleshooting

### Common Issues

1. **Blank Pages on SPA Routes**
   - Check Netlify `_redirects` file
   - Ensure all routes redirect to `index.html`
   - Verify Vite SPA configuration

2. **Missing Assets**
   - Check build output for missing files
   - Verify asset paths in HTML
   - Ensure CDN configuration is correct

3. **API Endpoint Failures**
   - Verify backend server is running
   - Check CORS configuration
   - Validate environment variables

4. **Retry Warnings**
   - Normal for services starting up
   - Indicates temporary network issues
   - Monitor if persistent across deployments

### Exit Codes

#### For deployAndVerify.js
- **0**: All checks passed and deployment successful
- **1**: Verification failed - deployment aborted
- **1**: Deployment failed - Netlify error

#### For verifyDeployment.js
- **0**: All checks passed - ready for deployment
- **1**: Some checks failed - review and fix issues

## Example Output

```
🚀 Starting Enhanced Deployment Verification...
Frontend URL: http://localhost:3000
Backend URL: http://localhost:5000
============================================================

🔍 Verifying Frontend Routes...
✅ /
⚠️ /dashboard (retried 2 times)
✅ /activity
❌ /ai-insights (failed after 3 attempts)

🔍 Verifying Backend API Endpoints...
✅ /api/org
✅ /api/activity
⚠️ /api/users (retried 1 times)

🔍 Checking Service Worker...
✅ Service worker available

🔍 Checking Frontend Assets...
✅ All frontend assets found and accessible

📊 DEPLOYMENT VERIFICATION SUMMARY
============================================================
Frontend Routes: 3/7 successful
   1 routes required retries
Backend APIs: 3/15 successful
   1 endpoints required retries
Service Worker: ✅ Available
Frontend Assets: ✅ All found

❌ Frontend Issues:
   - /ai-insights (failed after 3 attempts)

❌ Backend Issues:
   - /api/users (failed after 3 attempts)

⚠️  2 CHECK(S) FAILED! Please fix issues before deployment.
```

## What deployAndVerify.js Does

### Step-by-Step Process
1. **🔍 Verification Phase**
   - Check all SPA frontend routes (7 routes)
   - Verify all assets referenced in index.html
   - Perform backend health check
   - Abort deployment if any issues found

2. **📝 SPA Configuration**
   - Automatically generate `_redirects` file for Netlify
   - Configure SPA routing for all deep links
   - Force HTTPS redirects

3. **🚀 Deployment Phase**
   - Deploy to Netlify production
   - Use environment variables for authentication
   - Provide real-time deployment progress

### Example Output
```
🔎 Starting deployment verification...

Checking frontend SPA routes:
✅ /
✅ /dashboard
✅ /activity
✅ /ai-insights
✅ /chat-agent
✅ /admin-org-editor
✅ /copilot-demo

Verifying frontend assets...
✅ All frontend assets found and accessible

✅ Backend health check passed

✅ All checks passed. Proceeding with Netlify deployment...

📝 Generating _redirects file for SPA routing...
✅ Generated _redirects file for SPA routing

📦 Deploying to Netlify...
... [Netlify deployment output] ...
🚀 Deployment complete!
```

## Benefits

- **Prevents broken deployments** by verifying everything first
- **Fixes SPA routing issues** with automatic redirects
- **Streamlines deployment process** with single command
- **Provides clear feedback** with color-coded output
- **Integrates with CI/CD** for automated workflows

These enhanced scripts provide comprehensive deployment verification and automation that catches common issues before they impact users, especially important for SPAs deployed on platforms like Netlify.
