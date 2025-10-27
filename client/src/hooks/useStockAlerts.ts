import { useState, useEffect, useCallback } from 'react';
import { localDB } from '../lib/storage/localDB';
import { StockAlert, InventoryItem } from '../types/inventory';

export const useStockAlerts = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);

  const checkAlerts = useCallback(async () => {
    try {
      const items = await localDB.getAllInventoryItems();
      const activeItems = items.filter(item => item.isActive);
      
      const newAlerts: StockAlert[] = [];

      for (const item of activeItems) {
        // Check if item needs an alert
        if (item.quantity === 0) {
          // Critical alert - out of stock
          newAlerts.push({
            id: `alert-${item.id}-critical`,
            itemId: item.id,
            itemName: item.name,
            currentQuantity: item.quantity,
            reorderLevel: item.reorderLevel,
            severity: 'critical',
            createdAt: new Date(),
            resolved: false
          });
        } else if (item.quantity <= item.reorderLevel) {
          // Low stock alert
          newAlerts.push({
            id: `alert-${item.id}-low`,
            itemId: item.id,
            itemName: item.name,
            currentQuantity: item.quantity,
            reorderLevel: item.reorderLevel,
            severity: 'low',
            createdAt: new Date(),
            resolved: false
          });
        }
      }

      // Get existing alerts from database
      const existingAlerts = await localDB.getActiveAlerts();
      
      // Update database with new alerts
      for (const alert of newAlerts) {
        const existingAlert = existingAlerts.find(a => a.itemId === alert.itemId && a.severity === alert.severity);
        
        if (!existingAlert) {
          // Create new alert
          await localDB.addStockAlert(alert);
        } else {
          // Update existing alert timestamp
          await localDB.updateInventoryItem(existingAlert.id, { createdAt: new Date() });
        }
      }

      // Resolve alerts that are no longer applicable
      for (const existingAlert of existingAlerts) {
        const item = activeItems.find(i => i.id === existingAlert.itemId);
        const shouldResolve = !item || 
          (existingAlert.severity === 'critical' && item.quantity > 0) ||
          (existingAlert.severity === 'low' && item.quantity > item.reorderLevel);

        if (shouldResolve) {
          await localDB.markAlertAsResolved(existingAlert.id);
        }
      }

      // Update local state with current alerts
      const currentAlerts = await localDB.getActiveAlerts();
      setAlerts(currentAlerts);

    } catch (error) {
      console.error('Error checking stock alerts:', error);
    }
  }, []);

  // Check alerts when component mounts
  useEffect(() => {
    checkAlerts();
  }, [checkAlerts]);

  // Check alerts periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(checkAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAlerts]);

  // Check alerts when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      checkAlerts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkAlerts]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await localDB.markAlertAsResolved(alertId);
      await checkAlerts(); // Refresh alerts
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  }, [checkAlerts]);

  const getAlertSummary = useCallback(() => {
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    const lowAlerts = alerts.filter(alert => alert.severity === 'low');

    return {
      total: alerts.length,
      critical: criticalAlerts.length,
      low: lowAlerts.length,
      hasCritical: criticalAlerts.length > 0,
      hasAlerts: alerts.length > 0
    };
  }, [alerts]);

  return {
    alerts,
    checkAlerts,
    resolveAlert,
    getAlertSummary
  };
};
