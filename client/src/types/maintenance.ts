export interface Equipment {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'operational' | 'warning' | 'critical' | 'maintenance' | 'offline';
  lastMaintenance: Date;
  nextScheduledMaintenance: Date;
  runtimeHours: number;
  installationDate: Date;
  manufacturer: string;
  model: string;
  serialNumber: string;
  department: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

export interface SensorReading {
  id: string;
  equipmentId: string;
  type: 'temperature' | 'vibration' | 'voltage' | 'pressure' | 'humidity' | 'runtime';
  value: number;
  unit: string;
  timestamp: Date;
  normalRange: {
    min: number;
    max: number;
  };
  status: 'normal' | 'warning' | 'critical';
}

export interface MaintenanceTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo: string;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  scheduledDate: Date;
  completedDate?: Date;
  predictedFailureInDays?: number;
  requiredParts?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface PredictiveAnalysis {
  equipmentId: string;
  equipmentName: string;
  status: 'normal' | 'warning' | 'critical';
  predictedFailureInDays: number;
  confidence: number;
  recommendedAction: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: string[];
  lastAnalysis: Date;
  nextAnalysis: Date;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  skills: string[];
  currentWorkload: number; // 0-100 percentage
  location?: string;
  isAvailable: boolean;
  lastActive: Date;
}

export interface MaintenanceSchedule {
  id: string;
  technicianId: string;
  technicianName: string;
  tasks: MaintenanceTask[];
  date: Date;
  totalHours: number;
  efficiency: number; // 0-100 percentage
}

export interface MaintenanceAlert {
  id: string;
  type: 'predictive' | 'scheduled' | 'emergency' | 'inventory';
  equipmentId: string;
  equipmentName: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  actionRequired: boolean;
}

export interface MaintenanceSyncState {
  pendingTasks: number;
  pendingAlerts: number;
  lastSync: Date | null;
  isSyncing: boolean;
  syncError: string | null;
}

export interface VoiceMaintenanceCommand {
  intent: 'schedule' | 'status' | 'predict' | 'assign' | 'report' | 'alert';
  equipment?: string;
  technician?: string;
  priority?: string;
  action?: string;
  timeframe?: string;
}

export interface AIMaintenanceResponse {
  success: boolean;
  message: string;
  data?: any;
  action?: string;
  recommendations?: string[];
}

// Sensor data analysis results
export interface SensorAnalysis {
  equipmentId: string;
  sensorType: string;
  currentValue: number;
  normalRange: { min: number; max: number };
  deviation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  anomalyScore: number; // 0-1
  recommendations: string[];
}

// Maintenance prediction model output
export interface MaintenancePrediction {
  equipmentId: string;
  predictedFailureDate: Date;
  confidence: number;
  riskFactors: string[];
  recommendedMaintenance: string;
  estimatedCost: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}
