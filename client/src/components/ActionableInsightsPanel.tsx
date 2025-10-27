import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Lightbulb, AlertTriangle, ShieldCheck, Wrench, Info, Play } from 'lucide-react';
import { Recommendation } from '../utils/recommendationEngine';
import { logAIInsight } from '../utils/insightLogs';

const icons = {
  'Performance Optimization': <Lightbulb className="w-4 h-4 text-green-500" />,
  'Risk Mitigation': <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  'Compliance & Safety': <ShieldCheck className="w-4 h-4 text-blue-500" />,
  'Maintenance Scheduling': <Wrench className="w-4 h-4 text-orange-500" />,
  'General': <Lightbulb className="w-4 h-4 text-gray-500" />,
};

interface ActionableInsightsPanelProps {
  insights: Recommendation[];
  onExecuteAction?: (recommendation: Recommendation) => void;
}

export default function ActionableInsightsPanel({ insights, onExecuteAction }: ActionableInsightsPanelProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const handleExecuteAction = (recommendation: Recommendation) => {
    // Log the action execution
    logAIInsight(
      recommendation.category,
      recommendation.text,
      recommendation.reasoning || 'No reasoning provided'
    );

    // Trigger the action callback if provided
    if (onExecuteAction) {
      onExecuteAction(recommendation);
    }

    // Show success feedback
    alert(`Action executed: ${recommendation.text}`);
  };

  const toggleExpand = (index: number) => {
    setExpandedInsight(expandedInsight === index ? null : index);
  };


  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (!insights || insights.length === 0) {
    return (
      <div className="glass-card p-8 rounded-xl border border-white/10 backdrop-blur-sm text-center">
        <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Recommendations Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          AI recommendations will appear here based on your operational data and trends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          AI Recommendations
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {insights.length} actionable insights
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                {icons[insight.category] || icons.General}
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {insight.category}
                </h4>
                <div className="ml-auto flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceBg(insight.confidence)}`}>
                    {insight.confidence}%
                  </span>
                  <button
                    onClick={() => toggleExpand(index)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Show reasoning"
                  >
                    <Info className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Recommendation Text */}
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                {insight.text}
              </p>

              {/* Expanded Reasoning */}
              {expandedInsight === index && insight.reasoning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                    <strong>AI Reasoning:</strong> {insight.reasoning}
                  </p>
                </motion.div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {insight.departmentId && (
                    <span>Target: {insight.departmentId}</span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExecuteAction(insight)}
                  className="flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Execute
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400 mt-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>High Confidence ({insights.filter(i => i.confidence >= 80).length})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>Medium Confidence ({insights.filter(i => i.confidence >= 60 && i.confidence < 80).length})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Low Confidence ({insights.filter(i => i.confidence < 60).length})</span>
        </div>
      </div>
    </div>
  );
}
