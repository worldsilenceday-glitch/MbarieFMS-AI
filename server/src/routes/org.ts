import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/org - Get full organogram
router.get('/', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: {
        supervisor: true,
        userPositions: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            department: true
          }
        }
      },
      orderBy: {
        department: 'asc'
      }
    });

    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error fetching organogram:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organogram'
    });
  }
});

// GET /api/org/supervisors - Get all supervisors
router.get('/supervisors', async (req, res) => {
  try {
    const supervisors = await prisma.position.findMany({
      where: {
        userPositions: {
          some: {}
        }
      },
      include: {
        userPositions: {
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
      data: supervisors
    });
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisors'
    });
  }
});

// POST /api/org/assign - Assign user to position
router.post('/assign', async (req, res) => {
  try {
    const { userId, positionId } = req.body;

    if (!userId || !positionId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Position ID are required'
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { positionId },
      include: {
        userPosition: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error assigning user to position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign user to position'
    });
  }
});

// GET /api/org/positions - Get all positions
router.get('/positions', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      orderBy: {
        title: 'asc'
      }
    });

    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch positions'
    });
  }
});

export default router;
