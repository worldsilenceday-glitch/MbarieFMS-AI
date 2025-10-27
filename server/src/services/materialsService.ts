import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MaterialsService {
  /**
   * Get inventory summary
   */
  static async getInventorySummary() {
    try {
      const materials = await prisma.material.findMany({
        orderBy: {
          sku: 'asc'
        }
      });

      const totalItems = materials.length;
      const lowStockItems = materials.filter(material => 
        material.minLevel && material.qty <= material.minLevel
      ).length;
      const outOfStockItems = materials.filter(material => material.qty === 0).length;

      return {
        totalItems,
        lowStockItems,
        outOfStockItems,
        materials
      };
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      throw error;
    }
  }

  /**
   * Get materials that need reordering
   */
  static async getReorderItems() {
    try {
      const materials = await prisma.material.findMany({
        where: {
          OR: [
            { qty: 0 },
            {
              AND: [
                { reorderLevel: { not: null } },
                { qty: { lte: prisma.material.fields.reorderLevel } }
              ]
            }
          ]
        },
        orderBy: {
          qty: 'asc'
        }
      });

      return materials;
    } catch (error) {
      console.error('Error fetching reorder items:', error);
      throw error;
    }
  }

  /**
   * Update material quantity
   */
  static async updateMaterialQuantity(materialId: string, newQty: number) {
    try {
      const material = await prisma.material.update({
        where: { id: materialId },
        data: { qty: newQty }
      });

      return material;
    } catch (error) {
      console.error('Error updating material quantity:', error);
      throw error;
    }
  }

  /**
   * Process material transfer
   */
  static async processTransfer(transferId: string, status: string) {
    try {
      const transfer = await prisma.materialTransfer.findUnique({
        where: { id: transferId },
        include: {
          material: true
        }
      });

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      // Update transfer status
      const updatedTransfer = await prisma.materialTransfer.update({
        where: { id: transferId },
        data: { status }
      });

      // If transfer is delivered, update material location and quantity
      if (status === 'delivered') {
        await prisma.material.update({
          where: { id: transfer.materialId },
          data: {
            location: transfer.toLocation,
            qty: transfer.material.qty - transfer.qty
          }
        });
      }

      return updatedTransfer;
    } catch (error) {
      console.error('Error processing transfer:', error);
      throw error;
    }
  }

  /**
   * Get transfer history for a material
   */
  static async getMaterialTransferHistory(materialId: string) {
    try {
      const transfers = await prisma.materialTransfer.findMany({
        where: { materialId },
        include: {
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

      return transfers;
    } catch (error) {
      console.error('Error fetching transfer history:', error);
      throw error;
    }
  }

  /**
   * Create multiple material transfers (picklist)
   */
  static async createPicklistTransfers(items: any[], requestedById: string, destination: string) {
    try {
      const transfers = [];

      for (const item of items) {
        // Check if material exists and has sufficient quantity
        const material = await prisma.material.findUnique({
          where: { id: item.materialId }
        });

        if (!material) {
          throw new Error(`Material with ID ${item.materialId} not found`);
        }

        if (material.qty < item.qty) {
          throw new Error(`Insufficient quantity for material ${material.sku}`);
        }

        // Create transfer
        const transfer = await prisma.materialTransfer.create({
          data: {
            materialId: item.materialId,
            fromLocation: item.fromLocation || material.location,
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

      return transfers;
    } catch (error) {
      console.error('Error creating picklist transfers:', error);
      throw error;
    }
  }

  /**
   * Get materials by location
   */
  static async getMaterialsByLocation(location: string) {
    try {
      const materials = await prisma.material.findMany({
        where: { location },
        orderBy: {
          sku: 'asc'
        }
      });

      return materials;
    } catch (error) {
      console.error('Error fetching materials by location:', error);
      throw error;
    }
  }

  /**
   * Search materials by SKU or description
   */
  static async searchMaterials(query: string) {
    try {
      const materials = await prisma.material.findMany({
        where: {
          OR: [
            { sku: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        orderBy: {
          sku: 'asc'
        }
      });

      return materials;
    } catch (error) {
      console.error('Error searching materials:', error);
      throw error;
    }
  }
}
