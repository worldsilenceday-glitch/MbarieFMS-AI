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
declare class MbarieAICore {
    private apiKey;
    private baseURL;
    constructor();
    /**
     * Intelligent Delegation Engine (IDE)
     * Dynamically assigns tasks based on roles, workloads, and skills
     */
    recommendDelegation(task: TaskContext): Promise<AIDelegationResult>;
    /**
     * Get user workload based on pending permits and approvals
     */
    private getUserWorkload;
    /**
     * Predictive Safety & Risk AI (PSR-AI)
     * Analyzes permits and incidents to predict potential hazards
     */
    assessRisk(permitData: any, incidentHistory: any[]): Promise<RiskAssessment>;
    /**
     * Document Intelligence (DI)
     * Analyzes and summarizes documents
     */
    analyzeDocument(content: string, documentType: string): Promise<DocumentAnalysis>;
    /**
     * Permit Orchestration AI (PO-AI)
     * Recommends required approvers and flags issues
     */
    recommendPermitApproval(permitData: any): Promise<PermitRecommendation>;
    /**
     * Generate insights for workflow dashboard
     */
    generateWorkflowInsights(): Promise<any>;
}
export declare const mbarieAI: MbarieAICore;
export {};
//# sourceMappingURL=core-ai.d.ts.map