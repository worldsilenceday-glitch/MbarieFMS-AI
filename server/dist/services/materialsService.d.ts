export declare class MaterialsService {
    /**
     * Get inventory summary
     */
    static getInventorySummary(): Promise<{
        totalItems: number;
        lowStockItems: number;
        outOfStockItems: number;
        materials: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            sku: string;
            qty: number;
            location: string | null;
            minLevel: number | null;
            reorderLevel: number | null;
        }[];
    }>;
    /**
     * Get materials that need reordering
     */
    static getReorderItems(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        sku: string;
        qty: number;
        location: string | null;
        minLevel: number | null;
        reorderLevel: number | null;
    }[]>;
    /**
     * Update material quantity
     */
    static updateMaterialQuantity(materialId: string, newQty: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        sku: string;
        qty: number;
        location: string | null;
        minLevel: number | null;
        reorderLevel: number | null;
    }>;
    /**
     * Process material transfer
     */
    static processTransfer(transferId: string, status: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        qty: number;
        materialId: string;
        fromLocation: string;
        toLocation: string;
        requestedById: string | null;
    }>;
    /**
     * Get transfer history for a material
     */
    static getMaterialTransferHistory(materialId: string): Promise<({
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        qty: number;
        materialId: string;
        fromLocation: string;
        toLocation: string;
        requestedById: string | null;
    })[]>;
    /**
     * Create multiple material transfers (picklist)
     */
    static createPicklistTransfers(items: any[], requestedById: string, destination: string): Promise<({
        material: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            sku: string;
            qty: number;
            location: string | null;
            minLevel: number | null;
            reorderLevel: number | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        qty: number;
        materialId: string;
        fromLocation: string;
        toLocation: string;
        requestedById: string | null;
    })[]>;
    /**
     * Get materials by location
     */
    static getMaterialsByLocation(location: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        sku: string;
        qty: number;
        location: string | null;
        minLevel: number | null;
        reorderLevel: number | null;
    }[]>;
    /**
     * Search materials by SKU or description
     */
    static searchMaterials(query: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        sku: string;
        qty: number;
        location: string | null;
        minLevel: number | null;
        reorderLevel: number | null;
    }[]>;
}
//# sourceMappingURL=materialsService.d.ts.map