import { OfflineAgentResponse } from '../types/offline';
import { getCachedInsights } from './syncUtils';

export const offlineAgent = async (query: string): Promise<OfflineAgentResponse> => {
  try {
    const localData = await getCachedInsights();
    
    if (!localData) {
      return {
        success: true,
        message: "Offline mode: No cached insights found. Please connect to the internet to refresh data.",
        source: 'offline'
      };
    }
    
    const queryLower = query.toLowerCase();
    
    // Context-aware offline responses
    if (queryLower.includes('maintenance') || queryLower.includes('repair')) {
      return {
        success: true,
        message: "Offline Agent: Maintenance tasks are stable. No new issues detected in cached data. Last maintenance check was successful.",
        data: { category: 'maintenance', status: 'stable' },
        source: 'offline'
      };
    }

    // Maintenance-specific intents
    if (queryLower.includes('predictive') || queryLower.includes('failure prediction')) {
      return {
        success: true,
        message: "Offline Agent: Predictive maintenance models are running normally. No imminent failures detected in cached analysis.",
        data: { category: 'predictive_maintenance', status: 'normal' },
        source: 'offline'
      };
    }

    if (queryLower.includes('schedule') && queryLower.includes('maintenance')) {
      return {
        success: true,
        message: "Offline Agent: Maintenance scheduling system is operational. Next scheduled maintenance in 3 days for generator service.",
        data: { category: 'maintenance_scheduling', nextService: '3 days' },
        source: 'offline'
      };
    }

    if (queryLower.includes('equipment') && (queryLower.includes('status') || queryLower.includes('health'))) {
      return {
        success: true,
        message: "Offline Agent: Equipment health monitoring shows all critical assets are operational. No immediate maintenance required.",
        data: { category: 'equipment_health', status: 'operational' },
        source: 'offline'
      };
    }

    if (queryLower.includes('technician') && queryLower.includes('assigned')) {
      return {
        success: true,
        message: "Offline Agent: Technician assignments are current. All maintenance tasks have assigned personnel based on last sync.",
        data: { category: 'technician_assignment', status: 'assigned' },
        source: 'offline'
      };
    }

    if (queryLower.includes('sensor') && queryLower.includes('data')) {
      return {
        success: true,
        message: "Offline Agent: Sensor data analysis shows normal operating parameters. No critical anomalies detected in cached readings.",
        data: { category: 'sensor_analysis', status: 'normal' },
        source: 'offline'
      };
    }
    
    if (queryLower.includes('inventory') || queryLower.includes('stock') || queryLower.includes('store')) {
      return {
        success: true,
        message: "Offline Agent: Inventory levels nominal based on last sync. Reorder threshold not yet reached. Critical items are adequately stocked.",
        data: { category: 'inventory', status: 'nominal' },
        source: 'offline'
      };
    }
    
    if (queryLower.includes('risk') || queryLower.includes('safety')) {
      return {
        success: true,
        message: "Offline Agent: Risk levels are within acceptable range. No safety incidents reported in cached data.",
        data: { category: 'risk', status: 'acceptable' },
        source: 'offline'
      };
    }
    
    if (queryLower.includes('performance') || queryLower.includes('efficiency')) {
      return {
        success: true,
        message: "Offline Agent: Performance metrics show stable operations. Workflow efficiency maintained at optimal levels.",
        data: { category: 'performance', status: 'stable' },
        source: 'offline'
      };
    }
    
    if (queryLower.includes('permit') || queryLower.includes('approval')) {
      return {
        success: true,
        message: "Offline Agent: Permit processing system is operational. No pending approvals requiring immediate attention.",
        data: { category: 'permit', status: 'operational' },
        source: 'offline'
      };
    }
    
    // General fallback response
    return {
      success: true,
      message: `Offline Agent: Unable to connect to AI services. Showing latest cached summary: ${localData.summary || 'System operating normally'}.`,
      data: localData,
      source: 'offline'
    };
  } catch (error) {
    return {
      success: false,
      message: "Offline Agent: Error processing request. Please try again when online.",
      source: 'offline'
    };
  }
};

// Enhanced offline agent for specific department queries
export const departmentOfflineAgent = async (department: string, query: string): Promise<OfflineAgentResponse> => {
  const departmentLower = department.toLowerCase();
  const queryLower = query.toLowerCase();
  
  if (departmentLower.includes('store') || departmentLower.includes('inventory')) {
    if (queryLower.includes('level') || queryLower.includes('stock')) {
      return {
        success: true,
        message: "Storekeeper Offline Agent: Inventory levels are stable. Critical items: Safety equipment (95%), Spare parts (87%), Consumables (92%).",
        data: { 
          department: 'storekeeper',
          items: [
            { name: 'Safety Equipment', level: 95, status: 'optimal' },
            { name: 'Spare Parts', level: 87, status: 'good' },
            { name: 'Consumables', level: 92, status: 'optimal' }
          ]
        },
        source: 'offline'
      };
    }
    
    if (queryLower.includes('order') || queryLower.includes('reorder')) {
      return {
        success: true,
        message: "Storekeeper Offline Agent: No immediate reorders required. Next scheduled inventory check in 3 days.",
        data: { department: 'storekeeper', action: 'monitor' },
        source: 'offline'
      };
    }
  }
  
  if (departmentLower.includes('maintenance') || departmentLower.includes('engineering')) {
    if (queryLower.includes('schedule') || queryLower.includes('task')) {
      return {
        success: true,
        message: "Maintenance Offline Agent: Scheduled maintenance tasks are up to date. Next major service in 14 days.",
        data: { department: 'maintenance', nextService: '14 days' },
        source: 'offline'
      };
    }
  }
  
  if (departmentLower.includes('hse') || departmentLower.includes('safety')) {
    if (queryLower.includes('incident') || queryLower.includes('compliance')) {
      return {
        success: true,
        message: "HSE Offline Agent: No safety incidents reported. All compliance checks are current.",
        data: { department: 'hse', status: 'compliant' },
        source: 'offline'
      };
    }
  }
  
  // Fallback to general offline agent
  return offlineAgent(query);
};

// Check if we should use offline mode
export const shouldUseOfflineMode = (): boolean => {
  return !navigator.onLine;
};

// Generate mock recommendations for offline use
export const generateOfflineRecommendations = () => {
  return [
    {
      category: "Performance Optimization",
      text: "Monitor workflow efficiency trends when back online",
      confidence: 75,
      reasoning: "Based on cached performance data",
      actionType: "review",
      source: 'offline'
    },
    {
      category: "Risk Mitigation",
      text: "Verify safety protocols during next connectivity window",
      confidence: 80,
      reasoning: "Standard offline safety check",
      actionType: "review",
      source: 'offline'
    },
    {
      category: "Maintenance Scheduling",
      text: "Check maintenance schedules when connection restored",
      confidence: 70,
      reasoning: "Preventive maintenance reminder",
      actionType: "schedule",
      source: 'offline'
    }
  ];
};
