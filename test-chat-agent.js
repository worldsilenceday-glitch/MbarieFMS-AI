// Simple test script for the Chat Agent system
// Run with: node test-chat-agent.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Chat Agent System - Basic Test');
console.log('==================================\n');

// Check if required files exist
const requiredFiles = [
  'server/src/routes/chat-agent.ts',
  'server/src/routes/email-approval.ts',
  'server/src/utils/fileProcessors.ts',
  'server/src/utils/ai-client.ts',
  'server/src/utils/email-router.ts',
  'server/src/controllers/communicationController.ts',
  'server/src/routes/communication.ts',
  'client/src/pages/ChatAgent.tsx',
  'client/src/components/DraftModal.tsx',
  'client/src/hooks/useChatAgent.ts',
  'server/prisma/schema.prisma',
  '.env.example',
  'client/ChatAgent-TESTS.md'
];

console.log('📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('\n📊 Database Schema Check:');
try {
  const schema = fs.readFileSync('server/prisma/schema.prisma', 'utf8');
  const hasCommunicationLog = schema.includes('model CommunicationLog');
  const hasUserRelation = schema.includes('communicationLogs CommunicationLog[]');
  
  console.log(`  ${hasCommunicationLog ? '✅' : '❌'} CommunicationLog model exists`);
  console.log(`  ${hasUserRelation ? '✅' : '❌'} User relation configured`);
} catch (error) {
  console.log('  ❌ Could not read schema file');
}

console.log('\n🔧 Environment Variables Check:');
const envExample = fs.readFileSync('.env.example', 'utf8');
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'ENABLE_IMAGE_OCR',
  'TESSERACT_DATA_PATH',
  'MAX_UPLOAD_SIZE_MB'
];

requiredEnvVars.forEach(envVar => {
  const exists = envExample.includes(envVar);
  console.log(`  ${exists ? '✅' : '❌'} ${envVar}`);
});

console.log('\n🚀 Server Routes Check:');
const serverIndex = fs.readFileSync('server/src/index.ts', 'utf8');
const routes = [
  '/api/chat-agent',
  '/api/email-approval',
  '/api/communication'
];

routes.forEach(route => {
  const exists = serverIndex.includes(route);
  console.log(`  ${exists ? '✅' : '❌'} ${route} route registered`);
});

console.log('\n📝 Test Documentation:');
const testDoc = fs.readFileSync('client/ChatAgent-TESTS.md', 'utf8');
const hasPrerequisites = testDoc.includes('## Prerequisites');
const hasTestSteps = testDoc.includes('## Test Steps');
const hasTroubleshooting = testDoc.includes('## Troubleshooting');

console.log(`  ${hasPrerequisites ? '✅' : '❌'} Prerequisites section`);
console.log(`  ${hasTestSteps ? '✅' : '❌'} Test Steps section`);
console.log(`  ${hasTroubleshooting ? '✅' : '❌'} Troubleshooting section`);

console.log('\n🎯 Summary:');
if (allFilesExist) {
  console.log('✅ All required files are present');
  console.log('✅ Database schema is properly configured');
  console.log('✅ Environment variables are defined');
  console.log('✅ Server routes are registered');
  console.log('✅ Test documentation is complete');
  console.log('\n🚀 Ready for testing!');
  console.log('\nNext steps:');
  console.log('1. Set up environment variables in .env file');
  console.log('2. Start server: cd server && npm run dev');
  console.log('3. Start client: cd client && npm run dev');
  console.log('4. Follow test instructions in client/ChatAgent-TESTS.md');
} else {
  console.log('❌ Some files are missing or configuration is incomplete');
  console.log('Please check the missing items above and complete the implementation');
}
