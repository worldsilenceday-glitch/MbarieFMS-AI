// ============================================
// AI Insights Dashboard - Type Definitions
// ============================================

// Core data model returned from useInsights()
export interface AIInsightSummary {
  id: string;
  category: "workflow" | "risk" | "document" | "permit";
  title: string;
  description?: string;
  kpi?: string;
  value?: number | string;
  trend?: number; // positive/negative %
  icon?: string; // lucide icon name or emoji
  color?: string; // tailwind color e.g., "emerald", "rose"
}

// Unified state returned from useInsights() hook
export interface UseInsightsState {
  insights: AIInsightSummary[];
  isLoading: boolean;
  error?: string | null;
  refresh: () => Promise<void>;
  isLive?: boolean;
}

// ChartWidget prop interface
export interface ChartWidgetProps {
  title: string;
  type: "line" | "bar" | "pie";
  data: ChartDataPoint[];
  showPredictions?: boolean;
}

// Simple chart data point
export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: any; // Allow additional properties for Recharts compatibility
}

// InsightCard props interface
export interface InsightCardProps {
  title: string;
  value: number | string;
  icon?: string;
  trend?: number;
  color?: string;
}

// AnalyticsHeader prop interface
export interface AnalyticsHeaderProps {
  title?: string;
  range?: "today" | "week" | "month" | "custom";
  onRangeChange?: (range: string) => void;
  onRefresh?: () => void;
}
