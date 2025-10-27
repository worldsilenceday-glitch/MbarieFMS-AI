import React from 'react';
import { motion } from 'framer-motion';
import { InsightCardProps } from '../types/insights';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const InsightCard: React.FC<InsightCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'blue' 
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-rose-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    if (trend > 0) return 'text-emerald-500';
    if (trend < 0) return 'text-rose-500';
    return 'text-gray-500';
  };

  const getIconComponent = () => {
    // This would be expanded to map icon names to actual Lucide icons
    // For now, using a placeholder
    return (
      <div className={`w-12 h-12 rounded-full bg-${color}-500/10 flex items-center justify-center`}>
        <div className={`w-6 h-6 bg-${color}-500 rounded-full`}></div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-6 rounded-xl border border-white/10 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </span>
            {trend !== undefined && (
              <div className="flex items-center space-x-1">
                {getTrendIcon()}
                <span className={`text-sm font-medium ${getTrendColor()}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
        </div>
        {icon && getIconComponent()}
      </div>
      
      {trend !== undefined && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                trend > 0 ? 'bg-emerald-500' : trend < 0 ? 'bg-rose-500' : 'bg-gray-500'
              }`}
              style={{ width: `${Math.min(Math.abs(trend), 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InsightCard;
