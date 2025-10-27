import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/hsse - Get all HSSE incidents
router.get('/', async (req, res) => {
  try {
    const incidents = await prisma.hSSEIncident.findMany({
      include: {
        reportedBy: {
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
      data: incidents
    });
  } catch (error) {
    console.error('Error fetching HSSE incidents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HSSE incidents'
    });
  }
});

// GET /api/hsse/:id - Get specific HSSE incident
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await prisma.hSSEIncident.findUnique({
      where: { id },
      include: {
        reportedBy: {
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

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'HSSE incident not found'
      });
    }

    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error fetching HSSE incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HSSE incident'
    });
  }
});

// POST /api/hsse - Report new HSSE incident
router.post('/', async (req, res) => {
  try {
    const { title, description, reportedById, severity, attachments } = req.body;

    if (!title || !description || !reportedById) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and reporter ID are required'
      });
    }

    const incident = await prisma.hSSEIncident.create({
      data: {
        title,
        description,
        reportedById,
        severity: severity || 1,
        attachments: attachments || [],
        status: 'open',
        actions: "[]"
      },
      include: {
        reportedBy: {
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

    // Auto-escalate for high severity incidents
    if (severity >= 3) {
      await escalateIncident(incident);
    }

    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error reporting HSSE incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report HSSE incident'
    });
  }
});

// POST /api/hsse/:id/escalate - Escalate incident
router.post('/:id/escalate', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const incident = await prisma.hSSEIncident.findUnique({
      where: { id }
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'HSSE incident not found'
      });
    }

    // Escalate the incident
    await escalateIncident(incident, reason);

    // Get first manager for escalation message
    const keyPersonnel = await prisma.user.findMany({
      where: {
        OR: [
          { jobTitle: { contains: 'Manager', mode: 'insensitive' } },
          { jobTitle: { contains: 'General Manager', mode: 'insensitive' } },
          { jobTitle: { contains: 'Project Manager', mode: 'insensitive' } },
          { jobTitle: { contains: 'Safety', mode: 'insensitive' } }
        ]
      },
      take: 1
    });
    const firstManager = keyPersonnel[0];

    // Update incident with escalation action
    const updatedIncident = await prisma.hSSEIncident.update({
      where: { id },
      data: {
        actions: JSON.stringify([
          `Escalated to ${firstManager?.firstName || 'Management'} ${firstManager?.lastName || ''}`,
          {
            type: 'escalation',
            reason: 'High severity incident requires management attention',
            escalatedAt: new Date().toISOString()
          }
        ])
      },
      include: {
        reportedBy: {
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
      data: updatedIncident
    });
  } catch (error) {
    console.error('Error escalating HSSE incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to escalate HSSE incident'
    });
  }
});

// PUT /api/hsse/:id - Update incident status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actions } = req.body;

    const incident = await prisma.hSSEIncident.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(actions && { actions })
      },
      include: {
        reportedBy: {
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
      data: incident
    });
  } catch (error) {
    console.error('Error updating HSSE incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update HSSE incident'
    });
  }
});

// Helper function to escalate incident
async function escalateIncident(incident: any, reason?: string) {
  try {
    // Get key personnel for escalation
    const keyPersonnel = await prisma.user.findMany({
      where: {
        OR: [
          { jobTitle: { contains: 'Manager', mode: 'insensitive' } },
          { jobTitle: { contains: 'General Manager', mode: 'insensitive' } },
          { jobTitle: { contains: 'Project Manager', mode: 'insensitive' } },
          { jobTitle: { contains: 'Safety', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userPosition: true
      }
    });

    // Log escalation in communication log
    await prisma.communicationLog.create({
      data: {
        type: 'system',
        summary: `HSSE Incident Escalation: ${incident.title}`,
        content: `Incident ID: ${incident.id}\nSeverity: ${incident.severity}\nReason: ${reason || 'Auto-escalation due to high severity'}\nEscalated to: ${keyPersonnel.map(p => p.email).join(', ')}`,
        createdAt: new Date()
      }
    });

    console.log(`HSSE Incident escalated: ${incident.title}`);
    console.log(`Escalated to: ${keyPersonnel.map(p => p.email).join(', ')}`);
  } catch (error) {
    console.error('Error in incident escalation:', error);
  }
}

export default router;
