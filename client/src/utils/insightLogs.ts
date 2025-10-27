export interface InsightLogEntry {
  category: string;
  text: string;
  reasoning: string;
  timestamp: string;
  actionType?: string;
  departmentId?: string;
  confidence?: number;
}

export function logAIInsight(
  category: string,
  text: string,
  reasoning: string,
  actionType?: string,
  departmentId?: string,
  confidence?: number
): void {
  const entry: InsightLogEntry = {
    category,
    text,
    reasoning,
    timestamp: new Date().toISOString(),
    actionType,
    departmentId,
    confidence
  };

  try {
    const logs = getInsightLogs();
    logs.push(entry);
    
    // Keep only the last 100 logs to prevent localStorage overflow
    const trimmedLogs = logs.slice(-100);
    
    localStorage.setItem("ai_insight_logs", JSON.stringify(trimmedLogs));
    
    console.log('AI Insight logged:', {
      category,
      text: text.substring(0, 50) + '...',
      timestamp: entry.timestamp
    });
  } catch (error) {
    console.error('Failed to log AI insight:', error);
  }
}

export function getInsightLogs(): InsightLogEntry[] {
  try {
    const logs = localStorage.getItem("ai_insight_logs");
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Failed to retrieve insight logs:', error);
    return [];
  }
}

export function getInsightLogsByCategory(category: string): InsightLogEntry[] {
  const logs = getInsightLogs();
  return logs.filter(log => log.category === category);
}

export function getRecentInsightLogs(limit: number = 10): InsightLogEntry[] {
  const logs = getInsightLogs();
  return logs.slice(-limit).reverse(); // Most recent first
}

export function clearInsightLogs(): void {
  try {
    localStorage.removeItem("ai_insight_logs");
    console.log('AI insight logs cleared');
  } catch (error) {
    console.error('Failed to clear insight logs:', error);
  }
}

export function getInsightStats(): {
  totalLogs: number;
  byCategory: Record<string, number>;
  recentActivity: number;
} {
  const logs = getInsightLogs();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const byCategory: Record<string, number> = {};
  let recentActivity = 0;
  
  logs.forEach(log => {
    // Count by category
    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    
    // Count recent activity (last 24 hours)
    const logDate = new Date(log.timestamp);
    if (logDate > oneDayAgo) {
      recentActivity++;
    }
  });
  
  return {
    totalLogs: logs.length,
    byCategory,
    recentActivity
  };
}

// Export logs for analysis or reporting
export function exportInsightLogs(format: 'json' | 'csv' = 'json'): string {
  const logs = getInsightLogs();
  
  if (format === 'csv') {
    const headers = ['Timestamp', 'Category', 'Text', 'Reasoning', 'Action Type', 'Department', 'Confidence'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = [
        log.timestamp,
        `"${log.category}"`,
        `"${log.text.replace(/"/g, '""')}"`,
        `"${log.reasoning.replace(/"/g, '""')}"`,
        log.actionType || '',
        log.departmentId || '',
        log.confidence || ''
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
  
  // Default to JSON
  return JSON.stringify(logs, null, 2);
}
