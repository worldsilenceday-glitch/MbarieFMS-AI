import React from 'react';
import { StockAlert } from '../types/inventory';

interface StockAlertBadgeProps {
  alerts: StockAlert[];
}

export const StockAlertBadge: React.FC<StockAlertBadgeProps> = ({ alerts }) => {
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const lowAlerts = alerts.filter(alert => alert.severity === 'low');

  if (alerts.length === 0) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        All Stock OK
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {criticalAlerts.length > 0 ? (
          <span>
            {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? 's' : ''}
          </span>
        ) : (
          <span>
            {lowAlerts.length} Low Stock Alert{lowAlerts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {/* Alert Details Popover */}
      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10 hidden group-hover:block">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Stock Alerts</h3>
          
          {criticalAlerts.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-red-600 mb-2">Critical Alerts</h4>
              <div className="space-y-2">
                {criticalAlerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{alert.itemName}</span>
                    <span className="text-red-600 font-medium">
                      {alert.currentQuantity} left (Reorder: {alert.reorderLevel})
                    </span>
                  </div>
                ))}
                {criticalAlerts.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{criticalAlerts.length - 3} more critical items
                  </div>
                )}
              </div>
            </div>
          )}
          
          {lowAlerts.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-yellow-600 mb-2">Low Stock</h4>
              <div className="space-y-2">
                {lowAlerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{alert.itemName}</span>
                    <span className="text-yellow-600">
                      {alert.currentQuantity} left (Reorder: {alert.reorderLevel})
                    </span>
                  </div>
                ))}
                {lowAlerts.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{lowAlerts.length - 3} more low stock items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
