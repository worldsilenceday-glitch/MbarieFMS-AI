#!/usr/bin/env node

/**
 * Phase 8.4: Deployment Verification Script
 * 
 * This script performs comprehensive verification of the deployed Mbarie FMS AI system
 * including frontend, backend, and auto-email webhook functionality.
 */

const axios = require('axios');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Update these URLs after deployment
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://mbarie-fms.netlify.app',
  BACKEND_URL: process.env.BACKEND_URL || 'https://mbarie-fms-ai-production.up.railway.app',
  TEST_EMAIL: 'haroon.amin@mbarieservicesltd.com',
  
  // Timeout settings
  TIMEOUT: 30000,
  RETRY_DELAY: 5000,
  MAX_RETRIES: 3
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

class DeploymentVerifier {
  constructor() {
    this.results = [];
    this.startTime = new Date();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[SUCCESS]${colors.reset}`,
      warning: `${colors.yellow}[WARNING]${colors.reset}`,
      error: `${colors.red}[ERROR]${colors.reset}`
    }[type];

    console.log(`${prefix} ${timestamp} - ${message}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async retryOperation(operation, operationName, maxRetries = CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`Attempt ${attempt}/${maxRetries} for ${operationName}...`, 'info');
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        this.log(`Attempt ${attempt} failed, retrying in ${CONFIG.RETRY_DELAY/1000}s...`, 'warning');
        await this.sleep(CONFIG.RETRY_DELAY);
      }
    }
  }

  async verifyFrontend() {
    this.log('Verifying frontend deployment...', 'info');
    
    try {
      const response = await this.retryOperation(
        () => axios.get(CONFIG.FRONTEND_URL, { timeout: CONFIG.TIMEOUT }),
        'Frontend health check'
      );

      if (response.status === 200) {
        this.log('✅ Frontend is accessible and responding', 'success');
        return { success: true, status: response.status };
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.log(`❌ Frontend verification failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async verifyBackendHealth() {
    this.log('Verifying backend health endpoint...', 'info');
    
    try {
      const response = await this.retryOperation(
        () => axios.get(`${CONFIG.BACKEND_URL}/api/health`, { timeout: CONFIG.TIMEOUT }),
        'Backend health check'
      );

      if (response.data.status === 'OK') {
        this.log('✅ Backend health check passed', 'success');
        return { success: true, data: response.data };
      } else {
        throw new Error(`Unexpected response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      this.log(`❌ Backend health check failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async verifyNotificationService() {
    this.log('Verifying notification service health...', 'info');
    
    try {
      const response = await this.retryOperation(
        () => axios.get(`${CONFIG.BACKEND_URL}/api/notifications/health`, { timeout: CONFIG.TIMEOUT }),
        'Notification service health check'
      );

      if (response.data.status === 'OK') {
        this.log('✅ Notification service is healthy', 'success');
        return { success: true, data: response.data };
      } else {
        throw new Error(`Unexpected response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      this.log(`❌ Notification service health check failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testEmailWebhook() {
    this.log('Testing auto-email webhook functionality...', 'info');
    
    try {
      const testPayload = {
        eventType: 'deployment_success',
        subject: 'Phase 8.4 Deployment Verification',
        message: `Mbarie FMS AI system deployment verification completed successfully.\n\nSystem Status: ✅ Operational\nFrontend: ${CONFIG.FRONTEND_URL}\nBackend: ${CONFIG.BACKEND_URL}\nVerification Time: ${new Date().toISOString()}`,
        priority: 'normal',
        metadata: {
          deploymentPhase: '8.4',
          frontendUrl: CONFIG.FRONTEND_URL,
          backendUrl: CONFIG.BACKEND_URL,
          verificationTimestamp: new Date().toISOString()
        }
      };

      const response = await this.retryOperation(
        () => axios.post(`${CONFIG.BACKEND_URL}/api/notifications/webhook`, testPayload, { timeout: CONFIG.TIMEOUT }),
        'Email webhook test'
      );

      if (response.data.success) {
        this.log('✅ Email webhook test completed successfully', 'success');
        this.log(`📧 Notification sent to: ${response.data.recipients.join(', ')}`, 'info');
        return { success: true, data: response.data };
      } else {
        throw new Error(`Webhook returned error: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      this.log(`❌ Email webhook test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testEmailTestEndpoint() {
    this.log('Testing email test endpoint...', 'info');
    
    try {
      const response = await this.retryOperation(
        () => axios.post(`${CONFIG.BACKEND_URL}/api/notifications/test`, 
          { email: CONFIG.TEST_EMAIL }, 
          { timeout: CONFIG.TIMEOUT }
        ),
        'Email test endpoint'
      );

      if (response.data.success) {
        this.log('✅ Email test endpoint working correctly', 'success');
        this.log(`📧 Test email sent to: ${CONFIG.TEST_EMAIL}`, 'info');
        return { success: true, data: response.data };
      } else {
        throw new Error(`Test endpoint returned error: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      this.log(`❌ Email test endpoint failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async verifyCoreAPIs() {
    this.log('Verifying core API endpoints...', 'info');
    
    const endpoints = [
      '/api/auth/health',
      '/api/ai/health',
      '/api/communication/stats'
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${CONFIG.BACKEND_URL}${endpoint}`, { timeout: CONFIG.TIMEOUT });
        if (response.status === 200) {
          this.log(`✅ ${endpoint} - OK`, 'success');
          results.push({ endpoint, success: true });
        } else {
          throw new Error(`Status: ${response.status}`);
        }
      } catch (error) {
        this.log(`❌ ${endpoint} - Failed: ${error.message}`, 'error');
        results.push({ endpoint, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.log(`Core APIs: ${successCount}/${endpoints.length} endpoints working`, 
      successCount === endpoints.length ? 'success' : 'warning');

    return { success: successCount === endpoints.length, results };
  }

  async runFullVerification() {
    this.log(`${colors.bright}🚀 Starting Phase 8.4 Deployment Verification${colors.reset}`, 'info');
    this.log(`Frontend URL: ${CONFIG.FRONTEND_URL}`, 'info');
    this.log(`Backend URL: ${CONFIG.BACKEND_URL}`, 'info');
    this.log(`Start Time: ${this.startTime.toISOString()}`, 'info');
    this.log('', 'info');

    // Run all verification steps
    const steps = [
      { name: 'Frontend Deployment', method: this.verifyFrontend.bind(this) },
      { name: 'Backend Health', method: this.verifyBackendHealth.bind(this) },
      { name: 'Notification Service', method: this.verifyNotificationService.bind(this) },
      { name: 'Core APIs', method: this.verifyCoreAPIs.bind(this) },
      { name: 'Email Webhook', method: this.testEmailWebhook.bind(this) },
      { name: 'Email Test Endpoint', method: this.testEmailTestEndpoint.bind(this) }
    ];

    for (const step of steps) {
      this.log(`${colors.magenta}=== ${step.name} ===${colors.reset}`, 'info');
      const result = await step.method();
      this.results.push({ step: step.name, ...result });
      this.log('', 'info');
    }

    await this.generateReport();
  }

  async generateReport() {
    const endTime = new Date();
    const duration = (endTime - this.startTime) / 1000;
    
    const successfulSteps = this.results.filter(r => r.success).length;
    const totalSteps = this.results.length;
    const successRate = (successfulSteps / totalSteps) * 100;

    this.log(`${colors.bright}📊 DEPLOYMENT VERIFICATION REPORT${colors.reset}`, 'info');
    this.log(`Duration: ${duration.toFixed(2)} seconds`, 'info');
    this.log(`Success Rate: ${successRate.toFixed(1)}% (${successfulSteps}/${totalSteps})`, 'info');
    this.log('', 'info');

    // Detailed results
    this.results.forEach(result => {
      const status = result.success ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
      console.log(`${status} ${result.step}`);
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    this.log('', 'info');

    // Summary and recommendations
    if (successRate === 100) {
      this.log(`${colors.bright}${colors.green}🎉 DEPLOYMENT VERIFICATION COMPLETE - ALL SYSTEMS OPERATIONAL${colors.reset}`, 'success');
      this.log('Your Mbarie FMS AI system is ready for production use!', 'success');
    } else if (successRate >= 80) {
      this.log(`${colors.bright}${colors.yellow}⚠️ DEPLOYMENT VERIFICATION PARTIALLY SUCCESSFUL${colors.reset}`, 'warning');
      this.log('Most systems are operational, but some components need attention.', 'warning');
    } else {
      this.log(`${colors.bright}${colors.red}🚨 DEPLOYMENT VERIFICATION FAILED${colors.reset}`, 'error');
      this.log('Multiple systems are experiencing issues. Please review the errors above.', 'error');
    }

    // Next steps
    this.log('', 'info');
    this.log(`${colors.bright}📝 NEXT STEPS:${colors.reset}`, 'info');
    if (successRate === 100) {
      this.log('1. Share the production URLs with your team', 'info');
      this.log('2. Monitor system performance and notifications', 'info');
      this.log('3. Consider setting up additional monitoring and alerts', 'info');
    } else {
      this.log('1. Review the failed verification steps above', 'info');
      this.log('2. Check deployment logs and environment variables', 'info');
      this.log('3. Re-run verification after fixes', 'info');
    }
  }
}

// Main execution
async function main() {
  const verifier = new DeploymentVerifier();
  
  try {
    await verifier.runFullVerification();
  } catch (error) {
    console.error(`${colors.red}🚨 Critical error during verification:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DeploymentVerifier;
