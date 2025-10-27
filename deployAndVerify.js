#!/usr/bin/env node
/**
 * deployAndVerify.js
 *
 * Comprehensive deployment verification and Netlify deployment script
 * Requirements: Node.js v18+, Netlify CLI installed
 *
 * Usage:
 *   node deployAndVerify.js
 *   VITE_SERVER_URL=https://api.example.com VITE_CLIENT_URL=https://app.example.com node deployAndVerify.js
 */

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import chalk from "chalk";

// Configurable variables
const SERVER_URL = process.env.VITE_SERVER_URL || "http://localhost:5000";
const CLIENT_URL = process.env.VITE_CLIENT_URL || "http://localhost:3000";
const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;

// SPA routes to check
const routes = ["/", "/dashboard", "/activity", "/ai-insights", "/chat-agent", "/admin-org-editor", "/copilot-demo"];

// Generate _redirects file for Netlify SPA routing
function generateRedirectsFile() {
  const redirectsPath = path.join(process.cwd(), "dist", "_redirects");
  const redirectsContent = `# SPA Routing - All routes should redirect to index.html
/*    /index.html   200

# API proxy (if needed)
# /api/*  https://api.mbarie-fms.com/:splat  200

# Force HTTPS
http://app.mbarie-fms.netlify.app/* https://app.mbarie-fms.netlify.app/:splat 301!
`;

  try {
    fs.writeFileSync(redirectsPath, redirectsContent);
    console.log(chalk.green("✅ Generated _redirects file for SPA routing"));
    return true;
  } catch (err) {
    console.log(chalk.red(`❌ Failed to generate _redirects file: ${err.message}`));
    return false;
  }
}

// Retry configuration
const RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Helper functions
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkRoute(route) {
  let attempt = 0;
  while (attempt < RETRIES) {
    try {
      const res = await fetch(CLIENT_URL + route);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("text/html")) {
        throw new Error(`Invalid response (${res.status}, ${contentType})`);
      }
      return attempt === 0 ? "✅" : "⚠️"; // Success or success after retry
    } catch (err) {
      attempt++;
      if (attempt < RETRIES) await sleep(RETRY_DELAY_MS);
      else return "❌"; // Failure after all retries
    }
  }
}

// Verify assets referenced in index.html
async function checkAssets() {
  const indexPath = path.join(process.cwd(), "dist", "index.html");
  if (!fs.existsSync(indexPath)) {
    console.log(chalk.red("❌ index.html not found in dist folder"));
    return false;
  }

  const html = fs.readFileSync(indexPath, "utf-8");
  const assetRegex = /src="(.+?)"|href="(.+?)"/g;
  let match;
  const assets = [];
  while ((match = assetRegex.exec(html)) !== null) {
    assets.push(match[1] || match[2]);
  }

  let allAssetsOk = true;
  for (const asset of assets) {
    const assetUrl = asset.startsWith("http") ? asset : CLIENT_URL + asset;
    try {
      const res = await fetch(assetUrl);
      if (!res.ok) {
        allAssetsOk = false;
        console.log(chalk.red(`❌ Asset failed: ${assetUrl} (${res.status})`));
      }
    } catch (err) {
      allAssetsOk = false;
      console.log(chalk.red(`❌ Asset failed: ${assetUrl} (${err.message})`));
    }
  }
  return allAssetsOk;
}

// Main
(async () => {
  console.log(chalk.blueBright("🔎 Starting deployment verification..."));

  let failCount = 0;

  // 1️⃣ Check frontend routes
  console.log(chalk.yellow("\nChecking frontend SPA routes:"));
  for (const route of routes) {
    const status = await checkRoute(route);
    console.log(`${status} ${route}`);
    if (status === "❌") failCount++;
  }

  // 2️⃣ Check assets
  console.log(chalk.yellow("\nVerifying frontend assets..."));
  const assetsOk = await checkAssets();
  if (!assetsOk) failCount++;

  // 3️⃣ Optional: Check backend health endpoint
  try {
    const res = await fetch(SERVER_URL + "/api/health");
    if (res.ok) console.log(chalk.green("✅ Backend health check passed"));
    else {
      console.log(chalk.red(`❌ Backend health check failed (${res.status})`));
      failCount++;
    }
  } catch (err) {
    console.log(chalk.red(`❌ Backend health check failed (${err.message})`));
    failCount++;
  }

  // 4️⃣ Exit if failures
  if (failCount > 0) {
    console.log(chalk.redBright(`\n❌ Verification failed with ${failCount} issues. Deployment aborted.`));
    process.exit(1);
  }

  console.log(chalk.greenBright("\n✅ All checks passed. Proceeding with Netlify deployment..."));

  // 4️⃣ Generate _redirects file for SPA routing
  console.log(chalk.yellow("\n📝 Generating _redirects file for SPA routing..."));
  const redirectsGenerated = generateRedirectsFile();
  if (!redirectsGenerated) {
    console.log(chalk.red("❌ Failed to generate _redirects file. Deployment aborted."));
    process.exit(1);
  }

  // 5️⃣ Netlify deployment
  if (!NETLIFY_AUTH_TOKEN || !NETLIFY_SITE_ID) {
    console.log(chalk.red("❌ NETLIFY_AUTH_TOKEN or NETLIFY_SITE_ID missing. Set environment variables."));
    process.exit(1);
  }

  try {
    console.log(chalk.yellow("📦 Deploying to Netlify..."));
    execSync(
      `netlify deploy --dir=dist --prod --auth ${NETLIFY_AUTH_TOKEN} --site ${NETLIFY_SITE_ID}`,
      { stdio: "inherit" }
    );
    console.log(chalk.greenBright("🚀 Deployment complete!"));
  } catch (err) {
    console.log(chalk.red(`❌ Netlify deployment failed: ${err.message}`));
    process.exit(1);
  }
})();
