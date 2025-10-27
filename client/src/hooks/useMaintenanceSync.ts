import { useState, useEffect, useCallback } from 'react';
import { MaintenanceTask, PredictiveAnalysis, MaintenanceSyncState } from '../types/maintenance';
import { addToSyncQueue, processSyncQueue } from '../utils/syncUtils';

interface UseMaintenanceSyncReturn {
  syncState: MaintenanceSyncState;
  syncMaintenanceData: () => Promise<void>;
  queueMaintenanceUpdate: (task: MaintenanceTask) => Promise<void>;
  queueAnalysisUpdate: (analysis: PredictiveAnalysis) => Promise<void>;
  retryFailedSyncs: () => Promise<void>;
  clearSyncErrors: () => void;
}

// Local storage keys for maintenance data
const MAINTENANCE_TASKS_KEY = 'mbarie-maintenance-tasks';
const MAINTENANCE_ANALYSES_KEY = 'mbarie-maintenance-analyses';

// Helper functions for local storage
const getLocalMaintenanceTasks = (): MaintenanceTask[] => {
  try {
    const tasks = localStorage.getItem(MAINTENANCE_TASKS_KEY);
    return tasks ? JSON.parse(tasks) : [];
  } catch (error) {
    console.error('Error reading maintenance tasks:', error);
    return [];
  }
};

const setLocalMaintenanceTasks = (tasks: MaintenanceTask[]): void => {
  try {
    localStorage.setItem(MAINTENANCE_TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving maintenance tasks:', error);
  }
};

const getLocalMaintenanceAnalyses = (): PredictiveAnalysis[] => {
  try {
    const analyses = localStorage.getItem(MAINTENANCE_ANALYSES_KEY);
    return analyses ? JSON.parse(analyses) : [];
  } catch (error) {
    console.error('Error reading maintenance analyses:', error);
    return [];
  }
};

const setLocalMaintenanceAnalyses = (analyses: PredictiveAnalysis[]): void => {
  try {
    localStorage.setItem(MAINTENANCE_ANALYSES_KEY, JSON.stringify(analyses));
  } catch (error) {
    console.error('Error saving maintenance analyses:', error);
  }
};

export const useMaintenanceSync = (): UseMaintenanceSyncReturn => {
  const [syncState, setSyncState] = useState<MaintenanceSyncState>({
    pendingTasks: 0,
    pendingAlerts: 0,
    lastSync: null,
    isSyncing: false,
    syncError: null
  });

  // Initialize sync state from local storage
  useEffect(() => {
    const initializeSyncState = () => {
      try {
        const pendingTasks = getLocalMaintenanceTasks().filter(task => !task.synced);
        const pendingAnalyses = getLocalMaintenanceAnalyses();
        
        setSyncState(prev => ({
          ...prev,
          pendingTasks: pendingTasks.length,
          pendingAlerts: pendingAnalyses.length
        }));
      } catch (error) {
        console.error('Failed to initialize maintenance sync state:', error);
      }
    };

    initializeSyncState();
  }, []);

  // Sync all maintenance data with backend
  const syncMaintenanceData = useCallback(async (): Promise<void> => {
    if (syncState.isSyncing) return;

    setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      // Sync pending tasks using sync queue
      const pendingTasks = getLocalMaintenanceTasks().filter(task => !task.synced);
      let syncedTasks = 0;

      for (const task of pendingTasks) {
        try {
          addToSyncQueue({
            type: 'maintenance',
            data: task,
            endpoint: '/api/maintenance/tasks',
            method: 'POST'
          });
          syncedTasks++;
        } catch (error) {
          console.error(`Failed to queue task ${task.id}:`, error);
        }
      }

      // Sync pending analyses
      const pendingAnalyses = getLocalMaintenanceAnalyses();
      let syncedAlerts = 0;

      for (const analysis of pendingAnalyses) {
        try {
          addToSyncQueue({
            type: 'maintenance',
            data: analysis,
            endpoint: '/api/maintenance/analyses',
            method: 'POST'
          });
          syncedAlerts++;
        } catch (error) {
          console.error(`Failed to queue analysis for ${analysis.equipmentId}:`, error);
        }
      }

      // Process sync queue
      await processSyncQueue();

      // Update local storage to mark items as synced
      if (syncedTasks > 0) {
        const allTasks = getLocalMaintenanceTasks();
        const updatedTasks = allTasks.map(task => ({
          ...task,
          synced: true
        }));
        setLocalMaintenanceTasks(updatedTasks);
      }

      // Clear analyses after sync
      if (syncedAlerts > 0) {
        setLocalMaintenanceAnalyses([]);
      }

      // Update sync state
      const remainingTasks = pendingTasks.length - syncedTasks;
      const remainingAlerts = pendingAnalyses.length - syncedAlerts;

      setSyncState({
        pendingTasks: remainingTasks,
        pendingAlerts: remainingAlerts,
        lastSync: new Date(),
        isSyncing: false,
        syncError: null
      });

      // Trigger sync event for other components
      window.dispatchEvent(new CustomEvent('maintenanceDataSynced', {
        detail: { syncedTasks, syncedAlerts }
      }));

    } catch (error) {
      console.error('Maintenance sync failed:', error);
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  }, [syncState.isSyncing]);

  // Queue maintenance task for sync
  const queueMaintenanceUpdate = useCallback(async (task: MaintenanceTask): Promise<void> => {
    try {
      const tasks = getLocalMaintenanceTasks();
      const updatedTasks = [...tasks, { ...task, synced: false }];
      setLocalMaintenanceTasks(updatedTasks);
      
      setSyncState(prev => ({
        ...prev,
        pendingTasks: prev.pendingTasks + 1
      }));

      // Auto-sync if online
      if (navigator.onLine) {
        setTimeout(() => syncMaintenanceData(), 1000);
      }
    } catch (error) {
      console.error('Failed to queue maintenance update:', error);
      throw error;
    }
  }, [syncMaintenanceData]);

  // Queue predictive analysis for sync
  const queueAnalysisUpdate = useCallback(async (analysis: PredictiveAnalysis): Promise<void> => {
    try {
      const analyses = getLocalMaintenanceAnalyses();
      const updatedAnalyses = [...analyses, analysis];
      setLocalMaintenanceAnalyses(updatedAnalyses);
      
      setSyncState(prev => ({
        ...prev,
        pendingAlerts: prev.pendingAlerts + 1
      }));

      // Auto-sync if online for critical alerts
      if (navigator.onLine && analysis.riskLevel === 'critical') {
        setTimeout(() => syncMaintenanceData(), 500);
      }
    } catch (error) {
      console.error('Failed to queue analysis update:', error);
      throw error;
    }
  }, [syncMaintenanceData]);

  // Retry failed sync operations
  const retryFailedSyncs = useCallback(async (): Promise<void> => {
    await syncMaintenanceData();
  }, [syncMaintenanceData]);

  // Clear sync errors
  const clearSyncErrors = useCallback((): void => {
    setSyncState(prev => ({ ...prev, syncError: null }));
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    const handleOnline = () => {
      if (syncState.pendingTasks > 0 || syncState.pendingAlerts > 0) {
        setTimeout(() => syncMaintenanceData(), 2000);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncState.pendingTasks, syncState.pendingAlerts, syncMaintenanceData]);

  // Periodic sync for critical data
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (navigator.onLine && (syncState.pendingTasks > 0 || syncState.pendingAlerts > 0)) {
        syncMaintenanceData();
      }
    }, 60000); // Sync every minute when online

    return () => clearInterval(syncInterval);
  }, [syncMaintenanceData, syncState.pendingTasks, syncState.pendingAlerts]);

  return {
    syncState,
    syncMaintenanceData,
    queueMaintenanceUpdate,
    queueAnalysisUpdate,
    retryFailedSyncs,
    clearSyncErrors
  };
};
