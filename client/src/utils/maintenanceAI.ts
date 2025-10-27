import { PredictiveAnalysis, MaintenanceTask, Equipment, Technician, SensorAnalysis } from '../types/maintenance';
import { InventoryItem } from '../types/inventory';

export interface MaintenanceAIResponse {
  success: boolean;
  message: string;
  data?: any;
  recommendations?: string[];
  predictedTasks?: MaintenanceTask[];
  riskAssessment?: string;
}

/**
 * AI-powered maintenance utilities for department-specific logic and predictions
 */
export class MaintenanceAI {
  /**
   * Generate department-specific maintenance recommendations
   */
  static generateDepartmentRecommendations(
    analyses: PredictiveAnalysis[],
    department: string
  ): string[] {
    const recommendations: string[] = [];
    
    const criticalEquipment = analyses.filter(a => a.riskLevel === 'critical');
    const highRiskEquipment = analyses.filter(a => a.riskLevel === 'high');
    
    // Department-specific logic
    switch (department.toLowerCase()) {
      case 'operations':
        if (criticalEquipment.length > 0) {
          recommendations.push(`CRITICAL: ${criticalEquipment.length} equipment items require immediate attention in Operations`);
          recommendations.push('Prioritize maintenance to avoid production downtime');
        }
        if (highRiskEquipment.length > 0) {
          recommendations.push(`Schedule maintenance for ${highRiskEquipment.length} high-risk equipment items within 48 hours`);
        }
        recommendations.push('Coordinate with inventory for critical spare parts');
        break;
        
      case 'facilities':
        if (criticalEquipment.length > 0) {
          recommendations.push(`URGENT: ${criticalEquipment.length} facility equipment items need immediate repair`);
          recommendations.push('Alert facilities management team immediately');
        }
        recommendations.push('Check HVAC and electrical systems for preventive maintenance');
        recommendations.push('Verify emergency backup systems are operational');
        break;
        
      case 'production':
        if (criticalEquipment.length > 0) {
          recommendations.push(`PRODUCTION RISK: ${criticalEquipment.length} production equipment items critical`);
          recommendations.push('Schedule maintenance during off-peak hours if possible');
        }
        recommendations.push('Monitor production line equipment closely');
        recommendations.push('Coordinate maintenance with production schedules');
        break;
        
      case 'maintenance':
        recommendations.push('Review all predictive maintenance alerts');
        recommendations.push('Assign technicians based on skill and availability');
        recommendations.push('Track maintenance completion and follow-up');
        recommendations.push('Update maintenance records and documentation');
        break;
        
      default:
        recommendations.push('Review equipment status and prioritize maintenance');
        recommendations.push('Coordinate with relevant departments for scheduling');
    }
    
    // Add general recommendations
    if (analyses.some(a => a.confidence < 0.7)) {
      recommendations.push('Some predictions have low confidence - consider additional sensor data');
    }
    
    if (analyses.some(a => a.predictedFailureInDays <= 3)) {
      recommendations.push('IMMEDIATE ACTION: Equipment predicted to fail within 3 days');
    }
    
    return recommendations;
  }

  /**
   * Generate AI-powered maintenance task descriptions
   */
  static generateTaskDescription(
    analysis: PredictiveAnalysis,
    equipment?: Equipment,
    sensorAnalyses?: SensorAnalysis[]
  ): string {
    let description = `Predictive maintenance for ${analysis.equipmentName}`;
    
    if (equipment) {
      description += ` (${equipment.type})`;
    }
    
    // Add specific issues based on sensor data
    if (sensorAnalyses && sensorAnalyses.length > 0) {
      const criticalSensors = sensorAnalyses.filter(s => s.anomalyScore > 0.8);
      const warningSensors = sensorAnalyses.filter(s => s.anomalyScore > 0.5 && s.anomalyScore <= 0.8);
      
      if (criticalSensors.length > 0) {
        description += ` - Critical issues: ${criticalSensors.map(s => s.sensorType).join(', ')}`;
      } else if (warningSensors.length > 0) {
        description += ` - Warning issues: ${warningSensors.map(s => s.sensorType).join(', ')}`;
      }
    }
    
    // Add predicted failure timeframe
    if (analysis.predictedFailureInDays <= 7) {
      description += ` - Predicted failure in ${analysis.predictedFailureInDays} days`;
    }
    
    return description;
  }

  /**
   * AI-powered risk assessment for equipment
   */
  static assessEquipmentRisk(
    analysis: PredictiveAnalysis,
    equipment: Equipment,
    sensorAnalyses: SensorAnalysis[]
  ): {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    mitigationStrategies: string[];
  } {
    const riskFactors: string[] = [];
    const mitigationStrategies: string[] = [];
    
    // Equipment criticality factor
    if (equipment.criticality === 'critical') {
      riskFactors.push('Equipment is mission-critical');
      mitigationStrategies.push('Maintain redundancy and backup systems');
    }
    
    // Sensor anomaly factors
    const highAnomalySensors = sensorAnalyses.filter(s => s.anomalyScore > 0.7);
    if (highAnomalySensors.length > 0) {
      riskFactors.push(`Multiple sensor anomalies: ${highAnomalySensors.map(s => s.sensorType).join(', ')}`);
      mitigationStrategies.push('Immediate sensor calibration and inspection');
    }
    
    // Runtime and age factors
    if (equipment.runtimeHours > 2000) {
      riskFactors.push('High runtime hours');
      mitigationStrategies.push('Schedule comprehensive inspection');
    }
    
    const installationAge = new Date().getFullYear() - new Date(equipment.installationDate).getFullYear();
    if (installationAge > 5) {
      riskFactors.push(`Equipment age: ${installationAge} years`);
      mitigationStrategies.push('Consider equipment replacement planning');
    }
    
    // Calculate overall risk
    let riskScore = 0;
    if (analysis.riskLevel === 'critical') riskScore += 4;
    else if (analysis.riskLevel === 'high') riskScore += 3;
    else if (analysis.riskLevel === 'medium') riskScore += 2;
    else riskScore += 1;
    
    riskScore += highAnomalySensors.length;
    if (equipment.criticality === 'critical') riskScore += 2;
    if (installationAge > 5) riskScore += 1;
    
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 6) overallRisk = 'critical';
    else if (riskScore >= 4) overallRisk = 'high';
    else if (riskScore >= 2) overallRisk = 'medium';
    else overallRisk = 'low';
    
    return {
      overallRisk,
      riskFactors,
      mitigationStrategies
    };
  }

  /**
   * Generate AI-powered maintenance schedule optimization
   */
  static optimizeMaintenanceSchedule(
    tasks: MaintenanceTask[],
    technicians: Technician[],
    workingHours: { start: string; end: string } = { start: '08:00', end: '17:00' }
  ): {
    optimizedSchedule: MaintenanceTask[];
    efficiencyGain: number;
    conflicts: string[];
  } {
    const optimizedSchedule: MaintenanceTask[] = [...tasks];
    const conflicts: string[] = [];
    let totalEfficiency = 0;
    
    // Sort tasks by priority and estimated duration
    optimizedSchedule.sort((a, b) => {
      // Critical tasks first
      if (a.priority === 'critical' && b.priority !== 'critical') return -1;
      if (b.priority === 'critical' && a.priority !== 'critical') return 1;
      
      // Then by predicted failure timeframe
      if (a.predictedFailureInDays !== b.predictedFailureInDays) {
        return a.predictedFailureInDays! - b.predictedFailureInDays!;
      }
      
      // Then by estimated duration (shorter tasks first for better flow)
      return a.estimatedDuration - b.estimatedDuration;
    });
    
    // Assign tasks to technicians based on availability and skills
    const availableTechs = technicians.filter(t => t.isAvailable && t.currentWorkload < 80);
    const techAssignments: Record<string, MaintenanceTask[]> = {};
    
    availableTechs.forEach(tech => {
      techAssignments[tech.id] = [];
    });
    
    for (const task of optimizedSchedule) {
      if (!task.assignedTo) {
        const suitableTech = this.findSuitableTechnician(task, availableTechs);
        if (suitableTech) {
          task.assignedTo = suitableTech.name;
          techAssignments[suitableTech.id].push(task);
          
          // Update technician workload
          suitableTech.currentWorkload += (task.estimatedDuration / (8 * 60)) * 100;
          if (suitableTech.currentWorkload > 80) {
            suitableTech.isAvailable = false;
          }
        } else {
          conflicts.push(`No suitable technician found for ${task.equipmentName}`);
        }
      }
    }
    
    // Calculate efficiency gain (simplified)
    const originalDuration = tasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
    const optimizedDuration = optimizedSchedule.reduce((sum, task) => {
      const tech = technicians.find(t => t.name === task.assignedTo);
      const efficiency = tech ? this.calculateTechnicianEfficiency(tech, task) : 0.8;
      return sum + (task.estimatedDuration / efficiency);
    }, 0);
    
    totalEfficiency = originalDuration > 0 ? ((originalDuration - optimizedDuration) / originalDuration) * 100 : 0;
    
    return {
      optimizedSchedule,
      efficiencyGain: Math.max(0, totalEfficiency),
      conflicts
    };
  }

  /**
   * Find the most suitable technician for a task
   */
  private static findSuitableTechnician(
    task: MaintenanceTask,
    technicians: Technician[]
  ): Technician | null {
    let bestTech: Technician | null = null;
    let bestScore = 0;
    
    for (const tech of technicians) {
      if (tech.isAvailable && tech.currentWorkload < 80) {
        const score = this.calculateTechnicianSuitability(tech, task);
        if (score > bestScore) {
          bestScore = score;
          bestTech = tech;
        }
      }
    }
    
    return bestTech;
  }

  /**
   * Calculate technician suitability score
   */
  private static calculateTechnicianSuitability(technician: Technician, task: MaintenanceTask): number {
    let score = 0;
    
    // Availability score
    score += (100 - technician.currentWorkload) * 0.3;
    
    // Skill matching (simplified)
    const hasRelevantSkills = technician.skills.some(skill =>
      task.description.toLowerCase().includes(skill.toLowerCase())
    );
    if (hasRelevantSkills) {
      score += 40;
    }
    
    // Experience with similar equipment
    if (technician.skills.includes('generator') && task.description.includes('generator')) {
      score += 20;
    }
    if (technician.skills.includes('HVAC') && task.description.includes('AC')) {
      score += 20;
    }
    
    return score;
  }

  /**
   * Calculate technician efficiency for a specific task
   */
  private static calculateTechnicianEfficiency(technician: Technician, task: MaintenanceTask): number {
    let efficiency = 0.8; // Base efficiency
    
    // Skill-based efficiency boost
    const hasRelevantSkills = technician.skills.some(skill =>
      task.description.toLowerCase().includes(skill.toLowerCase())
    );
    if (hasRelevantSkills) {
      efficiency += 0.15;
    }
    
    // Workload efficiency penalty
    if (technician.currentWorkload > 60) {
      efficiency -= 0.1;
    }
    
    return Math.min(1.0, Math.max(0.5, efficiency));
  }

  /**
   * Generate AI-powered maintenance reports
   */
  static generateMaintenanceReport(
    analyses: PredictiveAnalysis[],
    tasks: MaintenanceTask[],
    department: string
  ): {
    summary: string;
    criticalAlerts: string[];
    recommendations: string[];
    efficiencyMetrics: {
      tasksScheduled: number;
      tasksCompleted: number;
      averageCompletionTime: number;
      preventiveMaintenanceRate: number;
    };
  } {
    const criticalAlerts: string[] = [];
    const recommendations: string[] = [];
    
    // Critical equipment alerts
    const criticalEquipment = analyses.filter(a => a.riskLevel === 'critical');
    if (criticalEquipment.length > 0) {
      criticalAlerts.push(`CRITICAL: ${criticalEquipment.length} equipment items require immediate attention`);
      criticalEquipment.forEach(equipment => {
        criticalAlerts.push(`${equipment.equipmentName}: ${equipment.recommendedAction}`);
      });
    }
    
    // Department-specific recommendations
    recommendations.push(...this.generateDepartmentRecommendations(analyses, department));
    
    // Efficiency metrics
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const scheduledTasks = tasks.filter(t => t.status === 'scheduled' || t.status === 'in-progress');
    const totalDuration = completedTasks.reduce((sum, task) => sum + (task.actualDuration || task.estimatedDuration), 0);
    const averageCompletionTime = completedTasks.length > 0 ? totalDuration / completedTasks.length : 0;
    
    const preventiveTasks = tasks.filter(t => 
      t.description.includes('predictive') || t.description.includes('preventive')
    );
    const preventiveMaintenanceRate = tasks.length > 0 ? (preventiveTasks.length / tasks.length) * 100 : 0;
    
    const summary = `Maintenance Report for ${department} Department:
- Total Equipment Monitored: ${analyses.length}
- Critical Alerts: ${criticalEquipment.length}
- Scheduled Tasks: ${scheduledTasks.length}
- Completed Tasks: ${completedTasks.length}
- Preventive Maintenance Rate: ${preventiveMaintenanceRate.toFixed(1)}%`;
    
    return {
      summary,
      criticalAlerts,
      recommendations,
      efficiencyMetrics: {
        tasksScheduled: scheduledTasks.length,
        tasksCompleted: completedTasks.length,
        averageCompletionTime,
        preventiveMaintenanceRate
      }
    };
  }

  /**
   * AI-powered anomaly detection and explanation
   */
  static explainSensorAnomaly(
    sensorAnalysis: SensorAnalysis,
    equipment: Equipment
  ): {
    severity: 'low' | 'medium' | 'high' | 'critical';
    explanation: string;
    immediateActions: string[];
    longTermRecommendations: string[];
  } {
    const { sensorType, currentValue, normalRange, trend, anomalyScore } = sensorAnalysis;
    
    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (anomalyScore > 0.8) severity = 'critical';
    else if (anomalyScore > 0.6) severity = 'high';
    else if (anomalyScore > 0.4) severity = 'medium';
    else severity = 'low';
    
    const explanation = `Sensor ${sensorType} reading ${currentValue} is outside normal range (${normalRange.min}-${normalRange.max}). 
    Current trend: ${trend}. Anomaly confidence: ${(anomalyScore * 100).toFixed(1)}%.`;
    
    const immediateActions: string[] = [];
    const longTermRecommendations: string[] = [];
    
    // Immediate actions based on severity and sensor type
    if (severity === 'critical') {
      immediateActions.push('IMMEDIATE: Shut down equipment if safe to do so');
      immediateActions.push('Alert maintenance team immediately');
      immediateActions.push('Isolate equipment from operations');
    } else if (severity === 'high') {
      immediateActions.push('Schedule inspection within 24 hours');
      immediateActions.push('Monitor equipment closely');
      immediateActions.push('Prepare maintenance resources');
    }
    
    // Sensor-specific recommendations
    switch (sensorType) {
      case 'temperature':
        immediateActions.push('Check cooling systems and ventilation');
        longTermRecommendations.push('Improve thermal management system');
        longTermRecommendations.push('Consider equipment load reduction');
        break;
      case 'vibration':
        immediateActions.push('Inspect for loose components');
        immediateActions.push('Check alignment and balance');
        longTermRecommendations.push('Schedule vibration analysis');
        longTermRecommendations.push('Consider foundation reinforcement');
        break;
      case 'voltage':
        immediateActions.push('Check power supply stability');
        immediateActions.push('Inspect electrical connections');
        longTermRecommendations.push('Review power distribution system');
        longTermRecommendations.push('Consider voltage regulation equipment');
        break;
      case 'pressure':
        immediateActions.push('Check for leaks or blockages');
        immediateActions.push('Verify pressure relief systems');
        longTermRecommendations.push('Review system pressure design');
        longTermRecommendations.push('Consider pressure monitoring upgrades');
        break;
    }
    
    return {
      severity,
      explanation,
      immediateActions,
      longTermRecommendations
    };
  }
}

// Export utility functions
export const maintenanceAI = {
  generateRecommendations: MaintenanceAI.generateDepartmentRecommendations,
  assessRisk: MaintenanceAI.assessEquipmentRisk,
  optimizeSchedule: MaintenanceAI.optimizeMaintenanceSchedule,
  generateReport: MaintenanceAI.generateMaintenanceReport,
  explainAnomaly: MaintenanceAI.explainSensorAnomaly
};
