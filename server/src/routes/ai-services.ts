import express from 'express';
import { mbarieAI } from '../ai-services/core-ai';

const router = express.Router();

// Intelligent Delegation Engine API
router.post('/delegation/recommend', async (req, res) => {
  try {
    const { task } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task context is required' });
    }

    const recommendation = await mbarieAI.recommendDelegation(task);
    res.json(recommendation);
  } catch (error) {
    console.error('Error in delegation recommendation:', error);
    res.status(500).json({ error: 'Failed to generate delegation recommendation' });
  }
});

// Risk Assessment API
router.post('/risk/assess', async (req, res) => {
  try {
    const { permitData, incidentHistory = [] } = req.body;
    
    if (!permitData) {
      return res.status(400).json({ error: 'Permit data is required' });
    }

    const riskAssessment = await mbarieAI.assessRisk(permitData, incidentHistory);
    res.json(riskAssessment);
  } catch (error) {
    console.error('Error in risk assessment:', error);
    res.status(500).json({ error: 'Failed to assess risk' });
  }
});

// Document Intelligence API
router.post('/document/analyze', async (req, res) => {
  try {
    const { content, documentType } = req.body;
    
    if (!content || !documentType) {
      return res.status(400).json({ error: 'Content and document type are required' });
    }

    const analysis = await mbarieAI.analyzeDocument(content, documentType);
    res.json(analysis);
  } catch (error) {
    console.error('Error in document analysis:', error);
    res.status(500).json({ error: 'Failed to analyze document' });
  }
});

// Permit Orchestration API
router.post('/permit/recommend', async (req, res) => {
  try {
    const { permitData } = req.body;
    
    if (!permitData) {
      return res.status(400).json({ error: 'Permit data is required' });
    }

    const recommendation = await mbarieAI.recommendPermitApproval(permitData);
    res.json(recommendation);
  } catch (error) {
    console.error('Error in permit orchestration:', error);
    res.status(500).json({ error: 'Failed to generate permit recommendations' });
  }
});

// Workflow Insights API
router.get('/workflow/insights', async (req, res) => {
  try {
    const insights = await mbarieAI.generateWorkflowInsights();
    res.json(insights);
  } catch (error) {
    console.error('Error generating workflow insights:', error);
    res.status(500).json({ error: 'Failed to generate workflow insights' });
  }
});

// AI Health Check
router.get('/health', async (req, res) => {
  try {
    // Test basic AI functionality
    const testTask = {
      type: 'safety_inspection',
      priority: 'medium' as const,
      requiredSkills: ['safety', 'inspection'],
      department: 'HSSE',
      location: 'Main Workshop',
      estimatedDuration: 2
    };

    const testResult = await mbarieAI.recommendDelegation(testTask);
    
    res.json({
      status: 'healthy',
      aiService: 'operational',
      testResult: {
        hasRecommendation: !!testResult.recommendedUserId,
        confidence: testResult.confidence
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      aiService: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
