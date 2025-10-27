import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useInsights } from '../hooks/useInsights';
import AnalyticsHeader from '../components/AnalyticsHeader';
import InsightCard from '../components/InsightCard';
import ChartWidget from '../components/ChartWidget';
import ActionableInsightsPanel from '../components/ActionableInsightsPanel';
import { ChartDataPoint } from '../types/insights';
import { AlertCircle, Loader2, TrendingUp, TrendingDown, Minus, Activity, Zap, Lightbulb } from 'lucide-react';
import { predictiveAnalytics, PredictiveAnalytics } from '../utils/predictive';
import { generateRecommendations, InsightOverview, Recommendation } from '../utils/recommendationEngine';
import { useSmartActions } from '../hooks/useSmartActions';

const AIInsightsDashboard: React.FC = () => {
  const { insights, isLoading, error, refresh, isLive } = useInsights();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [predictiveData, setPredictiveData] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const { executeAction } = useSmartActions();

  // Generate enhanced chart data with predictions
  const generateChartData = () => {
    const baseData: ChartDataPoint[] = [
      { label: 'Mon', value: 85, actual: true },
      { label: 'Tue', value: 87, actual: true },
      { label: 'Wed', value: 83, actual: true },
      { label: 'Thu', value: 89, actual: true },
      { label: 'Fri', value: 86, actual: true },
      { label: 'Sat', value: 88, actual: true },
      { label: 'Sun', value: 90, actual: true },
    ];

    // Add predictions if available
    if (predictiveData?.predictions) {
      predictiveData.predictions.forEach((pred: any, index: number) => {
        baseData.push({
          label: `D+${index + 1}`,
          value: pred.predicted,
          actual: false,
          predicted: true,
          confidence: pred.confidence,
          lowerBound: pred.lowerBound,
          upperBound: pred.upperBound
        });
      });
    }

    return baseData;
  };

  const riskDistributionData: ChartDataPoint[] = [
    { label: 'Low', value: 65 },
    { label: 'Medium', value: 25 },
    { label: 'High', value: 10 },
  ];

  const documentTypesData: ChartDataPoint[] = [
    { label: 'Permits', value: 35 },
    { label: 'Reports', value: 25 },
    { label: 'Contracts', value: 20 },
    { label: 'Compliance', value: 15 },
    { label: 'Other', value: 5 },
  ];

  // Generate recommendations when insights and predictive data are available
  useEffect(() => {
    if (insights.length > 0 && !isGeneratingRecommendations) {
      setIsGeneratingRecommendations(true);
      
      const insightOverview: InsightOverview = {
        insights: insights,
        predictiveData: predictiveData,
        trend: predictiveData?.trend || 'stable',
        confidence: predictiveData?.confidence || 0.8
      };
      
      generateRecommendations(insightOverview)
        .then(recs => {
          setRecommendations(recs);
          setIsGeneratingRecommendations(false);
          
          if (recs.length > 0) {
            toast.success(`Generated ${recs.length} AI recommendations`);
          }
        })
        .catch(err => {
          console.error('Recommendation generation error:', err);
          setIsGeneratingRecommendations(false);
        });
    }
  }, [insights, predictiveData]);

  // Run predictive analytics when insights change
  useEffect(() => {
    if (insights.length > 0 && !isPredicting) {
      setIsPredicting(true);
      
      const workflowData = PredictiveAnalytics.prepareWorkflowData(insights);
      
      predictiveAnalytics.analyzeWorkflowPerformance(workflowData)
        .then(result => {
          setPredictiveData(result);
          setIsPredicting(false);
          
          // Show prediction toast
          if (result.confidence > 0.8) {
            toast.success(`High-confidence predictions generated (${(result.confidence * 100).toFixed(0)}%)`);
          }
        })
        .catch(err => {
          console.error('Prediction error:', err);
          setIsPredicting(false);
        });
    }
  }, [insights]);

  const handleRefresh = async () => {
    await refresh();
    toast.success('Data refreshed successfully');
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range as 'today' | 'week' | 'month' | 'custom');
    toast.success(`Time range updated to ${range}`);
  };

  const handleExecuteAction = async (recommendation: Recommendation) => {
    await executeAction(recommendation);
  };


  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-8 rounded-xl border border-white/10 backdrop-blur-sm text-center">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Failed to Load Insights
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnalyticsHeader
          range={timeRange}
          onRangeChange={handleTimeRangeChange}
          onRefresh={handleRefresh}
          insights={insights}
          isLive={isLive}
        />

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8 rounded-xl border border-white/10 backdrop-blur-sm text-center mb-6"
            >
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading AI insights...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {insights.slice(0, 6).map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <InsightCard
                    title={insight.title}
                    value={insight.value || 'N/A'}
                    icon={insight.icon}
                    trend={insight.trend}
                    color={insight.color}
                  />
                </motion.div>
              ))}
            </div>

            {/* Predictive Analytics Section */}
            {predictiveData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="glass-card p-6 rounded-xl border border-white/10 backdrop-blur-sm mb-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Predictive Analytics
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {predictiveData.trend === 'up' && (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    )}
                    {predictiveData.trend === 'down' && (
                      <TrendingDown className="w-5 h-5 text-rose-500" />
                    )}
                    {predictiveData.trend === 'stable' && (
                      <Minus className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {predictiveData.trend?.toUpperCase()} TREND
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Performance Forecast
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {predictiveData.recommendation}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Confidence: <strong className="text-emerald-500">{(predictiveData.confidence * 100).toFixed(0)}%</strong>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Next 7 days forecast
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Key Predictions
                    </h5>
                    <div className="space-y-2">
                      {predictiveData.predictions?.slice(0, 3).map((pred: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {pred.date}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {pred.predicted.toFixed(1)}%
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            pred.confidence > 0.8 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {(pred.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartWidget
                title="Workflow Trends & Predictions"
                type="line"
                data={generateChartData()}
                showPredictions={true}
              />
              <ChartWidget
                title="Risk Score Distribution"
                type="pie"
                data={riskDistributionData}
              />
              <ChartWidget
                title="Document Types Processed"
                type="bar"
                data={documentTypesData}
              />
              <ChartWidget
                title="Compliance Over Time"
                type="line"
                data={generateChartData().map(item => ({ ...item, value: item.value * 1.1 }))}
              />
            </div>

            {/* AI Recommendations Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="glass-card p-6 rounded-xl border border-white/10 backdrop-blur-sm mt-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    AI Recommendations & Actionable Insights
                  </h3>
                </div>
                {isGeneratingRecommendations && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating recommendations...</span>
                  </div>
                )}
              </div>
              
              <ActionableInsightsPanel 
                insights={recommendations}
                onExecuteAction={handleExecuteAction}
              />
            </motion.div>

            {/* Additional Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="glass-card p-6 rounded-xl border border-white/10 backdrop-blur-sm mt-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Summary
                </h3>
                {isLive && (
                  <div className="flex items-center space-x-2 text-emerald-500">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">Live Updates Active</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">94%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-emerald-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-500">2.3h</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Response</div>
                </div>
                <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-purple-500">1,247</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Actions</div>
                </div>
                <div className="text-center p-4 bg-orange-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-orange-500">98%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsDashboard;
