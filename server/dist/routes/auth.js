"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
                department: true,
                facility: true
            }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Create new user
router.post('/users', async (req, res) => {
    try {
        const { employeeId, firstName, lastName, email, jobTitle, department, facility } = req.body;
        const user = await prisma.user.create({
            data: {
                employeeId,
                firstName,
                lastName,
                email,
                jobTitle,
                department,
                facility
            }
        });
        res.status(201).json({
            id: user.id,
            employeeId: user.employeeId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            jobTitle: user.jobTitle,
            department: user.department,
            facility: user.facility
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});
// Get user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
                department: true,
                facility: true,
                isActive: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map