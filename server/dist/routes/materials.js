"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// GET /api/materials - Get all materials inventory
router.get('/', async (req, res) => {
    try {
        const materials = await prisma.material.findMany({
            orderBy: {
                sku: 'asc'
            }
        });
        res.json({
            success: true,
            data: materials
        });
    }
    catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch materials'
        });
    }
});
// GET /api/materials/transfers - Get all material transfers
router.get('/transfers', async (req, res) => {
    try {
        const transfers = await prisma.materialTransfer.findMany({
            include: {
                material: true,
                requestedBy: {
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
            data: transfers
        });
    }
    catch (error) {
        console.error('Error fetching material transfers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch material transfers'
        });
    }
});
// POST /api/materials - Create new material
router.post('/', async (req, res) => {
    try {
        const { sku, description, qty, location, minLevel, reorderLevel } = req.body;
        if (!sku) {
            return res.status(400).json({
                success: false,
                error: 'SKU is required'
            });
        }
        const material = await prisma.material.create({
            data: {
                sku,
                description,
                qty: qty || 0,
                location,
                minLevel,
                reorderLevel
            }
        });
        res.json({
            success: true,
            data: material
        });
    }
    catch (error) {
        console.error('Error creating material:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create material'
        });
    }
});
// POST /api/materials/transfer - Create material transfer
router.post('/transfer', async (req, res) => {
    try {
        const { materialId, fromLocation, toLocation, qty, requestedById } = req.body;
        if (!materialId || !fromLocation || !toLocation || !qty) {
            return res.status(400).json({
                success: false,
                error: 'Material ID, from location, to location, and quantity are required'
            });
        }
        // Check if material exists and has sufficient quantity
        const material = await prisma.material.findUnique({
            where: { id: materialId }
        });
        if (!material) {
            return res.status(404).json({
                success: false,
                error: 'Material not found'
            });
        }
        if (material.qty < qty) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient quantity available'
            });
        }
        // Create transfer
        const transfer = await prisma.materialTransfer.create({
            data: {
                materialId,
                fromLocation,
                toLocation,
                qty,
                requestedById,
                status: 'requested'
            },
            include: {
                material: true,
                requestedBy: {
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
            data: transfer
        });
    }
    catch (error) {
        console.error('Error creating material transfer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create material transfer'
        });
    }
});
// POST /api/materials/picklist - Create picklist
router.post('/picklist', async (req, res) => {
    try {
        const { items, requestedById, destination } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Items array is required and must not be empty'
            });
        }
        // Validate all items have sufficient quantity
        for (const item of items) {
            const material = await prisma.material.findUnique({
                where: { id: item.materialId }
            });
            if (!material) {
                return res.status(404).json({
                    success: false,
                    error: `Material with ID ${item.materialId} not found`
                });
            }
            if (material.qty < item.qty) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient quantity for material ${material.sku}`
                });
            }
        }
        // Create transfers for each item
        const transfers = [];
        for (const item of items) {
            const transfer = await prisma.materialTransfer.create({
                data: {
                    materialId: item.materialId,
                    fromLocation: item.fromLocation,
                    toLocation: destination,
                    qty: item.qty,
                    requestedById,
                    status: 'requested'
                },
                include: {
                    material: true
                }
            });
            transfers.push(transfer);
        }
        res.json({
            success: true,
            data: {
                picklistId: `PICK-${Date.now()}`,
                items: transfers,
                destination,
                requestedById,
                createdAt: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error creating picklist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create picklist'
        });
    }
});
// PUT /api/materials/:id - Update material quantity
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { qty, location } = req.body;
        const material = await prisma.material.update({
            where: { id },
            data: {
                ...(qty !== undefined && { qty }),
                ...(location !== undefined && { location })
            }
        });
        res.json({
            success: true,
            data: material
        });
    }
    catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update material'
        });
    }
});
exports.default = router;
//# sourceMappingURL=materials.js.map