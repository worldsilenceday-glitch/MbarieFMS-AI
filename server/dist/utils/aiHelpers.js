"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIHelpers = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
// DeepSeek API configuration
const deepseekConfig = {
    apiKey: process.env.AI_API_KEY || '',
    baseURL: 'https://api.deepseek.com/v1'
};
class AIHelpers {
    /**
     * Suggest approvers for a permit based on organogram and requirements
     */
    static async suggestApprovers(permitData) {
        try {
            const { type, requesterId, requiredCerts, severity } = permitData;
            // Get requester information
            const requester = await prisma.user.findUnique({
                where: { id: requesterId },
                include: {
                    position: {
                        include: {
                            supervisor: {
                                include: {
                                    users: {
                                        include: {
                                            certifications: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            if (!requester) {
                return [];
            }
            // Build prompt for AI
            const prompt = this.buildApproverSuggestionPrompt(requester, type, requiredCerts, severity);
            // Call DeepSeek API
            const response = await axios_1.default.post(`${deepseekConfig.baseURL}/chat/completions`, {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert in organizational hierarchy and safety compliance. Suggest appropriate approvers for permits based on the organizational structure, required certifications, and safety protocols."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${deepseekConfig.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const suggestions = JSON.parse(response.data.choices[0]?.message?.content || '[]');
            // Validate and filter suggestions against actual users
            return await this.validateAndFilterSuggestions(suggestions);
        }
        catch (error) {
            console.error('Error suggesting approvers:', error);
            // Fallback to basic approver selection
            return await this.getFallbackApprovers(permitData);
        }
    }
    /**
     * Draft permit summary email
     */
    static async draftPermitEmail(permitData, approvers) {
        try {
            const prompt = this.buildEmailDraftPrompt(permitData, approvers);
            const response = await axios_1.default.post(`${deepseekConfig.baseURL}/chat/completions`, {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional business communication assistant. Draft clear, concise, and professional emails for permit approvals."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 800,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${deepseekConfig.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0]?.message?.content || '';
        }
        catch (error) {
            console.error('Error drafting permit email:', error);
            return this.getFallbackEmailDraft(permitData, approvers);
        }
    }
    /**
     * Generate incident escalation message
     */
    static async generateIncidentEscalation(incidentData) {
        try {
            const prompt = this.buildIncidentEscalationPrompt(incidentData);
            const response = await axios_1.default.post(`${deepseekConfig.baseURL}/chat/completions`, {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are a safety and emergency response coordinator. Generate urgent but professional escalation messages for HSSE incidents."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.4,
                max_tokens: 600,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${deepseekConfig.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0]?.message?.content || '';
        }
        catch (error) {
            console.error('Error generating incident escalation:', error);
            return this.getFallbackIncidentEscalation(incidentData);
        }
    }
    /**
     * Analyze document content for compliance
     */
    static async analyzeDocumentCompliance(documentContent, documentType) {
        try {
            const prompt = this.buildComplianceAnalysisPrompt(documentContent, documentType);
            const response = await axios_1.default.post(`${deepseekConfig.baseURL}/chat/completions`, {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are a compliance and quality assurance expert. Analyze documents for compliance with safety standards and organizational policies."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 1000,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${deepseekConfig.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return JSON.parse(response.data.choices[0]?.message?.content || '{}');
        }
        catch (error) {
            console.error('Error analyzing document compliance:', error);
            return { complianceScore: 0, issues: [], suggestions: [] };
        }
    }
    /**
     * Build approver suggestion prompt
     */
    static buildApproverSuggestionPrompt(requester, permitType, requiredCerts, severity) {
        return `
      Context: Suggest approvers for a ${permitType} permit in an oil and gas facility management system.

      Requester Information:
      - Name: ${requester.firstName} ${requester.lastName}
      - Position: ${requester.position?.title || requester.position}
      - Department: ${requester.department}

      Permit Requirements:
      - Type: ${permitType}
      - Severity Level: ${severity}
      - Required Certifications: ${requiredCerts?.join(', ') || 'None specified'}

      Organizational Structure:
      - The requester reports to: ${requester.position?.supervisor?.title || 'No direct supervisor'}
      - Standard approval chain: Requester → Supervisor → Safety Coordinator → Operations Manager → General Manager

      Please suggest 3-5 potential approvers in JSON format:
      [
        {
          "position": "Position Title",
          "reason": "Why this approver is suitable",
          "priority": "high|medium|low"
        }
      ]

      Consider:
      1. Position hierarchy
      2. Required certifications
      3. Permit severity level
      4. Department alignment
      5. Safety compliance requirements
    `;
    }
    /**
     * Build email draft prompt
     */
    static buildEmailDraftPrompt(permitData, approvers) {
        return `
      Draft a professional email for permit approval request.

      Permit Details:
      - Title: ${permitData.title}
      - Type: ${permitData.type}
      - Requester: ${permitData.requesterName}
      - Description: ${permitData.description || 'Not provided'}
      - Severity: ${permitData.severity}

      Approvers:
      ${approvers.map(approver => `- ${approver.position}: ${approver.name}`).join('\n')}

      Requirements:
      - Clear subject line
      - Professional tone
      - Include key permit details
      - Specify approval steps
      - Mention any safety considerations
      - Call to action for approval

      Format the email with appropriate sections and professional language.
    `;
    }
    /**
     * Build incident escalation prompt
     */
    static buildIncidentEscalationPrompt(incidentData) {
        return `
      Generate an urgent escalation message for an HSSE incident.

      Incident Details:
      - Title: ${incidentData.title}
      - Severity: ${incidentData.severity}/5
      - Description: ${incidentData.description}
      - Reported by: ${incidentData.reportedByName}
      - Time: ${incidentData.createdAt}

      Requirements:
      - Urgent but professional tone
      - Clear incident summary
      - Immediate actions required
      - Key personnel to be notified
      - Safety precautions
      - Next steps

      Format as a formal escalation notification.
    `;
    }
    /**
     * Build compliance analysis prompt
     */
    static buildComplianceAnalysisPrompt(documentContent, documentType) {
        return `
      Analyze the following document for compliance with safety standards and organizational policies.

      Document Type: ${documentType}
      Document Content:
      ${documentContent.substring(0, 3000)} ${documentContent.length > 3000 ? '... (truncated)' : ''}

      Please provide analysis in JSON format:
      {
        "complianceScore": 0-100,
        "issues": ["list of compliance issues"],
        "suggestions": ["list of improvement suggestions"],
        "criticalFindings": ["any critical non-compliance items"]
      }

      Focus on:
      - Safety protocol adherence
      - Regulatory compliance
      - Document completeness
      - Risk assessment adequacy
      - Emergency procedures
    `;
    }
    /**
     * Validate and filter AI suggestions against actual users
     */
    static async validateAndFilterSuggestions(suggestions) {
        const validatedSuggestions = [];
        for (const suggestion of suggestions) {
            const users = await prisma.user.findMany({
                where: {
                    position: {
                        contains: suggestion.position,
                        mode: 'insensitive'
                    },
                    isActive: true
                },
                include: {
                    certifications: true
                }
            });
            if (users.length > 0) {
                validatedSuggestions.push({
                    ...suggestion,
                    actualUsers: users.slice(0, 3) // Limit to top 3 matches
                });
            }
        }
        return validatedSuggestions;
    }
    /**
     * Fallback approver selection when AI fails
     */
    static async getFallbackApprovers(permitData) {
        const { severity } = permitData;
        const positions = [
            { position: 'Supervisor', priority: 'high' },
            { position: 'Safety Coordinator', priority: 'high' }
        ];
        if (severity >= 3) {
            positions.push({ position: 'Operations Manager', priority: 'medium' }, { position: 'General Manager', priority: 'low' });
        }
        return positions;
    }
    /**
     * Fallback email draft when AI fails
     */
    static getFallbackEmailDraft(permitData, approvers) {
        return `
      Subject: Permit Approval Request - ${permitData.title}

      Dear Approvers,

      A new permit requires your approval:

      Permit Details:
      - Title: ${permitData.title}
      - Type: ${permitData.type}
      - Requester: ${permitData.requesterName}
      - Severity Level: ${permitData.severity}

      Approval Chain:
      ${approvers.map(approver => `- ${approver.position}`).join('\n')}

      Please review and approve this permit at your earliest convenience.

      Thank you,
      Mbarie FMS System
    `;
    }
    /**
     * Fallback incident escalation when AI fails
     */
    static getFallbackIncidentEscalation(incidentData) {
        return `
      URGENT: HSSE Incident Escalation

      Incident: ${incidentData.title}
      Severity: Level ${incidentData.severity}
      Reported: ${incidentData.createdAt}
      By: ${incidentData.reportedByName}

      Description:
      ${incidentData.description}

      Immediate escalation required. Please take appropriate safety measures and coordinate response.

      This incident has been automatically escalated due to high severity level.
    `;
    }
}
exports.AIHelpers = AIHelpers;
//# sourceMappingURL=aiHelpers.js.map