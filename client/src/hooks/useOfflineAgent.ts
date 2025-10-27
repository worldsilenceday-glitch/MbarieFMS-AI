import { useState, useEffect } from "react";
import { getSyncQueueStats, initializeAutoSync, startPeriodicSync } from "../utils/syncUtils";

export const useOfflineAgent = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStats, setSyncStats] = useState(getSyncQueueStats());
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true);
      console.log('App is now offline');
    };

    const goOnline = () => {
      setIsOffline(false);
      setLastSync(new Date());
      console.log('App is now online - sync will start automatically');
    };

    // Set up online/offline event listeners
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // Initialize auto-sync
    initializeAutoSync();

    // Start periodic sync
    const cleanupPeriodicSync = startPeriodicSync();

    // Update sync stats periodically
    const statsInterval = setInterval(() => {
      setSyncStats(getSyncQueueStats());
    }, 5000); // Update every 5 seconds

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      cleanupPeriodicSync();
      clearInterval(statsInterval);
    };
  }, []);

  // Function to manually trigger sync
  const triggerSync = async () => {
    if (!navigator.onLine) {
      console.log('Cannot sync - app is offline');
      return false;
    }

    try {
      console.log('Manual sync triggered');
      const { processSyncQueue } = await import('../utils/syncUtils');
      await processSyncQueue();
      setSyncStats(getSyncQueueStats());
      setLastSync(new Date());
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    }
  };

  // Function to clear sync queue
  const clearSyncQueue = () => {
    try {
      localStorage.removeItem('mbarie-sync-queue');
      setSyncStats(getSyncQueueStats());
      console.log('Sync queue cleared');
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  };

  // Function to get offline status with details
  const getOfflineStatus = () => {
    return {
      isOffline,
      lastSync,
      syncStats,
      connectionType: isOffline ? 'offline' : 'online',
      pendingActions: syncStats.total,
      hasRetries: syncStats.hasRetries
    };
  };

  return { 
    isOffline, 
    syncStats, 
    lastSync,
    triggerSync,
    clearSyncQueue,
    getOfflineStatus
  };
};
