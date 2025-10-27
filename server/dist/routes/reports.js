"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get all reports
router.get('/', async (req, res) => {
    try {
        const { type, period } = req.query;
        const where = {};
        if (type)
            where.type = type;
        if (period)
            where.period = period;
        const reports = await prisma.report.findMany({
            where,
            orderBy: {
                generatedAt: 'desc'
            }
        });
        res.json(reports);
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});
// Generate daily report data
router.get('/data/daily', async (req, res) => {
    try {
        const { date = new Date().toISOString().split('T')[0] } = req.query;
        const startDate = new Date(date);
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to create report' });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map