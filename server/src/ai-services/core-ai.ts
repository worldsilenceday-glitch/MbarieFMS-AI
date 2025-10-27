import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export interface TaskContext {
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredSkills: string[];
  department: string;
  location: string;
  estimatedDuration: number;
  deadline?: Date;
}

export interface AIDelegationResult {
  recommendedUserId: string;
  confidence: number;
  reasoning: string;
  alternativeUsers: string[];
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: string[];
  mitigation: string[];
  confidence: number;
}

export interface DocumentAnalysis {
  summary: string;
  category: string;
  tags: string[];
  keyPoints: string[];
  complianceStatus: 'compliant' | 'needs_review' | 'non_compliant';
  suggestedActions: string[];
}

export interface PermitRecommendation {
  requiredApprovers: string[];
  missingRequirements: string[];
  riskAssessment: RiskAssessment;
  suggestedTimeline: {
    estimatedDuration: number;
    criticalPath: string[];
  };
}

class MbarieAICore {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.baseURL = 'https://api.deepseek.com/v1';
  }

  /**
   * Intelligent Delegation Engine (IDE)
   * Dynamically assigns tasks based on roles, workloads, and skills
   */
  async recommendDelegation(task: TaskContext): Promise<AIDelegationResult> {
    try {
      // Get all active users
      const users = await prisma.user.findMany({
        where: { isActive: true }
      });

      // Calculate workload scores based on pending permits
      const usersWithWorkload = await Promise.all(
        users.map(async (user) => {
          // Count pending tasks for this user
          const pendingTasks = await this.getUserWorkload(user.id);
          const workloadScore = Math.min(pendingTasks / 5, 1); // Normalize to 0-1

          return {
            ...user,
            workloadScore,
            availability: workloadScore > 0.8 ? 'busy' : 
                         workloadScore > 0.5 ? 'available' : 'available'
          };
        })
      );

      // Use AI to analyze and recommend best delegate
      const prompt = `
        Task Context:
        - Type: ${task.type}
        - Priority: ${task.priority}
        - Required Skills: ${task.requiredSkills.join(', ')}
        - Department: ${task.department}
        - Location: ${task.location}
        - Estimated Duration: ${task.estimatedDuration} hours

        Available Users:
        ${usersWithWorkload.map(user => `
          - ${user.firstName} ${user.lastName} (${user.jobTitle})
          - Department: ${user.department}
          - Workload: ${user.workloadScore.toFixed(2)}
          - Availability: ${user.availability}
          - Location: ${user.facility}
        `).join('\n')}

        Based on the task requirements and user profiles, recommend the best person to delegate this task to.
        Consider: skills match, workload, availability, location proximity, and organizational hierarchy.
        Return only the user ID of the most suitable candidate and a brief reasoning.
      `;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are an intelligent delegation engine for Mbarie Services Ltd. Analyze task requirements and user profiles to recommend the best person for delegation."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content || '';
      
      // Parse AI response to extract recommended user
      const recommendedUser = usersWithWorkload.find(user => 
        aiResponse.includes(user.firstName) || aiResponse.includes(user.lastName)
      );

      return {
        recommendedUserId: recommendedUser?.id || usersWithWorkload[0]?.id || '',
        confidence: 0.85,
        reasoning: aiResponse,
        alternativeUsers: usersWithWorkload.slice(1, 4).map(u => u.id)
      };

    } catch (error) {
      console.error('Error in delegation engine:', error);
      throw new Error('Failed to generate delegation recommendation');
    }
  }

  /**
   * Get user workload based on pending permits and approvals
   */
  private async getUserWorkload(userId: string): Promise<number> {
    try {
      // Count permits where user is requester with pending status
      const requesterCount = await prisma.permit.count({
        where: {
          requesterId: userId,
          status: { in: ['pending', 'requested'] }
        }
      });

      // Count approvals pending for this user
      const approverCount = await prisma.permitApproval.count({
        where: {
          approverId: userId,
          status: 'pending'
        }
      });

      return requesterCount + approverCount;
    } catch (error) {
      console.error('Error calculating user workload:', error);
      return 0;
    }
  }

  /**
   * Predictive Safety & Risk AI (PSR-AI)
   * Analyzes permits and incidents to predict potential hazards
   */
  async assessRisk(permitData: any, incidentHistory: any[]): Promise<RiskAssessment> {
    try {
      const prompt = `
        Permit Data:
        - Type: ${permitData.type}
        - Location: ${permitData.location}
        - Hazards: ${permitData.hazards || 'Not specified'}
        - Personnel: ${permitData.personnelCount || 'Unknown'}
        - Duration: ${permitData.estimatedDuration || 'Unknown'} hours

        Incident History (Last 6 months):
        ${incidentHistory.map(incident => `
          - ${incident.title}: ${incident.description}
          - Severity: ${incident.severity}
          - Location: ${incident.location}
        `).join('\n')}

        Assess the risk level for this permit and provide:
        1. Risk level (low/medium/high/critical)
        2. Probability (0-1)
        3. Potential impacts
        4. Mitigation strategies
        5. Confidence in assessment
      `;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a safety and risk assessment AI for Mbarie Services Ltd. Analyze permits and incident history to predict potential hazards and provide risk assessments."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content || '';
      
      // Parse response to extract risk assessment
      const riskLevel = aiResponse.includes('critical') ? 'critical' :
                       aiResponse.includes('high') ? 'high' :
                       aiResponse.includes('medium') ? 'medium' : 'low';

      return {
        riskLevel,
        probability: 0.7, // Would be calculated from historical data
        impact: ['Potential injury', 'Equipment damage', 'Project delay'],
        mitigation: ['Enhanced supervision', 'Additional safety measures', 'Regular safety briefings'],
        confidence: 0.8
      };

    } catch (error) {
      console.error('Error in risk assessment:', error);
      throw new Error('Failed to assess risk');
    }
  }

  /**
   * Document Intelligence (DI)
   * Analyzes and summarizes documents
   */
  async analyzeDocument(content: string, documentType: string): Promise<DocumentAnalysis> {
    try {
      const prompt = `
        Document Type: ${documentType}
        Content: ${content.substring(0, 4000)} // Limit content length

        Please analyze this document and provide:
        1. A concise summary
        2. Appropriate category
        3. Relevant tags
        4. Key points
        5. Compliance status assessment
        6. Suggested actions
      `;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a document intelligence AI for Mbarie Services Ltd. Analyze and summarize technical documents, assess compliance, and provide actionable insights."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content || '';

      return {
        summary: aiResponse.split('\n')[0] || 'Summary not available',
        category: documentType,
        tags: ['technical', 'compliance', 'safety'],
        keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
        complianceStatus: 'needs_review',
        suggestedActions: ['Review by safety officer', 'Update procedures', 'Share with team']
      };

    } catch (error) {
      console.error('Error in document analysis:', error);
      throw new Error('Failed to analyze document');
    }
  }

  /**
   * Permit Orchestration AI (PO-AI)
   * Recommends required approvers and flags issues
   */
  async recommendPermitApproval(permitData: any): Promise<PermitRecommendation> {
    try {
      // Get all users for potential approvers
      const users = await prisma.user.findMany({
        where: { isActive: true }
      });

      // Simple logic to select approvers based on department and role
      const potentialApprovers = users.filter(user => 
        user.department === permitData.department || 
        user.jobTitle.toLowerCase().includes('manager') ||
        user.jobTitle.toLowerCase().includes('safety')
      );

      return {
        requiredApprovers: potentialApprovers.slice(0, 3).map(u => u.id),
        missingRequirements: ['Safety officer approval', 'Equipment certification'],
        riskAssessment: await this.assessRisk(permitData, []),
        suggestedTimeline: {
          estimatedDuration: 24,
          criticalPath: ['Safety review', 'Equipment check', 'Final approval']
        }
      };

    } catch (error) {
      console.error('Error in permit orchestration:', error);
      throw new Error('Failed to generate permit recommendations');
    }
  }

  /**
   * Generate insights for workflow dashboard
   */
  async generateWorkflowInsights(): Promise<any> {
    try {
      // Get basic metrics
      const totalPermits = await prisma.permit.count();
      const pendingPermits = await prisma.permit.count({
        where: { status: { in: ['pending', 'requested'] } }
      });
      const completedPermits = await prisma.permit.count({
        where: { status: 'approved' }
      });

      const totalIncidents = await prisma.hSSEIncident.count();
      const openIncidents = await prisma.hSSEIncident.count({
        where: { status: 'open' }
      });

      return {
        metrics: {
          totalPermits,
          pendingPermits,
          completedPermits,
          totalIncidents,
          openIncidents,
          completionRate: totalPermits > 0 ? (completedPermits / totalPermits) * 100 : 0
        },
        recommendations: [
          'Review pending permits for potential bottlenecks',
          'Schedule safety briefing for high-risk activities',
          'Update equipment maintenance schedules'
        ]
      };

    } catch (error) {
      console.error('Error generating workflow insights:', error);
      throw new Error('Failed to generate workflow insights');
    }
  }
}

export const mbarieAI = new MbarieAICore();
