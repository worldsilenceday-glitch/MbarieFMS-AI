import React, { useState, useEffect } from 'react';
import { InventoryTable } from '../components/InventoryTable';
import { VoiceInventoryControls } from '../components/VoiceInventoryControls';
import { AddInventoryItemForm } from '../components/AddInventoryItemForm';
import { StockAlertBadge } from '../components/StockAlertBadge';
import { localDB } from '../lib/storage/localDB';
import { inventoryAI } from '../lib/ai/inventoryAI';
import { useInventorySync } from '../hooks/useInventorySync';
import { useStockAlerts } from '../hooks/useStockAlerts';
import { InventoryItem, AIInventoryResponse, StockAlert } from '../types/inventory';

export const StoreDashboard: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [commandResult, setCommandResult] = useState<AIInventoryResponse | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<StockAlert[]>([]);

  // Initialize sync and alert hooks
  const { syncState, triggerSync } = useInventorySync();
  const { alerts, checkAlerts } = useStockAlerts();

  useEffect(() => {
    initializeDatabase();
  }, []);

  useEffect(() => {
    setActiveAlerts(alerts);
  }, [alerts]);

  const initializeDatabase = async () => {
    try {
      await localDB.init();
      await loadItems();
      await checkAlerts();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const allItems = await localDB.getAllInventoryItems();
      setItems(allItems);
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const handleAddItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const itemId = await localDB.addInventoryItem(itemData);
      
      // Add transaction
      await localDB.addTransaction({
        itemId,
        type: 'in',
        quantity: itemData.quantity,
        previousQuantity: 0,
        newQuantity: itemData.quantity,
        reason: 'Manual addition',
        performedBy: 'Storekeeper',
        timestamp: new Date(),
        synced: false
      });

      await loadItems();
      await checkAlerts();
      setShowAddForm(false);
      
      setCommandResult({
        success: true,
        message: `Successfully added ${itemData.name} to inventory.`
      });
    } catch (error) {
      console.error('Failed to add item:', error);
      setCommandResult({
        success: false,
        message: 'Failed to add item to inventory.'
      });
    }
  };

  const handleEditItem = async (itemId: string, updates: Partial<InventoryItem>) => {
    try {
      await localDB.updateInventoryItem(itemId, updates);
      
      // Add transaction for quantity changes
      if (updates.quantity !== undefined) {
        const item = items.find(i => i.id === itemId);
        if (item) {
          await localDB.addTransaction({
            itemId,
            type: 'adjustment',
            quantity: updates.quantity - item.quantity,
            previousQuantity: item.quantity,
            newQuantity: updates.quantity,
            reason: 'Manual adjustment',
            performedBy: 'Storekeeper',
            timestamp: new Date(),
            synced: false
          });
        }
      }

      await loadItems();
      await checkAlerts();
      setEditingItem(null);
      
      setCommandResult({
        success: true,
        message: 'Item updated successfully.'
      });
    } catch (error) {
      console.error('Failed to update item:', error);
      setCommandResult({
        success: false,
        message: 'Failed to update item.'
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await localDB.updateInventoryItem(itemId, { isActive: false });
      await loadItems();
      await checkAlerts();
      
      setCommandResult({
        success: true,
        message: 'Item deleted successfully.'
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
      setCommandResult({
        success: false,
        message: 'Failed to delete item.'
      });
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      await localDB.updateInventoryItem(itemId, { 
        quantity: newQuantity,
        lastUpdated: new Date()
      });

      // Add transaction
      await localDB.addTransaction({
        itemId,
        type: newQuantity > item.quantity ? 'in' : 'out',
        quantity: Math.abs(newQuantity - item.quantity),
        previousQuantity: item.quantity,
        newQuantity,
        reason: 'Quick adjustment',
        performedBy: 'Storekeeper',
        timestamp: new Date(),
        synced: false
      });

      await loadItems();
      await checkAlerts();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleVoiceCommandResult = (result: AIInventoryResponse) => {
    setCommandResult(result);
    if (result.success) {
      // Reload items if the command was successful
      loadItems();
      checkAlerts();
    }
  };

  const handleManualSync = async () => {
    await triggerSync();
    await loadItems();
    await checkAlerts();
  };

  const getDashboardStats = () => {
    const activeItems = items.filter(item => item.isActive);
    const totalItems = activeItems.length;
    const lowStockItems = activeItems.filter(item => item.quantity <= item.reorderLevel && item.quantity > 0);
    const outOfStockItems = activeItems.filter(item => item.quantity === 0);
    const totalValue = activeItems.reduce((sum, item) => 
      sum + (item.quantity * (item.costPerUnit || 0)), 0
    );

    return {
      totalItems,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
      totalValue
    };
  };

  const stats = getDashboardStats();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Storekeeper Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Manage inventory, track stock levels, and use voice commands for quick updates.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <StockAlertBadge alerts={activeAlerts} />
              <button
                onClick={handleManualSync}
                disabled={syncState.isSyncing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>
                  {syncState.isSyncing ? 'Syncing...' : 
                   syncState.pendingChanges > 0 ? `Sync (${syncState.pendingChanges})` : 'Sync'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.lowStockItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.outOfStockItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Controls and Command Result */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <VoiceInventoryControls onCommandResult={handleVoiceCommandResult} />
          </div>
          <div className="lg:col-span-1">
            {commandResult && (
              <div className={`p-4 rounded-lg border ${
                commandResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  {commandResult.success ? (
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className="font-medium">{commandResult.success ? 'Success' : 'Error'}</span>
                </div>
                <p className="mt-2 text-sm">{commandResult.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Item Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Item</span>
          </button>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingItem) && (
          <div className="mb-6">
            <AddInventoryItemForm
              item={editingItem || undefined}
              onSubmit={editingItem ? 
                (data) => handleEditItem(editingItem.id, data) : 
                handleAddItem
              }
              onCancel={() => {
                setShowAddForm(false);
                setEditingItem(null);
              }}
            />
          </div>
        )}

        {/* Inventory Table */}
        <InventoryTable
          items={items}
          onEditItem={setEditingItem}
          onDeleteItem={handleDeleteItem}
          onUpdateQuantity={handleUpdateQuantity}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
