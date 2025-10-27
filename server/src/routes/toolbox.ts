import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Log toolbox meeting
router.post('/meetings', async (req, res) => {
  try {
    const { userId, facility, ppeVerified, safetyTopic, hazards, attendees, notes } = req.body;

    const toolboxMeeting = await prisma.toolboxMeeting.create({
      data: {
        userId,
        facility,
        ppeVerified,
        safetyTopic,
        hazards,
        attendees,
        notes
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    });

    res.status(201).json(toolboxMeeting);
  } catch (error) {
    console.error('Error logging toolbox meeting:', error);
    res.status(500).json({ error: 'Failed to log toolbox meeting' });
  }
});

// Get toolbox meetings with filters
router.get('/meetings', async (req, res) => {
  try {
    const { userId, facility, date } = req.query;

    const where: any = {};
    
    if (userId) where.userId = userId as string;
    if (facility) where.facility = facility as string;
    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      where.date = {
        gte: startDate,
        lt: endDate
      };
    }

    const meetings = await prisma.toolboxMeeting.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(meetings);
  } catch (error) {
    console.error('Error fetching toolbox meetings:', error);
    res.status(500).json({ error: 'Failed to fetch toolbox meetings' });
  }
});

// Get toolbox meeting statistics
router.get('/statistics', async (req, res) => {
  try {
    const { facility, startDate, endDate } = req.query;

    const where: any = {};
    
    if (facility) where.facility = facility as string;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const totalMeetings = await prisma.toolboxMeeting.count({ where });
    const ppeVerifiedCount = await prisma.toolboxMeeting.count({ 
      where: { ...where, ppeVerified: true } 
    });
    const uniqueAttendees = await prisma.toolboxMeeting.aggregate({
      where,
      _count: {
        attendees: true
      }
    });

    const safetyTopics = await prisma.toolboxMeeting.groupBy({
      by: ['safetyTopic'],
      where,
      _count: {
        safetyTopic: true
      },
      orderBy: {
        _count: {
          safetyTopic: 'desc'
        }
      },
      take: 10
    });

    res.json({
      totalMeetings,
      ppeVerifiedCount,
      ppeVerifiedPercentage: totalMeetings > 0 ? (ppeVerifiedCount / totalMeetings * 100).toFixed(1) : 0,
      totalAttendees: uniqueAttendees._count.attendees,
      topSafetyTopics: safetyTopics
    });
  } catch (error) {
    console.error('Error fetching toolbox statistics:', error);
    res.status(500).json({ error: 'Failed to fetch toolbox statistics' });
  }
});

export default router;
