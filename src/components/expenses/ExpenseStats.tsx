import { Expense } from '@/types/expense';
import React from 'react';

interface ExpenseStatsProps {
  expenses: Expense[];
  period: 'week' | 'month';
}

export const ExpenseStats: React.FC<ExpenseStatsProps> = ({ expenses, period }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateStats = () => {
    if (!expenses.length) return null;

    const total = expenses.reduce((sum, exp) => sum + (exp.total || 0), 0);
    const avg = total / expenses.length;
    const max = Math.max(...expenses.map(exp => exp.total || 0));
    const min = Math.min(...expenses.map(exp => exp.total || 0));

    const categories = expenses.reduce((acc, exp) => {
      Object.entries(exp).forEach(([key, value]) => {
        if (typeof value === 'number' && key !== 'total') {
          acc[key] = (acc[key] || 0) + value;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    return { total, avg, max, min, categories };
  };

  const stats = calculateStats();
  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        {period === 'week' ? 'Weekly' : 'Monthly'} Statistics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-xl font-bold text-indigo-600">
            {formatCurrency(stats.total)}
          </p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Average/Day</p>
          <p className="text-xl font-bold text-indigo-600">
            {formatCurrency(stats.avg)}
          </p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Highest Day</p>
          <p className="text-xl font-bold text-indigo-600">
            {formatCurrency(stats.max)}
          </p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Lowest Day</p>
          <p className="text-xl font-bold text-indigo-600">
            {formatCurrency(stats.min)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-md font-semibold mb-3">Category Breakdown</h4>
        <div className="space-y-2">
          {Object.entries(stats.categories)
            .sort(([, a], [, b]) => b - a)
            .map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-gray-600">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}; 