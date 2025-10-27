#!/usr/bin/env node
/**
 * deployFrontend.js
 * 
 * Frontend-only deployment script for Netlify
 * Skips backend verification for deployment
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import chalk from "chalk";

// Configurable variables
const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;

// Generate _redirects file for Netlify SPA routing
function generateRedirectsFile() {
  const redirectsPath = path.join(process.cwd(), "dist", "_redirects");
  const redirectsContent = `# SPA Routing - All routes should redirect to index.html
/*    /index.html   200

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

// Main
(async () => {
  console.log(chalk.blueBright("🚀 Starting frontend deployment to Netlify..."));

  // 1️⃣ Generate _redirects file for SPA routing
  console.log(chalk.yellow("\n📝 Generating _redirects file for SPA routing..."));
  const redirectsGenerated = generateRedirectsFile();
  if (!redirectsGenerated) {
    console.log(chalk.red("❌ Failed to generate _redirects file. Deployment aborted."));
    process.exit(1);
  }

  // 2️⃣ Netlify deployment
  if (!NETLIFY_AUTH_TOKEN || !NETLIFY_SITE_ID) {
    console.log(chalk.red("❌ NETLIFY_AUTH_TOKEN or NETLIFY_SITE_ID missing. Set environment variables."));
    console.log(chalk.yellow("💡 You can set them with:"));
    console.log(chalk.yellow("   $env:NETLIFY_AUTH_TOKEN=\"your_token_here\""));
    console.log(chalk.yellow("   $env:NETLIFY_SITE_ID=\"your_site_id_here\""));
    process.exit(1);
  }

  try {
    console.log(chalk.yellow("📦 Deploying to Netlify..."));
    execSync(
      `netlify deploy --dir=dist --prod --auth ${NETLIFY_AUTH_TOKEN} --site ${NETLIFY_SITE_ID}`,
      { stdio: "inherit" }
    );
    console.log(chalk.greenBright("🎉 Deployment complete!"));
  } catch (err) {
    console.log(chalk.red(`❌ Netlify deployment failed: ${err.message}`));
    process.exit(1);
  }
})();
