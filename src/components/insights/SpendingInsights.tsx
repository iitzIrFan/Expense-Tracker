import { SpendingInsight } from '@/services/insightsService';
import { ChartBarIcon, ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface SpendingInsightsProps {
  insights: SpendingInsight[];
}

interface ChartData {
  name: string;
  amount: number;
}

export const SpendingInsights: React.FC<SpendingInsightsProps> = ({ insights }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'saving':
        return <LightBulbIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ChartBarIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border ${
            insight.type === 'saving'
              ? 'border-green-200 bg-green-50'
              : insight.type === 'warning'
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="flex items-start">
            {getIcon(insight.type)}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{insight.message}</p>
              {insight.amount && (
                <p className="mt-1 text-sm text-gray-500">
                  Amount: {formatCurrency(insight.amount)}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 