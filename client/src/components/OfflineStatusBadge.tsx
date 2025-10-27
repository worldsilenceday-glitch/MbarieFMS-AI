import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useOfflineAgent } from '../hooks/useOfflineAgent';

export default function OfflineStatusBadge() {
  const { isOffline, syncStats, lastSync, triggerSync, clearSyncQueue } = useOfflineAgent();

  const getStatusColor = () => {
    if (isOffline) return 'bg-red-500 text-white';
    if (syncStats.total > 0) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getStatusIcon = () => {
    if (isOffline) return <WifiOff className="w-4 h-4" />;
    if (syncStats.total > 0) return <RefreshCw className="w-4 h-4 animate-spin" />;
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isOffline) return 'Offline Mode';
    if (syncStats.total > 0) return `Syncing (${syncStats.total})`;
    return 'Connected';
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return lastSync.toLocaleDateString();
  };

  const handleSyncClick = async () => {
    if (isOffline) return;
    await triggerSync();
  };

  const handleClearQueue = () => {
    if (syncStats.total > 0) {
      if (window.confirm('Clear all pending sync items? This cannot be undone.')) {
        clearSyncQueue();
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        
        {/* Sync Stats Popup */}
        <div className="group relative">
          <button className="opacity-80 hover:opacity-100 transition-opacity">
            <AlertCircle className="w-4 h-4" />
          </button>
          
          <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="text-sm text-gray-900 dark:text-white">
              <div className="font-semibold mb-2">Sync Status</div>
              
              {/* Connection Status */}
              <div className="flex items-center justify-between mb-2">
                <span>Connection:</span>
                <span className={`flex items-center gap-1 ${isOffline ? 'text-red-500' : 'text-green-500'}`}>
                  {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>
              
              {/* Last Sync */}
              <div className="flex items-center justify-between mb-2">
                <span>Last Sync:</span>
                <span className="text-gray-600 dark:text-gray-400 text-xs">
                  {formatLastSync()}
                </span>
              </div>
              
              {/* Pending Items */}
              {syncStats.total > 0 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                    <div className="font-medium mb-1">Pending Sync:</div>
                    {Object.entries(syncStats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{type}:</span>
                        <span className="text-yellow-600 dark:text-yellow-400">{count}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSyncClick}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded transition-colors"
                    >
                      Sync Now
                    </button>
                    <button
                      onClick={handleClearQueue}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
              
              {/* All Synced */}
              {syncStats.total === 0 && !isOffline && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  All data synced
                </div>
              )}
              
              {/* Offline Tips */}
              {isOffline && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Offline Mode:</strong> Some features limited. Actions will sync when back online.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Progress Bar (when syncing) */}
      {syncStats.total > 0 && !isOffline && (
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            className="bg-yellow-500 h-1 rounded-full transition-all duration-1000"
            style={{ 
              width: `${Math.min(90, (syncStats.total / 10) * 100)}%` 
            }}
          ></div>
        </div>
      )}

      {/* Connection Status Toast */}
      {!isOffline && syncStats.total === 0 && lastSync && (
        <div className="mt-2 px-3 py-2 bg-green-500 text-white text-sm rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>All data synced</span>
          </div>
        </div>
      )}
    </div>
  );
}
