export interface OfflineCache {
  insights: any[];
  recommendations: any[];
  timestamp: string;
  summary?: string;
}

export interface PendingSyncItem {
  id: string;
  type: 'action' | 'upload' | 'insight' | 'recommendation' | 'maintenance';
  data: any;
  timestamp: string;
  retryCount: number;
  endpoint?: string;
  method?: string;
}

export interface OfflineAgentResponse {
  success: boolean;
  message: string;
  data?: any;
  source: 'online' | 'offline';
}

export interface VoiceCommand {
  transcript: string;
  timestamp: string;
  processed: boolean;
  response?: string;
}
