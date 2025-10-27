import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Calendar, Settings, Download, Circle } from 'lucide-react';
import { AnalyticsHeaderProps } from '../types/insights';
import { exportToPDF, exportToCSV } from '../utils/exportUtils';

interface ExtendedAnalyticsHeaderProps extends AnalyticsHeaderProps {
  insights?: any[];
  isLive?: boolean;
}

const AnalyticsHeader: React.FC<ExtendedAnalyticsHeaderProps> = ({ 
  title = "AI Insights Dashboard",
  range = "week",
  onRangeChange,
  onRefresh,
  insights = [],
  isLive = false
}) => {
  const timeRanges = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom" }
  ];

  const handleExportPDF = () => {
    if (insights.length > 0) {
      exportToPDF(insights);
    }
  };

  const handleExportCSV = () => {
    if (insights.length > 0) {
      exportToCSV(insights);
    }
  };

  // Calculate dynamic stats
  const totalInsights = insights.length;
  const avgEfficiency = insights
    .filter(insight => insight.category === 'workflow' && typeof insight.value === 'string')
    .map(insight => {
      const match = insight.value.toString().match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    })
    .filter(value => !isNaN(value))
    .reduce((sum, value, _, array) => sum + value / array.length, 0) || 87;

  const trendingUp = insights.filter(insight => (insight.trend || 0) > 0).length;
  const needsAttention = insights.filter(insight => (insight.trend || 0) < -10).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-6 rounded-xl border border-white/10 backdrop-blur-sm mb-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Title Section */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time AI-powered operational insights and analytics
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Live Data Indicator */}
          {isLive && (
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full">
              <Circle className="w-2 h-2 fill-emerald-500 animate-pulse" />
              <span className="text-xs font-medium">LIVE DATA</span>
            </div>
          )}

          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select 
              value={range}
              onChange={(e) => onRangeChange?.(e.target.value)}
              className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeRanges.map((timeRange) => (
                <option key={timeRange.value} value={timeRange.value}>
                  {timeRange.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg transition-colors duration-200">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
            
            {/* Export Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-1">
                <button
                  onClick={handleExportPDF}
                  disabled={insights.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export as PDF
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={insights.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Refresh</span>
          </button>

          {/* Settings Button */}
          <button className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg transition-colors duration-200">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalInsights}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Insights</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-500">{avgEfficiency.toFixed(0)}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Efficiency</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{trendingUp}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Trending Up</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-rose-500">{needsAttention}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Needs Attention</div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsHeader;
