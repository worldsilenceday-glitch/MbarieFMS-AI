export interface ApprovalStep {
    role: string;
    position: string;
    requiredCertifications?: string[];
    order: number;
}
export interface PermitApprovalChain {
    permitType: string;
    steps: ApprovalStep[];
}
export declare class ApprovalService {
    private static defaultApprovalChains;
    /**
     * Get the next approver for a permit
     */
    static getNextApprover(permitId: string, currentStep: number): Promise<any>;
    /**
     * Check if user has required certifications for approval
     */
    static checkUserCertifications(userId: string, requiredCerts: string[]): Promise<boolean>;
    /**
     * Find delegate approver when primary approver is unavailable
     */
    private static findDelegateApprover;
    /**
     * Get approval chain for permit type
     */
    private static getApprovalChain;
    /**
     * Validate if all required approvals are complete
     */
    static validateApprovalCompletion(permitId: string): Promise<boolean>;
    /**
     * Get approval progress for a permit
     */
    static getApprovalProgress(permitId: string): Promise<{
        currentStep: number;
        totalSteps: number;
        completedSteps: number;
        nextApprover: any;
    }>;
}
//# sourceMappingURL=approvalService.d.ts.map