import { useState, useEffect, useCallback } from 'react';
import { SensorReading, SensorAnalysis } from '../types/maintenance';
import { predictiveEngine } from '../modules/maintenance/predictiveEngine';

interface UseSensorStreamReturn {
  sensorReadings: SensorReading[];
  sensorAnalyses: SensorAnalysis[];
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  error: string | null;
  startStream: () => void;
  stopStream: () => void;
  addMockSensorData: (equipmentId: string, type: string, value: number) => void;
  clearData: () => void;
}

/**
 * Hook for handling IoT sensor data streams and real-time analysis
 */
export const useSensorStream = (): UseSensorStreamReturn => {
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [sensorAnalyses, setSensorAnalyses] = useState<SensorAnalysis[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Mock sensor data generator for demo purposes
  const generateMockSensorData = useCallback((equipmentId: string): SensorReading[] => {
    const equipmentTypes = ['generator', 'ac_unit', 'pump', 'compressor'];
    const equipmentType = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
    
    const baseReadings: Omit<SensorReading, 'id' | 'timestamp'>[] = [];

    switch (equipmentType) {
      case 'generator':
        baseReadings.push(
          { equipmentId, type: 'temperature', value: 75 + Math.random() * 30, unit: '°C', normalRange: { min: 60, max: 90 }, status: 'normal' },
          { equipmentId, type: 'vibration', value: 0.3 + Math.random() * 1.0, unit: 'mm/s', normalRange: { min: 0.1, max: 0.8 }, status: 'normal' },
          { equipmentId, type: 'voltage', value: 220 + Math.random() * 40, unit: 'V', normalRange: { min: 210, max: 250 }, status: 'normal' },
          { equipmentId, type: 'runtime', value: 500 + Math.random() * 2500, unit: 'hours', normalRange: { min: 0, max: 3000 }, status: 'normal' }
        );
        break;
      case 'ac_unit':
        baseReadings.push(
          { equipmentId, type: 'temperature', value: 12 + Math.random() * 10, unit: '°C', normalRange: { min: 10, max: 20 }, status: 'normal' },
          { equipmentId, type: 'pressure', value: 200 + Math.random() * 300, unit: 'psi', normalRange: { min: 100, max: 400 }, status: 'normal' },
          { equipmentId, type: 'runtime', value: 300 + Math.random() * 2000, unit: 'hours', normalRange: { min: 0, max: 2500 }, status: 'normal' }
        );
        break;
      case 'pump':
        baseReadings.push(
          { equipmentId, type: 'vibration', value: 0.2 + Math.random() * 0.6, unit: 'mm/s', normalRange: { min: 0.1, max: 0.5 }, status: 'normal' },
          { equipmentId, type: 'pressure', value: 3 + Math.random() * 7, unit: 'bar', normalRange: { min: 2, max: 8 }, status: 'normal' },
          { equipmentId, type: 'runtime', value: 400 + Math.random() * 2200, unit: 'hours', normalRange: { min: 0, max: 2800 }, status: 'normal' }
        );
        break;
      case 'compressor':
        baseReadings.push(
          { equipmentId, type: 'temperature', value: 70 + Math.random() * 25, unit: '°C', normalRange: { min: 60, max: 90 }, status: 'normal' },
          { equipmentId, type: 'pressure', value: 7 + Math.random() * 5, unit: 'bar', normalRange: { min: 6, max: 10 }, status: 'normal' },
          { equipmentId, type: 'vibration', value: 0.3 + Math.random() * 0.7, unit: 'mm/s', normalRange: { min: 0.2, max: 0.6 }, status: 'normal' }
        );
        break;
    }

    return baseReadings.map(reading => ({
      ...reading,
      id: `sensor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }));
  }, []);

  // Process sensor data and update analyses
  const processSensorData = useCallback(async (readings: SensorReading[]) => {
    try {
      const analyses = await predictiveEngine.analyzeSensorData(readings);
      setSensorAnalyses(prev => {
        const updated = [...prev];
        analyses.forEach(analysis => {
          const existingIndex = updated.findIndex(a => 
            a.equipmentId === analysis.equipmentId && a.sensorType === analysis.sensorType
          );
          if (existingIndex >= 0) {
            updated[existingIndex] = analysis;
          } else {
            updated.push(analysis);
          }
        });
        return updated.slice(-100); // Keep last 100 analyses
      });
    } catch (err) {
      console.error('Error processing sensor data:', err);
      setError(`Failed to process sensor data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  // Add new sensor reading
  const addSensorReading = useCallback((reading: SensorReading) => {
    setSensorReadings(prev => {
      const newReadings = [...prev, reading];
      return newReadings.slice(-500); // Keep last 500 readings
    });
  }, []);

  // Start sensor stream (mock implementation)
  const startStream = useCallback(() => {
    setConnectionStatus('connecting');
    setError(null);

    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus('connected');

      // Start generating mock sensor data
      const equipmentIds = ['GEN-01', 'GEN-02', 'AC-01', 'AC-02', 'PUMP-01', 'COMP-01'];
      let intervalId: number;

      const generateData = () => {
        const randomEquipmentId = equipmentIds[Math.floor(Math.random() * equipmentIds.length)];
        const mockReadings = generateMockSensorData(randomEquipmentId);
        
        mockReadings.forEach(reading => {
          addSensorReading(reading);
        });

        // Process the new readings
        processSensorData(mockReadings);
      };

      // Generate data every 5 seconds
      intervalId = window.setInterval(generateData, 5000);

      // Initial data generation
      generateData();

      // Store interval ID for cleanup
      return () => clearInterval(intervalId);
    }, 1000);
  }, [generateMockSensorData, addSensorReading, processSensorData]);

  // Stop sensor stream
  const stopStream = useCallback(() => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
    // In a real implementation, this would close the WebSocket connection
  }, []);

  // Add custom mock sensor data for testing
  const addMockSensorData = useCallback((equipmentId: string, type: string, value: number) => {
    const normalRanges: Record<string, { min: number; max: number }> = {
      temperature: { min: 60, max: 90 },
      vibration: { min: 0.1, max: 0.8 },
      voltage: { min: 210, max: 250 },
      pressure: { min: 2, max: 8 },
      runtime: { min: 0, max: 3000 }
    };

    const reading: SensorReading = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      equipmentId,
      type: type as any,
      value,
      unit: type === 'temperature' ? '°C' : 
            type === 'vibration' ? 'mm/s' : 
            type === 'voltage' ? 'V' : 
            type === 'pressure' ? 'bar' : 'hours',
      timestamp: new Date(),
      normalRange: normalRanges[type] || { min: 0, max: 100 },
      status: 'normal'
    };

    // Determine status based on normal range
    if (value < reading.normalRange.min || value > reading.normalRange.max) {
      const deviation = Math.max(
        (reading.normalRange.min - value) / reading.normalRange.min,
        (value - reading.normalRange.max) / reading.normalRange.max
      );
      reading.status = deviation > 0.2 ? 'critical' : 'warning';
    }

    addSensorReading(reading);
    processSensorData([reading]);
  }, [addSensorReading, processSensorData]);

  // Clear all data
  const clearData = useCallback(() => {
    setSensorReadings([]);
    setSensorAnalyses([]);
    predictiveEngine.clearCache();
  }, []);

  // Auto-start stream on component mount for demo
  useEffect(() => {
    startStream();
    return stopStream;
  }, [startStream, stopStream]);

  return {
    sensorReadings,
    sensorAnalyses,
    isConnected,
    connectionStatus,
    error,
    startStream,
    stopStream,
    addMockSensorData,
    clearData
  };
};

// WebSocket implementation for real sensor streams
export class SensorWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private url: string,
    private onMessage: (data: SensorReading) => void,
    private onError: (error: string) => void,
    private onStatusChange: (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void
  ) {}

  connect(): void {
    this.onStatusChange('connecting');
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.onStatusChange('connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.isValidSensorReading(data)) {
            this.onMessage(data);
          }
        } catch (err) {
          console.error('Error parsing sensor data:', err);
        }
      };

      this.ws.onclose = () => {
        this.onStatusChange('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        this.onStatusChange('error');
        this.onError(`WebSocket error: ${error}`);
      };

    } catch (err) {
      this.onStatusChange('error');
      this.onError(`Failed to connect: ${err}`);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private isValidSensorReading(data: any): data is SensorReading {
    return (
      typeof data.id === 'string' &&
      typeof data.equipmentId === 'string' &&
      typeof data.type === 'string' &&
      typeof data.value === 'number' &&
      typeof data.unit === 'string' &&
      data.timestamp &&
      data.normalRange &&
      typeof data.normalRange.min === 'number' &&
      typeof data.normalRange.max === 'number'
    );
  }

  sendCommand(command: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    }
  }
}

// Utility function to simulate sensor data for testing
export const simulateSensorAnomaly = (
  equipmentId: string,
  sensorType: string,
  anomalyValue: number
): SensorReading => {
  const normalRanges: Record<string, { min: number; max: number }> = {
    temperature: { min: 60, max: 90 },
    vibration: { min: 0.1, max: 0.8 },
    voltage: { min: 210, max: 250 },
    pressure: { min: 2, max: 8 }
  };

  const range = normalRanges[sensorType] || { min: 0, max: 100 };
  const status = anomalyValue < range.min || anomalyValue > range.max ? 'critical' : 'normal';

  return {
    id: `anomaly-${Date.now()}`,
    equipmentId,
    type: sensorType as any,
    value: anomalyValue,
    unit: sensorType === 'temperature' ? '°C' : 
          sensorType === 'vibration' ? 'mm/s' : 
          sensorType === 'voltage' ? 'V' : 'bar',
    timestamp: new Date(),
    normalRange: range,
    status
  };
};
