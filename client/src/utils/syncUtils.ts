import { OfflineCache, PendingSyncItem } from '../types/offline';

const CACHE_KEY = 'mbarie-offline-cache';
const SYNC_QUEUE_KEY = 'mbarie-sync-queue';

// Cache management
export const getCachedInsights = async (): Promise<OfflineCache | null> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

export const setCachedInsights = async (insights: any[], recommendations: any[]): Promise<void> => {
  try {
    const cache: OfflineCache = {
      insights,
      recommendations,
      timestamp: new Date().toISOString(),
      summary: `Last updated: ${new Date().toLocaleString()} - ${insights.length} insights, ${recommendations.length} recommendations`
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

export const clearCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Sync queue management
export const getSyncQueue = (): PendingSyncItem[] => {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error reading sync queue:', error);
    return [];
  }
};

export const addToSyncQueue = (item: Omit<PendingSyncItem, 'id' | 'timestamp' | 'retryCount'>): void => {
  try {
    const queue = getSyncQueue();
    const newItem: PendingSyncItem = {
      ...item,
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    
    queue.push(newItem);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    
    console.log('Added to sync queue:', newItem);
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
};

export const removeFromSyncQueue = (id: string): void => {
  try {
    const queue = getSyncQueue();
    const filteredQueue = queue.filter(item => item.id !== id);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('Error removing from sync queue:', error);
  }
};

export const updateSyncQueueItem = (id: string, updates: Partial<PendingSyncItem>): void => {
  try {
    const queue = getSyncQueue();
    const updatedQueue = queue.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error updating sync queue item:', error);
  }
};

// Background sync
export const processSyncQueue = async (): Promise<void> => {
  if (!navigator.onLine) {
    console.log('Offline - skipping sync queue processing');
    return;
  }

  const queue = getSyncQueue();
  if (queue.length === 0) return;

  console.log(`Processing ${queue.length} items from sync queue...`);

  for (const item of queue) {
    try {
      let success = false;

      switch (item.type) {
        case 'action':
          // Process action items
          success = await processActionItem(item.data);
          break;
        
        case 'upload':
          // Process file uploads
          success = await processUploadItem(item.data);
          break;
        
        case 'insight':
          // Process insight updates
          success = await processInsightItem(item.data);
          break;
        
        case 'recommendation':
          // Process recommendation actions
          success = await processRecommendationItem(item.data);
          break;
        
        case 'maintenance':
          // Process maintenance items
          success = await processMaintenanceItem(item.data, item.endpoint, item.method);
          break;
      }

      if (success) {
        removeFromSyncQueue(item.id);
        console.log(`Successfully synced item: ${item.id}`);
      } else {
        // Increment retry count and update
        updateSyncQueueItem(item.id, { 
          retryCount: item.retryCount + 1,
          timestamp: new Date().toISOString()
        });
        
        if (item.retryCount >= 3) {
          // Remove after too many retries
          removeFromSyncQueue(item.id);
          console.warn(`Removed item after ${item.retryCount} failed retries: ${item.id}`);
        }
      }
    } catch (error) {
      console.error(`Error processing sync item ${item.id}:`, error);
      updateSyncQueueItem(item.id, { 
        retryCount: item.retryCount + 1,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Mock processing functions - these would be replaced with actual API calls
const processActionItem = async (data: any): Promise<boolean> => {
  console.log('Processing action item:', data);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return Math.random() > 0.2; // 80% success rate for demo
};

const processUploadItem = async (data: any): Promise<boolean> => {
  console.log('Processing upload item:', data);
  // Simulate file upload
  await new Promise(resolve => setTimeout(resolve, 2000));
  return Math.random() > 0.1; // 90% success rate for demo
};

const processInsightItem = async (data: any): Promise<boolean> => {
  console.log('Processing insight item:', data);
  // Simulate insight update
  await new Promise(resolve => setTimeout(resolve, 500));
  return true; // Always succeed for insights
};

const processRecommendationItem = async (data: any): Promise<boolean> => {
  console.log('Processing recommendation item:', data);
  // Simulate recommendation action
  await new Promise(resolve => setTimeout(resolve, 800));
  return Math.random() > 0.3; // 70% success rate for demo
};

const processMaintenanceItem = async (data: any, endpoint?: string, method?: string): Promise<boolean> => {
  console.log('Processing maintenance item:', data, 'Endpoint:', endpoint, 'Method:', method);
  
  try {
    // Simulate API call to maintenance endpoints
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock different success rates based on endpoint
    if (endpoint?.includes('/tasks')) {
      return Math.random() > 0.1; // 90% success for tasks
    } else if (endpoint?.includes('/analyses')) {
      return Math.random() > 0.05; // 95% success for analyses
    }
    
    return Math.random() > 0.15; // 85% success rate for other maintenance endpoints
  } catch (error) {
    console.error('Error processing maintenance item:', error);
    return false;
  }
};

// Auto-sync when coming online
export const initializeAutoSync = (): void => {
  window.addEventListener('online', () => {
    console.log('Connection restored - starting auto-sync');
    processSyncQueue();
  });
};

// Periodic sync (every 30 seconds when online)
export const startPeriodicSync = (): (() => void) => {
  const interval = setInterval(() => {
    if (navigator.onLine) {
      processSyncQueue();
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
};

// Export queue stats for monitoring
export const getSyncQueueStats = () => {
  const queue = getSyncQueue();
  const byType = queue.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: queue.length,
    byType,
    oldest: queue.length > 0 ? new Date(queue[0].timestamp) : null,
    hasRetries: queue.some(item => item.retryCount > 0)
  };
};
