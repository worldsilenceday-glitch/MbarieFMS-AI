"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// GET /api/permit - Get all permits
router.get('/', async (req, res) => {
    try {
        const permits = await prisma.permit.findMany({
            include: {
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        userPosition: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: permits
        });
    }
    catch (error) {
        console.error('Error fetching permits:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch permits'
        });
    }
});
// GET /api/permit/:id - Get specific permit
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const permit = await prisma.permit.findUnique({
            where: { id },
            include: {
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        userPosition: true
                    }
                }
            }
        });
        if (!permit) {
            return res.status(404).json({
                success: false,
                error: 'Permit not found'
            });
        }
        res.json({
            success: true,
            data: permit
        });
    }
    catch (error) {
        console.error('Error fetching permit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch permit'
        });
    }
});
// POST /api/permit - Create new permit
router.post('/', async (req, res) => {
    try {
        const { type, title, requesterId, jobId, requiredCerts, severity, steps } = req.body;
        if (!type || !title || !requesterId) {
            return res.status(400).json({
                success: false,
                error: 'Type, title, and requester ID are required'
            });
        }
        const permit = await prisma.permit.create({
            data: {
                type,
                title,
                requesterId,
                jobId,
                requiredCerts: requiredCerts || [],
                severity: severity || 1,
                steps: steps || [],
                status: 'draft'
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        userPosition: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: permit
        });
    }
    catch (error) {
        console.error('Error creating permit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create permit'
        });
    }
});
// POST /api/permit/:id/approve - Approve permit step
router.post('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { approverId, comments } = req.body;
        if (!approverId) {
            return res.status(400).json({
                success: false,
                error: 'Approver ID is required'
            });
        }
        // Create approval record
        const approval = await prisma.permitApproval.create({
            data: {
                permitId: id,
                approverId,
                status: 'approved',
                comments,
                actedAt: new Date()
            },
            include: {
                approver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: approval
        });
    }
    catch (error) {
        console.error('Error approving permit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve permit'
        });
    }
});
// POST /api/permit/:id/reject - Reject permit
router.post('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { approverId, comments } = req.body;
        if (!approverId) {
            return res.status(400).json({
                success: false,
                error: 'Approver ID is required'
            });
        }
        // Create rejection record
        const approval = await prisma.permitApproval.create({
            data: {
                permitId: id,
                approverId,
                status: 'rejected',
                comments,
                actedAt: new Date()
            },
            include: {
                approver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        // Update permit status
        await prisma.permit.update({
            where: { id },
            data: { status: 'rejected' }
        });
        res.json({
            success: true,
            data: approval
        });
    }
    catch (error) {
        console.error('Error rejecting permit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject permit'
        });
    }
});
// POST /api/permit/:id/attach - Attach document to permit
router.post('/:id/attach', async (req, res) => {
    try {
        const { id } = req.params;
        const { documentId, attachmentData } = req.body;
        if (!documentId && !attachmentData) {
            return res.status(400).json({
                success: false,
                error: 'Either document ID or attachment data is required'
            });
        }
        // Get current permit
        const permit = await prisma.permit.findUnique({
            where: { id }
        });
        if (!permit) {
            return res.status(404).json({
                success: false,
                error: 'Permit not found'
            });
        }
        // Update attachments
        const currentAttachments = permit.attachments || [];
        const newAttachments = [...currentAttachments, attachmentData || { documentId }];
        const updatedPermit = await prisma.permit.update({
            where: { id },
            data: { attachments: JSON.stringify(newAttachments) }
        });
        res.json({
            success: true,
            data: updatedPermit
        });
    }
    catch (error) {
        console.error('Error attaching to permit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to attach to permit'
        });
    }
});
exports.default = router;
//# sourceMappingURL=permit.js.map