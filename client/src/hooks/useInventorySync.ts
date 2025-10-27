import { useState, useEffect, useCallback } from 'react';
import { localDB } from '../lib/storage/localDB';
import { InventorySyncState, InventoryTransaction } from '../types/inventory';

export const useInventorySync = () => {
  const [syncState, setSyncState] = useState<InventorySyncState>({
    pendingChanges: 0,
    lastSync: null,
    isSyncing: false,
    syncError: null
  });

  // Check for pending transactions periodically
  useEffect(() => {
    const checkPendingChanges = async () => {
      try {
        const pendingTransactions = await localDB.getPendingTransactions();
        setSyncState(prev => ({
          ...prev,
          pendingChanges: pendingTransactions.length
        }));
      } catch (error) {
        console.error('Error checking pending changes:', error);
      }
    };

    checkPendingChanges();
    
    // Check every 30 seconds
    const interval = setInterval(checkPendingChanges, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = useCallback(async (): Promise<boolean> => {
    if (syncState.isSyncing) return false;

    setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      const pendingTransactions = await localDB.getPendingTransactions();
      
      if (pendingTransactions.length === 0) {
        setSyncState(prev => ({
          ...prev,
          isSyncing: false,
          lastSync: new Date()
        }));
        return true;
      }

      // In a real implementation, this would send transactions to a backend API
      // For now, we'll simulate successful sync by marking transactions as synced
      for (const transaction of pendingTransactions) {
        await localDB.markTransactionAsSynced(transaction.id);
      }

      setSyncState({
        pendingChanges: 0,
        lastSync: new Date(),
        isSyncing: false,
        syncError: null
      });

      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed'
      }));
      return false;
    }
  }, [syncState.isSyncing]);

  // Auto-sync when online and there are pending changes
  useEffect(() => {
    const handleOnline = () => {
      if (syncState.pendingChanges > 0 && !syncState.isSyncing) {
        triggerSync();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncState.pendingChanges, syncState.isSyncing, triggerSync]);

  return {
    syncState,
    triggerSync
  };
};
