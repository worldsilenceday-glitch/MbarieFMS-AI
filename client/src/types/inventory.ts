export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  supplier: string;
  lastUpdated: Date;
  location?: string;
  notes?: string;
  costPerUnit?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  performedBy: string;
  timestamp: Date;
  synced: boolean;
}

export interface StockAlert {
  id: string;
  itemId: string;
  itemName: string;
  currentQuantity: number;
  reorderLevel: number;
  severity: 'low' | 'critical' | 'out-of-stock';
  createdAt: Date;
  resolved: boolean;
}

export interface InventorySyncState {
  pendingChanges: number;
  lastSync: Date | null;
  isSyncing: boolean;
  syncError: string | null;
}

export interface VoiceInventoryCommand {
  intent: 'add' | 'query' | 'update' | 'list' | 'alert';
  item?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  action?: string;
}

export interface AIInventoryResponse {
  success: boolean;
  message: string;
  data?: any;
  action?: string;
}
