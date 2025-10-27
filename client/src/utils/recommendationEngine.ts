import { useAI } from "../hooks/useAI";
import { AIInsightSummary } from "../types/insights";

export interface Recommendation {
  category: "Performance Optimization" | "Risk Mitigation" | "Compliance & Safety" | "Maintenance Scheduling" | "General";
  text: string;
  confidence: number;
  reasoning?: string;
  actionType?: "optimize" | "alert" | "schedule" | "review";
  departmentId?: string;
}

export interface InsightOverview {
  insights: AIInsightSummary[];
  predictiveData?: any;
  trend?: 'up' | 'down' | 'stable';
  confidence?: number;
}

// AI model query function
export async function queryAIModel(prompt: string): Promise<string> {
  try {
    // Use the existing useAI hook's request method
    const { request } = useAI();
    const response = await request("recommendations", { prompt });
    
    if (response && response.recommendations) {
      return JSON.stringify({ recommendations: response.recommendations });
    }
    
    // Fallback to mock response if AI service is unavailable
    return generateMockRecommendations();
  } catch (error) {
    console.error("AI recommendation service unavailable:", error);
    return generateMockRecommendations();
  }
}

// Generate recommendations based on insights and predictive data
export async function generateRecommendations(data: InsightOverview): Promise<Recommendation[]> {
  const summary = summarizeTrends(data);
  const prompt = `
Analyze the following operational trends and predict recommended actions:
${JSON.stringify(summary, null, 2)}

Provide 3-5 actionable insights grouped by category:
- Performance Optimization: Suggestions to improve workflow efficiency and resource allocation
- Risk Mitigation: Actions to reduce operational risks and safety concerns
- Compliance & Safety: Recommendations for regulatory compliance and safety protocols
- Maintenance Scheduling: Proactive maintenance and equipment optimization

For each recommendation, include:
- Specific, actionable text
- Confidence level (0-100%)
- Brief reasoning explaining the recommendation
- Suggested action type (optimize, alert, schedule, review)
- Target department if applicable

Format the response as JSON with a "recommendations" array.
`;

  const aiResponse = await queryAIModel(prompt);
  return parseRecommendations(aiResponse);
}

// Parse AI response into structured recommendations
export function parseRecommendations(text: string): Recommendation[] {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.recommendations)) {
      return parsed.recommendations.map((rec: any) => ({
        category: rec.category || "General",
        text: rec.text || "No recommendation provided",
        confidence: Math.min(100, Math.max(0, rec.confidence || 75)),
        reasoning: rec.reasoning,
        actionType: rec.actionType,
        departmentId: rec.departmentId
      }));
    }
  } catch (error) {
    console.warn("Failed to parse AI recommendations:", error);
  }

  // Fallback to basic parsing
  return [{
    category: "General",
    text: text.slice(0, 300),
    confidence: 75,
    reasoning: "AI service response format unexpected"
  }];
}

// Summarize trends for AI analysis
export function summarizeTrends(data: InsightOverview): any {
  const workflowInsights = data.insights.filter(i => i.category === "workflow");
  const riskInsights = data.insights.filter(i => i.category === "risk");
  const documentInsights = data.insights.filter(i => i.category === "document");
  const permitInsights = data.insights.filter(i => i.category === "permit");

  const workflowEfficiency = workflowInsights.length > 0 
    ? workflowInsights.reduce((sum, i) => {
        const value = typeof i.value === 'string' ? parseFloat(i.value) : (i.value as number) || 0;
        return sum + value;
      }, 0) / workflowInsights.length
    : 85;

  const riskLevel = riskInsights.length > 0
    ? riskInsights.reduce((sum, i) => {
        const value = typeof i.value === 'string' ? parseFloat(i.value) : (i.value as number) || 0;
        return sum + value;
      }, 0) / riskInsights.length
    : 25;

  return {
    workflowEfficiency: Math.round(workflowEfficiency),
    riskLevel: Math.round(riskLevel),
    trend: data.trend || 'stable',
    confidence: data.confidence || 0.8,
    documentCount: documentInsights.length,
    permitCount: permitInsights.length,
    predictiveForecast: data.predictiveData?.predictions?.slice(0, 3) || [],
    timestamp: new Date().toISOString()
  };
}

// Generate mock recommendations for offline/demo use
function generateMockRecommendations(): string {
  const mockRecommendations: Recommendation[] = [
    {
      category: "Performance Optimization",
      text: "Optimize resource allocation for engineering department based on 15% increase in workflow efficiency predictions",
      confidence: 88,
      reasoning: "Predictive analytics show consistent upward trend in engineering workflow performance",
      actionType: "optimize",
      departmentId: "engineering"
    },
    {
      category: "Risk Mitigation",
      text: "Schedule safety audit for maintenance team due to increased equipment usage patterns",
      confidence: 76,
      reasoning: "Maintenance department showing higher equipment utilization rates",
      actionType: "schedule",
      departmentId: "maintenance"
    },
    {
      category: "Compliance & Safety",
      text: "Review and update safety protocols for high-risk operations identified in recent assessments",
      confidence: 92,
      reasoning: "Compliance dashboard shows 3 pending safety protocol updates",
      actionType: "review"
    },
    {
      category: "Maintenance Scheduling",
      text: "Proactive maintenance recommended for critical equipment showing 12% performance degradation",
      confidence: 81,
      reasoning: "Equipment performance metrics indicate potential maintenance needs",
      actionType: "schedule"
    }
  ];

  return JSON.stringify({ recommendations: mockRecommendations });
}

// Context-aware recommendation filtering
export function filterRecommendationsByContext(
  recommendations: Recommendation[], 
  context: string
): Recommendation[] {
  const contextLower = context.toLowerCase();
  
  if (contextLower.includes("efficiency") || contextLower.includes("performance")) {
    return recommendations.filter(r => r.category === "Performance Optimization");
  }
  
  if (contextLower.includes("risk") || contextLower.includes("safety")) {
    return recommendations.filter(r => 
      r.category === "Risk Mitigation" || r.category === "Compliance & Safety"
    );
  }
  
  if (contextLower.includes("maintenance") || contextLower.includes("equipment")) {
    return recommendations.filter(r => r.category === "Maintenance Scheduling");
  }
  
  if (contextLower.includes("compliance") || contextLower.includes("regulatory")) {
    return recommendations.filter(r => r.category === "Compliance & Safety");
  }
  
  return recommendations;
}
