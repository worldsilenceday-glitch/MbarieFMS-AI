import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all reports
router.get('/', async (req, res) => {
  try {
    const { type, period } = req.query;

    const where: any = {};
    if (type) where.type = type as string;
    if (period) where.period = period as string;

    const reports = await prisma.report.findMany({
      where,
      orderBy: {
        generatedAt: 'desc'
      }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get report by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Generate daily report data
router.get('/data/daily', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const startDate = new Date(date as string);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    // Get daily statistics
    const totalAccessLogs = await prisma.accessLog.count({
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    const totalClockIns = await prisma.clockIn.count({
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    const totalToolboxMeetings = await prisma.toolboxMeeting.count({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    });

    // Get alerts for the day
    const alerts = await prisma.alert.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
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

    // Get facility-wise breakdown
    const facilityStats = await prisma.accessLog.groupBy({
      by: ['facility'],
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate
        }
      },
      _count: {
        id: true
      }
    });

    res.json({
      date: date,
      summary: {
        totalAccessLogs,
        totalClockIns,
        totalToolboxMeetings,
        activeUsers,
        alertsCount: alerts.length
      },
      facilityStats,
      alerts
    });
  } catch (error) {
    console.error('Error generating daily report data:', error);
    res.status(500).json({ error: 'Failed to generate daily report data' });
  }
});

// Create new report
router.post('/', async (req, res) => {
  try {
    const { type, period, data, sentTo } = req.body;

    const report = await prisma.report.create({
      data: {
        type,
        period,
        data,
        sentTo
      }
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

export default router;
