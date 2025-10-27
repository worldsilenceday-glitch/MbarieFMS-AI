import { SensorReading, PredictiveAnalysis, MaintenancePrediction, SensorAnalysis } from '../../types/maintenance';
import { predictiveAnalytics } from '../../utils/predictive';

// Rule-based thresholds for different equipment types
interface EquipmentThresholds {
  temperature?: { warning: number; critical: number };
  vibration?: { warning: number; critical: number };
  voltage?: { warning: { min: number; max: number }; critical: { min: number; max: number } };
  pressure?: { warning: { min: number; max: number }; critical: { min: number; max: number } };
  runtimeHours?: { warning: number; critical: number };
}

const EQUIPMENT_THRESHOLDS: Record<string, EquipmentThresholds> = {
  generator: {
    temperature: { warning: 85, critical: 95 },
    vibration: { warning: 0.8, critical: 1.2 },
    voltage: { warning: { min: 210, max: 250 }, critical: { min: 200, max: 260 } },
    runtimeHours: { warning: 2000, critical: 3000 }
  },
  ac_unit: {
    temperature: { warning: 15, critical: 10 },
    pressure: { warning: { min: 100, max: 400 }, critical: { min: 80, max: 450 } },
    runtimeHours: { warning: 1500, critical: 2500 }
  },
  pump: {
    vibration: { warning: 0.5, critical: 0.8 },
    pressure: { warning: { min: 2, max: 8 }, critical: { min: 1, max: 10 } },
    runtimeHours: { warning: 1800, critical: 2800 }
  },
  compressor: {
    temperature: { warning: 80, critical: 90 },
    pressure: { warning: { min: 6, max: 10 }, critical: { min: 5, max: 12 } },
    vibration: { warning: 0.6, critical: 1.0 },
    runtimeHours: { warning: 2200, critical: 3200 }
  }
};

export class PredictiveMaintenanceEngine {
  private sensorHistory: Map<string, SensorReading[]> = new Map();
  private analysisCache: Map<string, PredictiveAnalysis> = new Map();

  /**
   * Analyze sensor data for anomalies and predict equipment failures
   */
  async analyzeSensorData(sensorReadings: SensorReading[]): Promise<SensorAnalysis[]> {
    const analyses: SensorAnalysis[] = [];

    for (const reading of sensorReadings) {
      // Store reading in history
      if (!this.sensorHistory.has(reading.equipmentId)) {
        this.sensorHistory.set(reading.equipmentId, []);
      }
      this.sensorHistory.get(reading.equipmentId)!.push(reading);

      // Analyze current reading
      const analysis = this.analyzeSingleSensor(reading);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Predict equipment failure based on historical data and current readings
   */
  async predictFailure(equipmentId: string, equipmentType: string): Promise<PredictiveAnalysis> {
    // Check cache first
    const cached = this.analysisCache.get(equipmentId);
    if (cached && (Date.now() - cached.lastAnalysis.getTime()) < 3600000) { // 1 hour cache
      return cached;
    }

    const sensorHistory = this.sensorHistory.get(equipmentId) || [];
    const thresholds = EQUIPMENT_THRESHOLDS[equipmentType as keyof typeof EQUIPMENT_THRESHOLDS] || EQUIPMENT_THRESHOLDS.generator;

    // Analyze current status
    const currentStatus = this.analyzeCurrentStatus(sensorHistory, thresholds);
    const failureProbability = this.calculateFailureProbability(sensorHistory, equipmentType);
    const predictedDays = this.predictFailureTimeframe(failureProbability, equipmentType);

    const analysis: PredictiveAnalysis = {
      equipmentId,
      equipmentName: `Equipment ${equipmentId}`,
      status: currentStatus.status,
      predictedFailureInDays: predictedDays,
      confidence: failureProbability.confidence,
      recommendedAction: this.generateRecommendedAction(currentStatus, predictedDays, equipmentType),
      riskLevel: this.calculateRiskLevel(failureProbability.score, predictedDays),
      contributingFactors: currentStatus.factors,
      lastAnalysis: new Date(),
      nextAnalysis: new Date(Date.now() + 3600000) // 1 hour from now
    };

    // Cache the analysis
    this.analysisCache.set(equipmentId, analysis);

    return analysis;
  }

  /**
   * Generate maintenance report with predictions and recommendations
   */
  async generateMaintenanceReport(equipmentIds: string[]): Promise<{
    criticalEquipment: PredictiveAnalysis[];
    upcomingMaintenance: PredictiveAnalysis[];
    recommendations: string[];
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const analyses: PredictiveAnalysis[] = [];

    for (const equipmentId of equipmentIds) {
      try {
        // Assume equipment type for demo - in real implementation, this would come from equipment data
        const analysis = await this.predictFailure(equipmentId, 'generator');
        analyses.push(analysis);
      } catch (error) {
        console.warn(`Failed to analyze equipment ${equipmentId}:`, error);
      }
    }

    const criticalEquipment = analyses.filter(a => a.status === 'critical' || a.riskLevel === 'critical');
    const upcomingMaintenance = analyses.filter(a => 
      a.predictedFailureInDays <= 7 && a.status !== 'critical'
    );

    const recommendations = this.generateOverallRecommendations(analyses);
    const overallRisk = this.calculateOverallRisk(analyses);

    return {
      criticalEquipment,
      upcomingMaintenance,
      recommendations,
      overallRisk
    };
  }

  /**
   * Analyze a single sensor reading
   */
  private analyzeSingleSensor(reading: SensorReading): SensorAnalysis {
    const { value, normalRange, type } = reading;
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    let deviation = 0;
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let anomalyScore = 0;

    // Calculate deviation from normal range
    if (value < normalRange.min) {
      deviation = (normalRange.min - value) / normalRange.min;
      status = deviation > 0.2 ? 'critical' : 'warning';
    } else if (value > normalRange.max) {
      deviation = (value - normalRange.max) / normalRange.max;
      status = deviation > 0.2 ? 'critical' : 'warning';
    }

    // Calculate trend (simplified)
    const equipmentHistory = this.sensorHistory.get(reading.equipmentId) || [];
    if (equipmentHistory.length >= 3) {
      const recentReadings = equipmentHistory.slice(-3).map(r => r.value);
      const slope = (recentReadings[2] - recentReadings[0]) / 2;
      if (Math.abs(slope) > 0.1) {
        trend = slope > 0 ? 'increasing' : 'decreasing';
      }
    }

    // Calculate anomaly score (0-1)
    anomalyScore = Math.min(1, Math.abs(deviation) * 2);

    const recommendations = this.generateSensorRecommendations(reading, status, trend);

    return {
      equipmentId: reading.equipmentId,
      sensorType: reading.type,
      currentValue: reading.value,
      normalRange,
      deviation,
      trend,
      anomalyScore,
      recommendations
    };
  }

  /**
   * Analyze current equipment status based on sensor readings
   */
  private analyzeCurrentStatus(
    sensorHistory: SensorReading[], 
    thresholds: any
  ): { status: 'normal' | 'warning' | 'critical'; factors: string[] } {
    if (sensorHistory.length === 0) {
      return { status: 'normal', factors: ['No sensor data available'] };
    }

    const recentReadings = sensorHistory.slice(-10); // Last 10 readings
    const factors: string[] = [];
    let criticalCount = 0;
    let warningCount = 0;

    for (const reading of recentReadings) {
      const analysis = this.analyzeSingleSensor(reading);
      if (analysis.anomalyScore > 0.8) {
        criticalCount++;
        factors.push(`Critical ${reading.type} reading: ${reading.value}${reading.unit}`);
      } else if (analysis.anomalyScore > 0.5) {
        warningCount++;
        factors.push(`Warning ${reading.type} reading: ${reading.value}${reading.unit}`);
      }
    }

    if (criticalCount >= 2) {
      return { status: 'critical', factors };
    } else if (warningCount >= 3 || criticalCount >= 1) {
      return { status: 'warning', factors };
    } else {
      return { status: 'normal', factors: ['All readings within normal range'] };
    }
  }

  /**
   * Calculate failure probability based on sensor data
   */
  private calculateFailureProbability(
    sensorHistory: SensorReading[], 
    equipmentType: string
  ): { score: number; confidence: number } {
    if (sensorHistory.length < 5) {
      return { score: 0.1, confidence: 0.5 }; // Low confidence with insufficient data
    }

    let anomalyScore = 0;
    let totalReadings = 0;

    for (const reading of sensorHistory.slice(-20)) { // Last 20 readings
      const analysis = this.analyzeSingleSensor(reading);
      anomalyScore += analysis.anomalyScore;
      totalReadings++;
    }

    const avgAnomaly = anomalyScore / totalReadings;
    const runtimeFactor = this.calculateRuntimeFactor(sensorHistory, equipmentType);
    
    // Combine factors for final probability
    const probability = Math.min(0.95, avgAnomaly * 0.7 + runtimeFactor * 0.3);
    const confidence = Math.min(0.95, sensorHistory.length / 50); // More data = higher confidence

    return { score: probability, confidence };
  }

  /**
   * Calculate runtime-based failure factor
   */
  private calculateRuntimeFactor(sensorHistory: SensorReading[], equipmentType: string): number {
    const runtimeReadings = sensorHistory.filter(r => r.type === 'runtime');
    if (runtimeReadings.length === 0) return 0;

    const totalRuntime = runtimeReadings.reduce((sum, r) => sum + r.value, 0);
    const avgRuntime = totalRuntime / runtimeReadings.length;

    const thresholds = EQUIPMENT_THRESHOLDS[equipmentType as keyof typeof EQUIPMENT_THRESHOLDS] || EQUIPMENT_THRESHOLDS.generator;
    const criticalRuntime = thresholds.runtimeHours?.critical || 3000;

    return Math.min(1, avgRuntime / criticalRuntime);
  }

  /**
   * Predict failure timeframe based on probability
   */
  private predictFailureTimeframe(probability: { score: number; confidence: number }, equipmentType: string): number {
    const baseTimeframe = equipmentType === 'generator' ? 30 : 45; // Base days for different equipment
    const adjustedTimeframe = baseTimeframe * (1 - probability.score);
    
    // Apply confidence adjustment
    return Math.max(1, Math.min(90, adjustedTimeframe * probability.confidence));
  }

  /**
   * Generate recommended action based on analysis
   */
  private generateRecommendedAction(
    status: { status: string; factors: string[] },
    predictedDays: number,
    equipmentType: string
  ): string {
    if (status.status === 'critical') {
      return `IMMEDIATE MAINTENANCE REQUIRED: ${status.factors.join(', ')}. Predicted failure in ${predictedDays} days.`;
    } else if (status.status === 'warning') {
      return `Schedule maintenance within 7 days. Issues: ${status.factors.slice(0, 2).join(', ')}. Predicted failure in ${predictedDays} days.`;
    } else if (predictedDays <= 14) {
      return `Plan maintenance within 2 weeks. Predicted failure in ${predictedDays} days.`;
    } else {
      return `Monitor equipment. Next scheduled maintenance in ${Math.floor(predictedDays / 2)} days.`;
    }
  }

  /**
   * Calculate risk level based on probability and timeframe
   */
  private calculateRiskLevel(probability: number, predictedDays: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability > 0.8 || predictedDays <= 3) return 'critical';
    if (probability > 0.6 || predictedDays <= 7) return 'high';
    if (probability > 0.4 || predictedDays <= 14) return 'medium';
    return 'low';
  }

  /**
   * Generate sensor-specific recommendations
   */
  private generateSensorRecommendations(
    reading: SensorReading,
    status: string,
    trend: string
  ): string[] {
    const recommendations: string[] = [];

    if (status === 'critical') {
      recommendations.push(`IMMEDIATE ACTION: ${reading.type} is critically ${reading.value < reading.normalRange.min ? 'low' : 'high'}`);
    } else if (status === 'warning') {
      recommendations.push(`Monitor ${reading.type} closely - value is outside normal range`);
    }

    if (trend === 'increasing' && reading.value > reading.normalRange.max) {
      recommendations.push(`Trend shows increasing ${reading.type} - investigate cause`);
    } else if (trend === 'decreasing' && reading.value < reading.normalRange.min) {
      recommendations.push(`Trend shows decreasing ${reading.type} - check for issues`);
    }

    return recommendations;
  }

  /**
   * Generate overall recommendations for the maintenance report
   */
  private generateOverallRecommendations(analyses: PredictiveAnalysis[]): string[] {
    const recommendations: string[] = [];
    const criticalCount = analyses.filter(a => a.riskLevel === 'critical').length;
    const highCount = analyses.filter(a => a.riskLevel === 'high').length;

    if (criticalCount > 0) {
      recommendations.push(`CRITICAL: ${criticalCount} equipment items require immediate maintenance`);
    }
    if (highCount > 0) {
      recommendations.push(`HIGH PRIORITY: ${highCount} equipment items need maintenance within 7 days`);
    }

    const upcomingCount = analyses.filter(a => a.predictedFailureInDays <= 30).length;
    if (upcomingCount > 0) {
      recommendations.push(`UPCOMING: ${upcomingCount} equipment items predicted to fail within 30 days`);
    }

    if (analyses.some(a => a.confidence < 0.7)) {
      recommendations.push('LOW CONFIDENCE: Some predictions have low confidence - consider collecting more sensor data');
    }

    return recommendations;
  }

  /**
   * Calculate overall risk level for the facility
   */
  private calculateOverallRisk(analyses: PredictiveAnalysis[]): 'low' | 'medium' | 'high' | 'critical' {
    const riskScores = analyses.map(a => {
      switch (a.riskLevel) {
        case 'critical': return 4;
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 1;
      }
    });

    const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;

    if (avgRisk >= 3.5) return 'critical';
    if (avgRisk >= 2.5) return 'high';
    if (avgRisk >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Clear cache for specific equipment
   */
  clearCache(equipmentId?: string): void {
    if (equipmentId) {
      this.analysisCache.delete(equipmentId);
      this.sensorHistory.delete(equipmentId);
    } else {
      this.analysisCache.clear();
      this.sensorHistory.clear();
    }
  }
}

// Export singleton instance
export const predictiveEngine = new PredictiveMaintenanceEngine();
