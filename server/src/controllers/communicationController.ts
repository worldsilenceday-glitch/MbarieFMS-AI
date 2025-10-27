import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

interface CommunicationLogsQuery {
  userId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

/**
 * GET /api/communication/logs
 * Fetch communication logs with filtering and pagination
 */
export const getCommunicationLogs = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      type,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    }: CommunicationLogsQuery = req.query;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Parse pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.communicationLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            jobTitle: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.communicationLog.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      logs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Error fetching communication logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch communication logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /api/communication/logs/:id
 * Get specific communication log by ID
 */
export const getCommunicationLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const log = await prisma.communicationLog.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Communication log not found' });
    }

    res.json(log);

  } catch (error) {
    console.error('Error fetching communication log:', error);
    res.status(500).json({ 
      error: 'Failed to fetch communication log',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /api/communication/stats
 * Get communication statistics
 */
export const getCommunicationStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Get counts by type
    const typeCounts = await prisma.communicationLog.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true
      }
    });

    // Get counts by role
    const roleCounts = await prisma.communicationLog.groupBy({
      by: ['role'],
      where,
      _count: {
        id: true
      }
    });

    // Get email sent stats
    const emailStats = await prisma.communicationLog.groupBy({
      by: ['emailSent'],
      where: {
        ...where,
        type: 'email_draft'
      },
      _count: {
        id: true
      }
    });

    // Get recent activity
    const recentActivity = await prisma.communicationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      typeCounts,
      roleCounts,
      emailStats,
      recentActivity,
      totalCount: await prisma.communicationLog.count({ where })
    });

  } catch (error) {
    console.error('Error fetching communication stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch communication statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
