import React, { useState, useEffect } from 'react';
import { 
  PredictiveAnalysis, 
  MaintenanceTask, 
  Equipment, 
  Technician, 
  SensorAnalysis,
  MaintenanceSchedule 
} from '../types/maintenance';
import { useSensorStream } from '../hooks/useSensorStream';
import { predictiveEngine } from '../modules/maintenance/predictiveEngine';
import { maintenanceScheduler } from '../modules/maintenance/scheduler';
import { maintenanceAI } from '../utils/maintenanceAI';

interface MaintenanceDashboardProps {
  department?: string;
  onTaskSelect?: (task: MaintenanceTask) => void;
  onEquipmentSelect?: (equipment: Equipment) => void;
}

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({
  department = 'operations',
  onTaskSelect,
  onEquipmentSelect
}) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [predictiveAnalyses, setPredictiveAnalyses] = useState<PredictiveAnalysis[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'scheduled' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const {
    sensorReadings,
    sensorAnalyses,
    isConnected,
    connectionStatus,
    error,
    addMockSensorData,
    clearData
  } = useSensorStream();

  // Initialize with mock data for demo
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      // Mock equipment data
      const mockEquipment: Equipment[] = [
        {
          id: 'GEN-01',
          name: 'Main Generator',
          type: 'generator',
          location: 'Power Room A',
          status: 'operational',
          lastMaintenance: new Date('2025-09-15'),
          nextScheduledMaintenance: new Date('2025-11-15'),
          runtimeHours: 1850,
          installationDate: new Date('2023-01-15'),
          manufacturer: 'Cummins',
          model: 'C275D5',
          serialNumber: 'CMM-2023-001',
          department: 'operations',
          criticality: 'critical',
          notes: 'Primary power source for building'
        },
        {
          id: 'AC-01',
          name: 'Central AC Unit',
          type: 'ac_unit',
          location: 'Roof Top',
          status: 'warning',
          lastMaintenance: new Date('2025-08-20'),
          nextScheduledMaintenance: new Date('2025-10-20'),
          runtimeHours: 3200,
          installationDate: new Date('2022-03-10'),
          manufacturer: 'Carrier',
          model: '38TXD',
          serialNumber: 'CRR-2022-045',
          department: 'facilities',
          criticality: 'high',
          notes: 'Serving main office area'
        },
        {
          id: 'PUMP-01',
          name: 'Cooling Water Pump',
          type: 'pump',
          location: 'Mechanical Room',
          status: 'operational',
          lastMaintenance: new Date('2025-07-10'),
          nextScheduledMaintenance: new Date('2025-09-10'),
          runtimeHours: 2100,
          installationDate: new Date('2023-06-01'),
          manufacturer: 'Grundfos',
          model: 'CR45',
          serialNumber: 'GRF-2023-078',
          department: 'operations',
          criticality: 'medium',
          notes: 'Cooling system circulation'
        }
      ];

      // Mock technicians
      const mockTechnicians: Technician[] = [
        {
          id: 'TECH-001',
          name: 'Musa Ibrahim',
          email: 'musa.ibrahim@company.com',
          phone: '+2348012345678',
          department: 'maintenance',
          skills: ['generator', 'electrical', 'mechanical'],
          currentWorkload: 45,
          location: 'Main Building',
          isAvailable: true,
          lastActive: new Date()
        },
        {
          id: 'TECH-002',
          name: 'Amina Mohammed',
          email: 'amina.mohammed@company.com',
          phone: '+2348098765432',
          department: 'facilities',
          skills: ['HVAC', 'plumbing', 'electrical'],
          currentWorkload: 65,
          location: 'North Wing',
          isAvailable: true,
          lastActive: new Date()
        },
        {
          id: 'TECH-003',
          name: 'Chinedu Okoro',
          email: 'chinedu.okoro@company.com',
          phone: '+2348055512345',
          department: 'operations',
          skills: ['pumps', 'mechanical', 'instrumentation'],
          currentWorkload: 80,
          location: 'Production Area',
          isAvailable: false,
          lastActive: new Date()
        }
      ];

      setEquipment(mockEquipment);
      setTechnicians(mockTechnicians);

      // Generate predictive analyses
      const analyses: PredictiveAnalysis[] = [];
      for (const eq of mockEquipment) {
        try {
          const analysis = await predictiveEngine.predictFailure(eq.id, eq.type);
          analyses.push(analysis);
        } catch (error) {
          console.error(`Failed to analyze ${eq.name}:`, error);
        }
      }
      setPredictiveAnalyses(analyses);

      // Initialize scheduler and generate tasks
      maintenanceScheduler.initialize([], mockTechnicians, mockEquipment);
      const schedulingResult = await maintenanceScheduler.scheduleMaintenance(analyses);
      setMaintenanceTasks(schedulingResult.scheduledTasks);
      setSchedules(maintenanceScheduler.getTechnicianSchedules());

      setIsLoading(false);
    };

    initializeData();
  }, []);

  // Filter tasks based on selection
  const filteredTasks = maintenanceTasks.filter(task => {
    switch (selectedFilter) {
      case 'critical':
        return task.priority === 'critical';
      case 'scheduled':
        return task.status === 'scheduled' || task.status === 'in-progress';
      case 'completed':
        return task.status === 'completed';
      default:
        return true;
    }
  });

  // Get critical equipment count
  const criticalEquipmentCount = predictiveAnalyses.filter(a => a.riskLevel === 'critical').length;
  const highRiskEquipmentCount = predictiveAnalyses.filter(a => a.riskLevel === 'high').length;

  // Get department-specific recommendations
  const departmentRecommendations = maintenanceAI.generateRecommendations(predictiveAnalyses, department);

  const handleCompleteTask = (taskId: string) => {
    if (maintenanceScheduler.completeTask(taskId)) {
      setMaintenanceTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, status: 'completed', completedDate: new Date() }
            : task
        )
      );
    }
  };

  const handleAddMockAnomaly = () => {
    // Add a critical sensor reading to trigger maintenance
    addMockSensorData('GEN-01', 'temperature', 120); // Critical temperature
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading maintenance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Predictive Maintenance Dashboard</h1>
            <p className="text-gray-600">Department: {department}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : connectionStatus === 'connecting'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              Sensor Stream: {connectionStatus}
            </div>
            <button
              onClick={handleAddMockAnomaly}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Simulate Critical Alert
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{equipment.length}</div>
            <div className="text-sm text-blue-600">Total Equipment</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-700">{criticalEquipmentCount}</div>
            <div className="text-sm text-red-600">Critical Alerts</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{highRiskEquipmentCount}</div>
            <div className="text-sm text-yellow-600">High Risk</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-700">
              {maintenanceTasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-green-600">Tasks Completed</div>
          </div>
        </div>

        {/* AI Recommendations */}
        {departmentRecommendations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">AI Recommendations</h3>
            <ul className="space-y-1">
              {departmentRecommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="text-sm text-yellow-700">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Equipment Health */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment Health Status</h2>
            <div className="space-y-3">
              {predictiveAnalyses.map(analysis => {
                const eq = equipment.find(e => e.id === analysis.equipmentId);
                return (
                  <div
                    key={analysis.equipmentId}
                    className={`p-4 rounded-lg border ${
                      analysis.riskLevel === 'critical' 
                        ? 'bg-red-50 border-red-200' 
                        : analysis.riskLevel === 'high'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{analysis.equipmentName}</h3>
                        <p className="text-sm text-gray-600">{eq?.location}</p>
                        <p className={`text-sm font-medium ${
                          analysis.riskLevel === 'critical' ? 'text-red-700' :
                          analysis.riskLevel === 'high' ? 'text-yellow-700' :
                          'text-green-700'
                        }`}>
                          Risk: {analysis.riskLevel.toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Predicted failure in {analysis.predictedFailureInDays} days
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          analysis.status === 'critical' 
                            ? 'bg-red-100 text-red-800'
                            : analysis.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {analysis.status.toUpperCase()}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Confidence: {(analysis.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{analysis.recommendedAction}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Maintenance Tasks */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Maintenance Tasks</h2>
              <div className="flex space-x-2">
                {(['all', 'critical', 'scheduled', 'completed'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedFilter === filter
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tasks found for selected filter.</p>
              ) : (
                filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onTaskSelect?.(task)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{task.equipmentName}</h3>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            task.priority === 'critical' 
                              ? 'bg-red-100 text-red-800'
                              : task.priority === 'high'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {task.priority.toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Assigned to: {task.assignedTo || 'Unassigned'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Est. {Math.round(task.estimatedDuration / 60)}h
                        </p>
                        {task.status === 'scheduled' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTask(task.id);
                            }}
                            className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Technician Schedule */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Technician Schedule</h2>
            <div className="space-y-4">
              {schedules.map(schedule => {
                const tech = technicians.find(t => t.id === schedule.technicianId);
                return (
                  <div key={schedule.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{schedule.technicianName}</h3>
                        <p className="text-sm text-gray-600">
                          {schedule.tasks.length} tasks • {schedule.totalHours.toFixed(1)}h
                        </p>
                        <p className="text-sm text-gray-500">
                          Efficiency: {schedule.efficiency.toFixed(1)}%
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        tech?.isAvailable 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tech?.isAvailable ? 'Available' : 'Busy'}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      {schedule.tasks.slice(0, 2).map(task => (
                        <div key={task.id} className="text-xs text-gray-600 flex justify-between">
                          <span>{task.equipmentName}</span>
                          <span>{Math.round(task.estimatedDuration / 60)}h</span>
                        </div>
                      ))}
                      {schedule.tasks.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{schedule.tasks.length - 2} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sensor Data */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sensor Data</h2>
            <div className="space-y-3">
              {sensorAnalyses.slice(-5).map((analysis, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {analysis.equipmentId} - {analysis.sensorType}
                    </p>
                    <p className="text-xs text-gray-600">
                      Value: {analysis.currentValue}{analysis.normalRange && ` (${analysis.normalRange.min}-${analysis.normalRange.max})`}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    analysis.anomalyScore > 0.8 
                      ? 'bg-red-100 text-red-800'
                      : analysis.anomalyScore > 0.5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {analysis.anomalyScore > 0.8 ? 'Critical' : analysis.anomalyScore > 0.5 ? 'Warning' : 'Normal'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // Refresh analyses
                  predictiveAnalyses.forEach(async (analysis) => {
                    const newAnalysis = await predictiveEngine.predictFailure(analysis.equipmentId, 'generator');
                    setPredictiveAnalyses(prev => 
                      prev.map(a => a.equipmentId === analysis.equipmentId ? newAnalysis : a)
                    );
                  });
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh Analyses
              </button>
              <button
                onClick={clearData}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Clear Sensor Data
              </button>
              <button
                onClick={() => {
                  // Generate maintenance report
                  const report = maintenanceAI.generateReport(predictiveAnalyses, maintenanceTasks, department);
                  console.log('Maintenance Report:', report);
                  alert('Maintenance report generated in console');
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
