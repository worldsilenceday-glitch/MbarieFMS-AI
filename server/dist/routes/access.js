"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Log access (fingerprint entry/exit)
router.post('/log', async (req, res) => {
    try {
        const { userId, facility, zone, direction, method = 'fingerprint' } = req.body;
        const accessLog = await prisma.accessLog.create({
            data: {
                userId,
                facility,
                zone,
                direction,
                method
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
        res.status(201).json(accessLog);
    }
    catch (error) {
        console.error('Error logging access:', error);
        res.status(500).json({ error: 'Failed to log access' });
    }
});
// Clock in/out
router.post('/clock', async (req, res) => {
    try {
        const { userId, facility, type, notes } = req.body;
        const clockIn = await prisma.clockIn.create({
            data: {
                userId,
                facility,
                type,
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
        res.status(201).json(clockIn);
    }
    catch (error) {
        console.error('Error logging clock in/out:', error);
        res.status(500).json({ error: 'Failed to log clock in/out' });
    }
});
// Get access logs with filters
router.get('/logs', async (req, res) => {
    try {
        const { userId, facility, date, direction } = req.query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (facility)
            where.facility = facility;
        if (direction)
            where.direction = direction;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            where.timestamp = {
                gte: startDate,
                lt: endDate
            };
        }
        const logs = await prisma.accessLog.findMany({
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
                timestamp: 'desc'
            }
        });
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching access logs:', error);
        res.status(500).json({ error: 'Failed to fetch access logs' });
    }
});
// Get clock in/out logs with filters
router.get('/clock-logs', async (req, res) => {
    try {
        const { userId, facility, date, type } = req.query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (facility)
            where.facility = facility;
        if (type)
            where.type = type;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            where.timestamp = {
                gte: startDate,
                lt: endDate
            };
        }
        const logs = await prisma.clockIn.findMany({
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
                timestamp: 'desc'
            }
        });
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching clock logs:', error);
        res.status(500).json({ error: 'Failed to fetch clock logs' });
    }
});
exports.default = router;
//# sourceMappingURL=access.js.map