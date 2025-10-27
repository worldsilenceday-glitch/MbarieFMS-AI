import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/document - Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
});

// GET /api/document/:id - Get specific document
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document'
    });
  }
});

// POST /api/document - Upload new document
router.post('/', async (req, res) => {
  try {
    const { title, path, ownerId, metadata, expiry } = req.body;

    if (!title || !path || !ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Title, path, and owner ID are required'
      });
    }

    const document = await prisma.document.create({
      data: {
        title,
        path,
        ownerId,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        expiry,
        status: 'draft',
        version: 1
      },
      include: {
        owner: {
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
      data: document
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create document'
    });
  }
});

// POST /api/document/:id/version - Create new version
router.post('/:id/version', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, path, metadata } = req.body;

    if (!title || !path) {
      return res.status(400).json({
        success: false,
        error: 'Title and path are required for new version'
      });
    }

    // Get current document
    const currentDoc = await prisma.document.findUnique({
      where: { id }
    });

    if (!currentDoc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Create new version
    const newDocument = await prisma.document.create({
      data: {
        title,
        path,
        ownerId: currentDoc.ownerId,
        metadata: metadata ? JSON.stringify(metadata) : currentDoc.metadata,
        expiry: currentDoc.expiry,
        status: 'draft',
        version: currentDoc.version + 1
      },
      include: {
        owner: {
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
      data: newDocument
    });
  } catch (error) {
    console.error('Error creating document version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create document version'
    });
  }
});

// POST /api/document/:id/approve - Approve document
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

    // Get current document
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Update approvals
    const currentApprovals = (typeof document.approvals === 'string' ? JSON.parse(document.approvals) : (document.approvals || [])) as any[];
    const newApproval = {
      approverId,
      comments,
      approvedAt: new Date().toISOString()
    };
    const updatedApprovals = [...currentApprovals, newApproval];

    // Update document status
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status: 'approved',
        approvals: JSON.stringify(updatedApprovals)
      },
      include: {
        owner: {
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
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error approving document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve document'
    });
  }
});

export default router;
