import { Expense } from '@/types/expense';
import { formatCurrency } from '@/utils/formatters';
import React from 'react';

interface ExpenseSummaryProps {
  expense: Expense | null;
  averages: { [key: string]: number };
}

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({ expense, averages }) => {
  const categories = [
    { key: 'morningTea', label: 'Morning Tea' },
    { key: 'morningBreakfast', label: 'Morning Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'afternoonTea', label: 'Afternoon Tea' },
    { key: 'afternoonBreakfast', label: 'Afternoon Breakfast' },
    { key: 'dinner', label: 'Dinner' },
    { key: 'extra', label: 'Extra' }
  ];

  const calculateTotal = (data: Expense | { [key: string]: number } | null): number => {
    if (!data) return 0;
    return categories.reduce((sum, { key }) => {
      const value = data[key as keyof typeof data];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  const getComparisonClass = (current: number, average: number) => {
    if (current === 0) return 'text-gray-500';
    if (current > average) return 'text-red-500';
    if (current < average) return 'text-green-500';
    return 'text-gray-900';
  };

  const currentTotal = calculateTotal(expense || null);
  const averageTotal = calculateTotal(averages);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">
        Expense Summary for {expense?.date ? new Date(expense.date).toLocaleDateString() : 'Unknown Date'}
      </h3>

      <div className="space-y-4">
        {categories.map(({ key, label }) => {
          const currentValue = expense?.[key as keyof Expense] as number || 0;
          const averageValue = averages[key] || 0;

          return (
            <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{label}</span>
              <div className="flex items-center space-x-4">
                <span className={getComparisonClass(currentValue, averageValue)}>
                  {formatCurrency(currentValue)}
                </span>
                <span className="text-sm text-gray-500">
                  (avg: {formatCurrency(averageValue)})
                </span>
              </div>
            </div>
          );
        })}

        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <div className="flex items-center space-x-4">
              <span className={`text-lg font-bold ${getComparisonClass(currentTotal, averageTotal)}`}>
                {formatCurrency(currentTotal)}
              </span>
              <span className="text-sm text-gray-500">
                (avg: {formatCurrency(averageTotal)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 