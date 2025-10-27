import fetch from "node-fetch";
import chalk from "chalk";

const SERVER_URL = process.env.VITE_SERVER_URL || "http://localhost:5000";
const CLIENT_URL = process.env.VITE_CLIENT_URL || "http://localhost:3000";

// Frontend routes to test
const frontendRoutes = [
  "/",
  "/dashboard",
  "/activity",
  "/ai-insights",
  "/chat-agent",
  "/admin-org-editor",
  "/copilot-demo"
];

// Backend API endpoints to test
const backendEndpoints = [
  "/api/org",
  "/api/activity",
  "/api/users",
  "/api/ai/insights",
  "/api/ai/services",
  "/api/auth/health",
  "/api/communication",
  "/api/chat-agent",
  "/api/hsse",
  "/api/materials",
  "/api/permit",
  "/api/document",
  "/api/reports",
  "/api/toolbox",
  "/api/access"
];

/**
 * Check endpoint with automatic retry logic
 */
async function checkEndpoint(url, retries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return { 
          success: true, 
          status: res.status,
          attempts: attempt,
          requiresRetry: attempt > 1
        };
      }
      lastError = `HTTP ${res.status}: ${res.statusText}`;
    } catch (err) {
      lastError = err.message;
    }
    
    // Wait before retry (except on last attempt)
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, 1000)); // 1 second delay
    }
  }
  
  return { 
    success: false, 
    error: lastError,
    attempts: retries
  };
}

/**
 * Check frontend assets (CSS, JS, images) from HTML
 */
async function extractAndCheckAssets(html) {
  const assetRegex = /(?:src|href)="([^"]*\.(?:css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf))"/gi;
  const missingAssets = [];
  const checkedAssets = new Set();
  
  let match;
  while ((match = assetRegex.exec(html)) !== null) {
    const assetUrl = match[1];
    
    // Skip already checked assets and data URLs
    if (checkedAssets.has(assetUrl) || assetUrl.startsWith('data:')) {
      continue;
    }
    checkedAssets.add(assetUrl);
    
    try {
      const fullUrl = assetUrl.startsWith("http") ? assetUrl : `${CLIENT_URL}${assetUrl}`;
      const res = await fetch(fullUrl);
      if (!res.ok) {
        missingAssets.push({
          url: fullUrl,
          status: res.status,
          statusText: res.statusText
        });
      }
    } catch (err) {
      missingAssets.push({
        url: assetUrl,
        status: 'ERROR',
        statusText: err.message
      });
    }
  }
  
  return missingAssets;
}

/**
 * Validate SPA routing - ensure routes return HTML content
 */
async function validateSPARouting(route) {
  try {
    const res = await fetch(`${CLIENT_URL}${route}`);
    const contentType = res.headers.get('content-type');
    const isHtml = contentType && contentType.includes('text/html');
    
    return {
      success: res.ok,
      isHtml: isHtml,
      status: res.status,
      contentType: contentType
    };
  } catch (err) {
    return {
      success: false,
      isHtml: false,
      error: err.message
    };
  }
}

async function checkFrontendRoutes() {
  console.log(chalk.blue.bold("🔍 Verifying Frontend Routes..."));
  const results = [];
  let failedCount = 0;
  
  for (const route of frontendRoutes) {
    const { success, attempts, requiresRetry } = await checkEndpoint(`${CLIENT_URL}${route}`);
    
    // Additional SPA routing validation
    const spaValidation = await validateSPARouting(route);
    
    if (success) {
      const statusEmoji = requiresRetry ? "⚠️" : "✅";
      const statusText = requiresRetry ? `(retried ${attempts} times)` : "";
      console.log(chalk.green(`${statusEmoji} ${route} ${statusText}`));
      
      // Check if route returns HTML (SPA validation)
      if (!spaValidation.isHtml) {
        console.log(chalk.yellow(`   ⚠️ Route may not be properly configured for SPA (content-type: ${spaValidation.contentType})`));
      }
      
      results.push({ 
        route, 
        status: 'SUCCESS', 
        requiresRetry,
        attempts,
        spaValid: spaValidation.isHtml
      });
    } else {
      console.log(chalk.red(`❌ ${route} (failed after ${attempts} attempts)`));
      results.push({ 
        route, 
        status: 'FAILED', 
        requiresRetry: false,
        attempts 
      });
      failedCount++;
    }
  }
  
  return { results, failedCount };
}

async function checkBackendAPIs() {
  console.log(chalk.blue.bold("\n🔍 Verifying Backend API Endpoints..."));
  const results = [];
  let failedCount = 0;
  
  for (const endpoint of backendEndpoints) {
    const { success, attempts, requiresRetry } = await checkEndpoint(`${SERVER_URL}${endpoint}`);
    
    if (success) {
      const statusEmoji = requiresRetry ? "⚠️" : "✅";
      const statusText = requiresRetry ? `(retried ${attempts} times)` : "";
      console.log(chalk.green(`${statusEmoji} ${endpoint} ${statusText}`));
      results.push({ 
        endpoint, 
        status: 'SUCCESS', 
        requiresRetry,
        attempts 
      });
    } else {
      console.log(chalk.red(`❌ ${endpoint} (failed after ${attempts} attempts)`));
      results.push({ 
        endpoint, 
        status: 'FAILED', 
        requiresRetry: false,
        attempts 
      });
      failedCount++;
    }
  }
  
  return { results, failedCount };
}

async function checkServiceWorker() {
  console.log(chalk.blue.bold("\n🔍 Checking Service Worker..."));
  const { success, attempts, requiresRetry } = await checkEndpoint(`${CLIENT_URL}/service-worker.js`);
  
  if (success) {
    const statusEmoji = requiresRetry ? "⚠️" : "✅";
    const statusText = requiresRetry ? `(retried ${attempts} times)` : "";
    console.log(chalk.green(`${statusEmoji} Service worker available ${statusText}`));
    return { 
      status: 'SUCCESS', 
      requiresRetry,
      attempts 
    };
  } else {
    console.log(chalk.red(`❌ Service worker not available (failed after ${attempts} attempts)`));
    return { 
      status: 'FAILED', 
      requiresRetry: false,
      attempts 
    };
  }
}

async function checkFrontendAssets() {
  console.log(chalk.blue.bold("\n🔍 Checking Frontend Assets..."));
  
  try {
    const res = await fetch(`${CLIENT_URL}/`);
    if (!res.ok) {
      console.log(chalk.red("❌ Cannot fetch main page for asset analysis"));
      return { missingAssets: [], totalChecked: 0 };
    }
    
    const html = await res.text();
    const missingAssets = await extractAndCheckAssets(html);
    
    if (missingAssets.length === 0) {
      console.log(chalk.green("✅ All frontend assets found and accessible"));
    } else {
      console.log(chalk.red(`❌ Missing or inaccessible assets (${missingAssets.length}):`));
      missingAssets.forEach(asset => {
        console.log(chalk.yellow(`   - ${asset.url} (${asset.status} ${asset.statusText})`));
      });
    }
    
    return { 
      missingAssets, 
      totalChecked: html.match(/(?:src|href)="([^"]*\.(?:css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf))"/gi)?.length || 0
    };
  } catch (err) {
    console.log(chalk.red(`❌ Failed to analyze frontend assets: ${err.message}`));
    return { missingAssets: [], totalChecked: 0 };
  }
}

function generateSummary(frontendResults, backendResults, serviceWorkerResult, assetResults) {
  console.log(chalk.blue.bold("\n📊 DEPLOYMENT VERIFICATION SUMMARY"));
  console.log("=".repeat(60));
  
  const frontendSuccess = frontendResults.results.filter(r => r.status === 'SUCCESS').length;
  const backendSuccess = backendResults.results.filter(r => r.status === 'SUCCESS').length;
  const frontendRetries = frontendResults.results.filter(r => r.requiresRetry).length;
  const backendRetries = backendResults.results.filter(r => r.requiresRetry).length;
  
  console.log(chalk.white(`Frontend Routes: ${chalk.green(frontendSuccess)}/${chalk.white(frontendRoutes.length)} successful`));
  if (frontendRetries > 0) {
    console.log(chalk.yellow(`   ${frontendRetries} routes required retries`));
  }
  
  console.log(chalk.white(`Backend APIs: ${chalk.green(backendSuccess)}/${chalk.white(backendEndpoints.length)} successful`));
  if (backendRetries > 0) {
    console.log(chalk.yellow(`   ${backendRetries} endpoints required retries`));
  }
  
  console.log(chalk.white(`Service Worker: ${serviceWorkerResult.status === 'SUCCESS' ? chalk.green('✅ Available') : chalk.red('❌ Missing')}`));
  if (serviceWorkerResult.requiresRetry) {
    console.log(chalk.yellow(`   Required retries to verify`));
  }
  
  console.log(chalk.white(`Frontend Assets: ${assetResults.missingAssets.length === 0 ? chalk.green('✅ All found') : chalk.red(`❌ ${assetResults.missingAssets.length} missing`)}`));
  
  // Show detailed failures
  const frontendFailures = frontendResults.results.filter(r => r.status !== 'SUCCESS');
  const backendFailures = backendResults.results.filter(r => r.status !== 'SUCCESS');
  
  if (frontendFailures.length > 0) {
    console.log(chalk.red.bold("\n❌ Frontend Issues:"));
    frontendFailures.forEach(f => {
      console.log(chalk.red(`   - ${f.route} (failed after ${f.attempts} attempts)`));
    });
  }
  
  if (backendFailures.length > 0) {
    console.log(chalk.red.bold("\n❌ Backend Issues:"));
    backendFailures.forEach(f => {
      console.log(chalk.red(`   - ${f.endpoint} (failed after ${f.attempts} attempts)`));
    });
  }
  
  if (assetResults.missingAssets.length > 0) {
    console.log(chalk.red.bold("\n❌ Asset Issues:"));
    assetResults.missingAssets.forEach(asset => {
      console.log(chalk.yellow(`   - ${asset.url}`));
    });
  }
  
  // Overall status
  const totalFailures = 
    frontendResults.failedCount + 
    backendResults.failedCount + 
    (serviceWorkerResult.status === 'FAILED' ? 1 : 0) +
    assetResults.missingAssets.length;
  
  if (totalFailures === 0) {
    console.log(chalk.green.bold("\n🎉 ALL CHECKS PASSED! Ready for deployment."));
    return 0;
  } else {
    console.log(chalk.red.bold(`\n⚠️  ${totalFailures} CHECK(S) FAILED! Please fix issues before deployment.`));
    return 1;
  }
}

async function main() {
  console.log(chalk.blue.bold("🚀 Starting Enhanced Deployment Verification..."));
  console.log(chalk.white(`Frontend URL: ${CLIENT_URL}`));
  console.log(chalk.white(`Backend URL: ${SERVER_URL}`));
  console.log("=".repeat(60));
  
  try {
    const frontendResults = await checkFrontendRoutes();
    const backendResults = await checkBackendAPIs();
    const serviceWorkerResult = await checkServiceWorker();
    const assetResults = await checkFrontendAssets();
    
    const exitCode = generateSummary(frontendResults, backendResults, serviceWorkerResult, assetResults);
    process.exit(exitCode);
  } catch (error) {
    console.error(chalk.red("💥 Verification script failed:"), error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(chalk.blue.bold(`
Enhanced Deployment Verification Script
======================================

Usage: node verifyDeployment.js [options]

Options:
  --help, -h     Show this help message
  --urls         Show URLs that will be tested
  --quiet        Only show summary (no detailed output)

Environment Variables:
  VITE_SERVER_URL    Backend server URL (default: http://localhost:5000)
  VITE_CLIENT_URL    Frontend client URL (default: http://localhost:3000)

Features:
  ✅ Automatic retry for failed endpoints (3 attempts)
  ✅ Frontend SPA route validation
  ✅ Asset existence verification (JS, CSS, images)
  ✅ Detailed emoji-based reporting
  ✅ Proper exit codes for CI/CD
  `));
  process.exit(0);
}

if (process.argv.includes('--urls')) {
  console.log("Frontend Routes to test:");
  frontendRoutes.forEach(route => console.log(`  - ${CLIENT_URL}${route}`));
  console.log("\nBackend APIs to test:");
  backendEndpoints.forEach(endpoint => console.log(`  - ${SERVER_URL}${endpoint}`));
  process.exit(0);
}

// Check if chalk is available, provide fallback if not
try {
  import('chalk');
} catch (err) {
  console.log("⚠️  chalk not installed. Please install dependencies first:");
  console.log("npm install node-fetch@2 chalk@4");
  process.exit(1);
}

main();
