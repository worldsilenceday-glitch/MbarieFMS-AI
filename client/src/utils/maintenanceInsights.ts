import { PredictiveAnalysis, MaintenanceTask, Equipment, SensorAnalysis } from '../types/maintenance';

export interface MaintenanceInsight {
  id: string;
  type: 'predictive' | 'optimization' | 'risk' | 'efficiency';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  equipmentId?: string;
  equipmentName?: string;
  recommendations: string[];
  timestamp: Date;
  actionable: boolean;
  action?: string;
}

export interface VoiceMaintenanceSummary {
  summary: string;
  criticalAlerts: string[];
  recommendations: string[];
  overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
}

/**
 * AI-powered maintenance insights and voice summary generation
 */
export class MaintenanceInsights {
  /**
   * Generate AI-powered maintenance insights from predictive analyses
   */
  static generateInsights(
    analyses: PredictiveAnalysis[],
    tasks: MaintenanceTask[],
    equipment: Equipment[],
    sensorAnalyses: SensorAnalysis[] = []
  ): MaintenanceInsight[] {
    const insights: MaintenanceInsight[] = [];

    // Critical equipment insights
    const criticalEquipment = analyses.filter(a => a.riskLevel === 'critical');
    if (criticalEquipment.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-critical`,
        type: 'risk',
        title: 'Critical Equipment Alert',
        description: `${criticalEquipment.length} equipment items are at critical risk level and require immediate attention.`,
        severity: 'critical',
        recommendations: [
          'Schedule immediate maintenance for critical equipment',
          'Notify maintenance team and management',
          'Prepare emergency response procedures'
        ],
        timestamp: new Date(),
        actionable: true,
        action: 'schedule_emergency_maintenance'
      });
    }

    // High-risk equipment insights
    const highRiskEquipment = analyses.filter(a => a.riskLevel === 'high');
    if (highRiskEquipment.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-high`,
        type: 'risk',
        title: 'High-Risk Equipment',
        description: `${highRiskEquipment.length} equipment items are at high risk level and should be scheduled for maintenance within 48 hours.`,
        severity: 'high',
        recommendations: [
          'Schedule maintenance within 48 hours',
          'Monitor equipment closely',
          'Ensure spare parts are available'
        ],
        timestamp: new Date(),
        actionable: true,
        action: 'schedule_priority_maintenance'
      });
    }

    // Predictive failure insights
    const imminentFailures = analyses.filter(a => a.predictedFailureInDays <= 7);
    if (imminentFailures.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-imminent`,
        type: 'predictive',
        title: 'Imminent Equipment Failures',
        description: `${imminentFailures.length} equipment items are predicted to fail within 7 days.`,
        severity: 'high',
        recommendations: [
          'Prioritize maintenance scheduling',
          'Review maintenance history',
          'Coordinate with operations for downtime planning'
        ],
        timestamp: new Date(),
        actionable: true,
        action: 'prioritize_maintenance'
      });
    }

    // Efficiency optimization insights
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const efficiencyRate = completedTasks.length > 0 ? 
      (completedTasks.filter(t => t.actualDuration && t.actualDuration <= t.estimatedDuration).length / completedTasks.length) * 100 : 0;
    
    if (efficiencyRate < 80) {
      insights.push({
        id: `insight-${Date.now()}-efficiency`,
        type: 'efficiency',
        title: 'Maintenance Efficiency Alert',
        description: `Maintenance efficiency is at ${efficiencyRate.toFixed(1)}%, below the 80% target.`,
        severity: 'medium',
        recommendations: [
          'Review maintenance procedures',
          'Provide additional technician training',
          'Optimize maintenance scheduling'
        ],
        timestamp: new Date(),
        actionable: true,
        action: 'optimize_efficiency'
      });
    }

    // Sensor anomaly insights
    const criticalSensors = sensorAnalyses.filter(s => s.anomalyScore > 0.8);
    if (criticalSensors.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-sensor`,
        type: 'predictive',
        title: 'Critical Sensor Anomalies',
        description: `${criticalSensors.length} sensors are showing critical anomalies.`,
        severity: 'critical',
        recommendations: [
          'Immediate sensor inspection required',
          'Check equipment calibration',
          'Review sensor maintenance schedule'
        ],
        timestamp: new Date(),
        actionable: true,
        action: 'inspect_sensors'
      });
    }

    // Equipment age insights
    const oldEquipment = equipment.filter(e => {
      const age = new Date().getFullYear() - new Date(e.installationDate).getFullYear();
      return age > 8 && e.criticality === 'critical';
    });

    if (oldEquipment.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-age`,
        type: 'risk',
        title: 'Aging Critical Equipment',
        description: `${oldEquipment.length} critical equipment items are over 8 years old and may need replacement planning.`,
        severity: 'medium',
        recommendations: [
          'Develop equipment replacement plan',
          'Budget for capital expenditure',
          'Consider equipment upgrades'
        ],
        timestamp: new Date(),
        actionable: true,
        action: 'plan_replacement'
      });
    }

    return insights;
  }

  /**
   * Generate voice-friendly maintenance summary
   */
  static generateVoiceSummary(
    analyses: PredictiveAnalysis[],
    tasks: MaintenanceTask[],
    department: string = 'operations'
  ): VoiceMaintenanceSummary {
    const criticalCount = analyses.filter(a => a.riskLevel === 'critical').length;
    const highCount = analyses.filter(a => a.riskLevel === 'high').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'scheduled').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    // Determine overall status
    let overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
    if (criticalCount > 0) {
      overallStatus = 'critical';
    } else if (highCount > 0) {
      overallStatus = 'warning';
    } else if (pendingTasks === 0 && completedTasks > 0) {
      overallStatus = 'excellent';
    } else {
      overallStatus = 'good';
    }

    // Generate summary text
    let summary = `Maintenance summary for ${department}. `;
    
    if (overallStatus === 'excellent') {
      summary += 'All systems are operating normally. ';
    } else if (overallStatus === 'good') {
      summary += 'Systems are operating well with minor maintenance needs. ';
    } else if (overallStatus === 'warning') {
      summary += 'Some equipment requires attention. ';
    } else {
      summary += 'CRITICAL: Immediate maintenance required. ';
    }

    summary += `There are ${criticalCount} critical alerts, ${highCount} high priority items, ${pendingTasks} pending tasks, and ${completedTasks} completed tasks.`;

    // Critical alerts
    const criticalAlerts: string[] = [];
    if (criticalCount > 0) {
      criticalAlerts.push(`${criticalCount} equipment items at critical risk level`);
    }
    if (highCount > 0) {
      criticalAlerts.push(`${highCount} equipment items at high risk level`);
    }

    // Recommendations
    const recommendations: string[] = [];
    if (criticalCount > 0) {
      recommendations.push('Schedule emergency maintenance immediately');
    }
    if (highCount > 0) {
      recommendations.push('Plan maintenance within 48 hours');
    }
    if (pendingTasks > 5) {
      recommendations.push('Review task assignment and workload');
    }

    return {
      summary,
      criticalAlerts,
      recommendations,
      overallStatus
    };
  }

  /**
   * Generate maintenance optimization recommendations
   */
  static generateOptimizationRecommendations(
    tasks: MaintenanceTask[],
    analyses: PredictiveAnalysis[],
    workingHours: { start: string; end: string } = { start: '08:00', end: '17:00' }
  ): string[] {
    const recommendations: string[] = [];

    // Task distribution analysis
    const technicianWorkload: Record<string, number> = {};
    tasks.forEach(task => {
      if (task.assignedTo) {
        technicianWorkload[task.assignedTo] = (technicianWorkload[task.assignedTo] || 0) + task.estimatedDuration;
      }
    });

    // Identify workload imbalances
    const workloads = Object.values(technicianWorkload);
    if (workloads.length > 0) {
      const maxWorkload = Math.max(...workloads);
      const minWorkload = Math.min(...workloads);
      
      if (maxWorkload > minWorkload * 2) {
        recommendations.push('Redistribute tasks to balance technician workload');
      }
    }

    // Preventive maintenance optimization
    const preventiveTasks = tasks.filter(t => 
      t.description.includes('predictive') || t.description.includes('preventive')
    );
    const preventiveRate = tasks.length > 0 ? (preventiveTasks.length / tasks.length) * 100 : 0;
    
    if (preventiveRate < 60) {
      recommendations.push('Increase preventive maintenance activities to reduce emergency repairs');
    }

    // Parts availability optimization
    const tasksWithoutParts = tasks.filter(t => 
      !t.requiredParts || t.requiredParts.length === 0
    );
    if (tasksWithoutParts.length > tasks.length * 0.3) {
      recommendations.push('Improve parts planning and inventory management');
    }

    // Schedule optimization
    const overdueTasks = tasks.filter(t => 
      t.status === 'scheduled' && 
      new Date(t.scheduledDate) < new Date() &&
      t.priority === 'high' || t.priority === 'critical'
    );
    if (overdueTasks.length > 0) {
      recommendations.push('Reschedule overdue high-priority maintenance tasks');
    }

    return recommendations;
  }

  /**
   * Generate maintenance report with AI insights
   */
  static generateComprehensiveReport(
    analyses: PredictiveAnalysis[],
    tasks: MaintenanceTask[],
    equipment: Equipment[],
    sensorAnalyses: SensorAnalysis[],
    department: string
  ): {
    executiveSummary: string;
    insights: MaintenanceInsight[];
    recommendations: string[];
    metrics: {
      equipmentCount: number;
      criticalAlerts: number;
      highRiskAlerts: number;
      pendingTasks: number;
      completedTasks: number;
      preventiveMaintenanceRate: number;
      averageCompletionTime: number;
    };
  } {
    const insights = this.generateInsights(analyses, tasks, equipment, sensorAnalyses);
    const optimizationRecs = this.generateOptimizationRecommendations(tasks, analyses);
    const voiceSummary = this.generateVoiceSummary(analyses, tasks, department);

    // Calculate metrics
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const totalDuration = completedTasks.reduce((sum, task) => 
      sum + (task.actualDuration || task.estimatedDuration), 0
    );
    const averageCompletionTime = completedTasks.length > 0 ? 
      totalDuration / completedTasks.length : 0;

    const preventiveTasks = tasks.filter(t => 
      t.description.includes('predictive') || t.description.includes('preventive')
    );
    const preventiveMaintenanceRate = tasks.length > 0 ? 
      (preventiveTasks.length / tasks.length) * 100 : 0;

    const executiveSummary = `Maintenance Report - ${department}
Total Equipment: ${equipment.length}
Critical Alerts: ${analyses.filter(a => a.riskLevel === 'critical').length}
High Risk Alerts: ${analyses.filter(a => a.riskLevel === 'high').length}
Pending Tasks: ${tasks.filter(t => t.status === 'pending' || t.status === 'scheduled').length}
Completed Tasks: ${completedTasks.length}
Overall Status: ${voiceSummary.overallStatus.toUpperCase()}`;

    return {
      executiveSummary,
      insights,
      recommendations: [...voiceSummary.recommendations, ...optimizationRecs],
      metrics: {
        equipmentCount: equipment.length,
        criticalAlerts: analyses.filter(a => a.riskLevel === 'critical').length,
        highRiskAlerts: analyses.filter(a => a.riskLevel === 'high').length,
        pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'scheduled').length,
        completedTasks: completedTasks.length,
        preventiveMaintenanceRate,
        averageCompletionTime
      }
    };
  }

  /**
   * Generate maintenance alert for voice notification
   */
  static generateVoiceAlert(
    analysis: PredictiveAnalysis,
    equipment?: Equipment
  ): string {
    const equipmentName = equipment?.name || analysis.equipmentName;
    
    if (analysis.riskLevel === 'critical') {
      return `CRITICAL ALERT: ${equipmentName} requires immediate maintenance. Predicted failure in ${analysis.predictedFailureInDays} days. ${analysis.recommendedAction}`;
    } else if (analysis.riskLevel === 'high') {
      return `HIGH PRIORITY: ${equipmentName} needs maintenance within 48 hours. Predicted failure in ${analysis.predictedFailureInDays} days.`;
    } else {
      return `MAINTENANCE ALERT: ${equipmentName} requires attention. Predicted failure in ${analysis.predictedFailureInDays} days.`;
    }
  }
}

// Export utility functions
export const maintenanceInsights = {
  generateInsights: MaintenanceInsights.generateInsights,
  generateVoiceSummary: MaintenanceInsights.generateVoiceSummary,
  generateOptimizationRecommendations: MaintenanceInsights.generateOptimizationRecommendations,
  generateComprehensiveReport: MaintenanceInsights.generateComprehensiveReport,
  generateVoiceAlert: MaintenanceInsights.generateVoiceAlert
};
