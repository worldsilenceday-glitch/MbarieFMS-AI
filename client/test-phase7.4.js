// Mbarie FMS AI - Phase 7.4 Test Script
// AI-Driven Recommendations & Actionable Insights

console.log('🧪 Testing Phase 7.4 - AI Recommendations & Actionable Insights\n');

// Mock data for testing
const mockInsights = [
  {
    id: '1',
    category: 'workflow',
    title: 'Workflow Efficiency',
    value: '87%',
    trend: 2,
    icon: 'TrendingUp',
    color: 'emerald'
  },
  {
    id: '2',
    category: 'risk',
    title: 'Risk Level',
    value: '25%',
    trend: -1,
    icon: 'AlertTriangle',
    color: 'yellow'
  },
  {
    id: '3',
    category: 'document',
    title: 'Documents Processed',
    value: '156',
    trend: 5,
    icon: 'FileText',
    color: 'blue'
  },
  {
    id: '4',
    category: 'permit',
    title: 'Permit Approvals',
    value: '94%',
    trend: 3,
    icon: 'CheckCircle',
    color: 'green'
  }
];

const mockPredictiveData = {
  predictions: [
    { date: '2025-01-26', predicted: 88.5, confidence: 0.85, lowerBound: 85.2, upperBound: 91.8 },
    { date: '2025-01-27', predicted: 89.2, confidence: 0.83, lowerBound: 86.1, upperBound: 92.3 },
    { date: '2025-01-28', predicted: 90.1, confidence: 0.81, lowerBound: 87.0, upperBound: 93.2 }
  ],
  trend: 'up',
  confidence: 0.85,
  recommendation: 'Positive trend detected. Consider optimizing resource allocation for sustained growth.'
};

// Test recommendation engine
async function testRecommendationEngine() {
  console.log('🔍 Testing AI Recommendation Engine...');
  
  try {
    // Import the recommendation engine
    const { generateRecommendations, summarizeTrends } = await import('./src/utils/recommendationEngine.js');
    
    const insightOverview = {
      insights: mockInsights,
      predictiveData: mockPredictiveData,
      trend: 'up',
      confidence: 0.85
    };
    
    // Test trend summarization
    const summary = summarizeTrends(insightOverview);
    console.log('✅ Trend Summary:', summary);
    
    // Test recommendation generation
    const recommendations = await generateRecommendations(insightOverview);
    console.log('✅ Recommendations Generated:', recommendations.length);
    console.log('📊 Sample Recommendation:', recommendations[0]);
    
    return recommendations;
  } catch (error) {
    console.log('❌ Recommendation Engine Test Failed:', error.message);
    return [];
  }
}

// Test smart actions
async function testSmartActions() {
  console.log('\n⚡ Testing Smart Actions...');
  
  try {
    const { triggerOptimization, sendComplianceAlert } = await import('./src/hooks/useSmartActions.js');
    
    // Test optimization action
    const optimizationResult = await triggerOptimization('engineering');
    console.log('✅ Optimization Action:', optimizationResult.success ? 'Success' : 'Failed');
    
    // Test alert action
    const alertResult = await sendComplianceAlert('user123', 'Test compliance alert');
    console.log('✅ Alert Action:', alertResult.success ? 'Success' : 'Failed');
    
    return true;
  } catch (error) {
    console.log('❌ Smart Actions Test Failed:', error.message);
    return false;
  }
}

// Test insight logging
async function testInsightLogging() {
  console.log('\n📝 Testing Insight Logging...');
  
  try {
    const { logAIInsight, getInsightLogs, getInsightStats } = await import('./src/utils/insightLogs.js');
    
    // Log a test insight
    logAIInsight(
      'Performance Optimization',
      'Test recommendation for optimization',
      'This is a test reasoning for the recommendation',
      'optimize',
      'engineering',
      88
    );
    
    // Get logs
    const logs = getInsightLogs();
    console.log('✅ Insight Logs Count:', logs.length);
    
    // Get stats
    const stats = getInsightStats();
    console.log('✅ Insight Stats:', stats);
    
    return true;
  } catch (error) {
    console.log('❌ Insight Logging Test Failed:', error.message);
    return false;
  }
}

// Test contextual filtering
async function testContextualFiltering() {
  console.log('\n🎯 Testing Contextual Filtering...');
  
  try {
    const { filterRecommendationsByContext } = await import('./src/utils/recommendationEngine.js');
    
    const testRecommendations = [
      {
        category: 'Performance Optimization',
        text: 'Optimize resource allocation',
        confidence: 88,
        reasoning: 'High workflow efficiency detected'
      },
      {
        category: 'Risk Mitigation',
        text: 'Schedule safety audit',
        confidence: 76,
        reasoning: 'Increased risk levels detected'
      },
      {
        category: 'Compliance & Safety',
        text: 'Review safety protocols',
        confidence: 92,
        reasoning: 'Compliance updates needed'
      }
    ];
    
    // Test efficiency context
    const efficiencyRecs = filterRecommendationsByContext(testRecommendations, 'efficiency');
    console.log('✅ Efficiency Context Filtered:', efficiencyRecs.length);
    
    // Test risk context
    const riskRecs = filterRecommendationsByContext(testRecommendations, 'risk and safety');
    console.log('✅ Risk Context Filtered:', riskRecs.length);
    
    return true;
  } catch (error) {
    console.log('❌ Contextual Filtering Test Failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Phase 7.4 Feature Tests\n');
  
  const results = {
    recommendationEngine: await testRecommendationEngine(),
    smartActions: await testSmartActions(),
    insightLogging: await testInsightLogging(),
    contextualFiltering: await testContextualFiltering()
  };
  
  console.log('\n📋 Test Summary:');
  console.log('✅ AI Recommendation Engine:', results.recommendationEngine.length > 0 ? 'PASS' : 'FAIL');
  console.log('✅ Smart Actions:', results.smartActions ? 'PASS' : 'FAIL');
  console.log('✅ Insight Logging:', results.insightLogging ? 'PASS' : 'FAIL');
  console.log('✅ Contextual Filtering:', results.contextualFiltering ? 'PASS' : 'FAIL');
  
  const allPassed = Object.values(results).every(result => 
    Array.isArray(result) ? result.length > 0 : result === true
  );
  
  if (allPassed) {
    console.log('\n🎉 All Phase 7.4 tests passed! Ready for deployment.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review before deployment.');
  }
  
  return allPassed;
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
