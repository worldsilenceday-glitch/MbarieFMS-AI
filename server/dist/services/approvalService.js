"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ApprovalService {
    /**
     * Get the next approver for a permit
     */
    static async getNextApprover(permitId, currentStep) {
        try {
            const permit = await prisma.permit.findUnique({
                where: { id: permitId },
                include: {
                    requester: {
                        include: {
                            position: true
                        }
                    }
                }
            });
            if (!permit) {
                throw new Error('Permit not found');
            }
            // Get approval chain for this permit type
            const approvalChain = this.getApprovalChain(permit.type);
            const nextStep = approvalChain.steps.find(step => step.order === currentStep + 1);
            if (!nextStep) {
                return null; // No more steps
            }
            // Find users with the required position
            const potentialApprovers = await prisma.user.findMany({
                where: {
                    position: {
                        contains: nextStep.position,
                        mode: 'insensitive'
                    },
                    isActive: true
                },
                include: {
                    position: true,
                    certifications: true
                }
            });
            // Filter by required certifications if any
            const qualifiedApprovers = potentialApprovers.filter(user => {
                if (!nextStep.requiredCertifications || nextStep.requiredCertifications.length === 0) {
                    return true;
                }
                const userCertNames = user.certifications.map(cert => cert.name);
                return nextStep.requiredCertifications.every(requiredCert => userCertNames.includes(requiredCert));
            });
            // If no qualified approvers found, look for delegates
            if (qualifiedApprovers.length === 0) {
                return await this.findDelegateApprover(nextStep.position);
            }
            // Return the first qualified approver (could be enhanced with more sophisticated logic)
            return qualifiedApprovers[0];
        }
        catch (error) {
            console.error('Error getting next approver:', error);
            throw error;
        }
    }
    /**
     * Check if user has required certifications for approval
     */
    static async checkUserCertifications(userId, requiredCerts) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    certifications: true
                }
            });
            if (!user) {
                return false;
            }
            const userCertNames = user.certifications.map(cert => cert.name);
            return requiredCerts.every(requiredCert => userCertNames.includes(requiredCert));
        }
        catch (error) {
            console.error('Error checking user certifications:', error);
            return false;
        }
    }
    /**
     * Find delegate approver when primary approver is unavailable
     */
    static async findDelegateApprover(position) {
        try {
            // Find active delegates for this position
            const delegates = await prisma.delegate.findMany({
                where: {
                    active: true,
                    startAt: { lte: new Date() },
                    endAt: { gte: new Date() },
                    user: {
                        position: {
                            contains: position,
                            mode: 'insensitive'
                        }
                    }
                },
                include: {
                    delegateTo: {
                        include: {
                            position: true,
                            certifications: true
                        }
                    }
                }
            });
            if (delegates.length === 0) {
                return null;
            }
            // Return the first delegate (could be enhanced with priority logic)
            return delegates[0].delegateTo;
        }
        catch (error) {
            console.error('Error finding delegate approver:', error);
            return null;
        }
    }
    /**
     * Get approval chain for permit type
     */
    static getApprovalChain(permitType) {
        const chain = this.defaultApprovalChains.find(chain => chain.permitType === permitType);
        if (!chain) {
            // Return default medium-safety chain if type not found
            return this.defaultApprovalChains.find(chain => chain.permitType === 'medium-safety');
        }
        return chain;
    }
    /**
     * Validate if all required approvals are complete
     */
    static async validateApprovalCompletion(permitId) {
        try {
            const permit = await prisma.permit.findUnique({
                where: { id: permitId }
            });
            if (!permit) {
                return false;
            }
            const approvalChain = this.getApprovalChain(permit.type);
            const totalSteps = approvalChain.steps.length - 1; // Exclude requester step
            const approvals = await prisma.permitApproval.findMany({
                where: { permitId, status: 'approved' }
            });
            return approvals.length >= totalSteps;
        }
        catch (error) {
            console.error('Error validating approval completion:', error);
            return false;
        }
    }
    /**
     * Get approval progress for a permit
     */
    static async getApprovalProgress(permitId) {
        try {
            const permit = await prisma.permit.findUnique({
                where: { id: permitId }
            });
            if (!permit) {
                throw new Error('Permit not found');
            }
            const approvalChain = this.getApprovalChain(permit.type);
            const totalSteps = approvalChain.steps.length - 1; // Exclude requester step
            const approvals = await prisma.permitApproval.findMany({
                where: { permitId, status: 'approved' }
            });
            const completedSteps = approvals.length;
            const currentStep = completedSteps;
            const nextApprover = await this.getNextApprover(permitId, currentStep);
            return {
                currentStep,
                totalSteps,
                completedSteps,
                nextApprover
            };
        }
        catch (error) {
            console.error('Error getting approval progress:', error);
            throw error;
        }
    }
}
exports.ApprovalService = ApprovalService;
// Default approval chains for different permit types
ApprovalService.defaultApprovalChains = [
    {
        permitType: 'high-safety',
        steps: [
            { role: 'requester', position: 'Any', order: 0 },
            { role: 'supervisor', position: 'Supervisor', order: 1 },
            { role: 'safety', position: 'Safety Coordinator', order: 2 },
            { role: 'operations', position: 'Operations Manager', order: 3 },
            { role: 'executive', position: 'General Manager', order: 4 }
        ]
    },
    {
        permitType: 'medium-safety',
        steps: [
            { role: 'requester', position: 'Any', order: 0 },
            { role: 'supervisor', position: 'Supervisor', order: 1 },
            { role: 'safety', position: 'Safety Coordinator', order: 2 },
            { role: 'operations', position: 'Operations Manager', order: 3 }
        ]
    },
    {
        permitType: 'low-safety',
        steps: [
            { role: 'requester', position: 'Any', order: 0 },
            { role: 'supervisor', position: 'Supervisor', order: 1 }
        ]
    }
];
//# sourceMappingURL=approvalService.js.map