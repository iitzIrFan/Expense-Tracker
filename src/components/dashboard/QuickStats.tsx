import { formatCurrency } from '@/utils/formatters';

interface QuickStatsProps {
  dailyAverage: number;
  highestDay: { date: string; amount: number };
  lowestDay: { date: string; amount: number };
  mostFrequentCategory: { name: string; count: number };
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  dailyAverage,
  highestDay,
  lowestDay,
  mostFrequentCategory,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-medium text-gray-500">Daily Average</h3>
        <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(dailyAverage)}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-medium text-gray-500">Highest Spending Day</h3>
        <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(highestDay.amount)}</p>
        <p className="text-sm text-gray-500">{new Date(highestDay.date).toLocaleDateString()}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-medium text-gray-500">Lowest Spending Day</h3>
        <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(lowestDay.amount)}</p>
        <p className="text-sm text-gray-500">{new Date(lowestDay.date).toLocaleDateString()}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-medium text-gray-500">Most Used Category</h3>
        <p className="mt-2 text-xl font-semibold text-gray-900">{mostFrequentCategory.name}</p>
        <p className="text-sm text-gray-500">{mostFrequentCategory.count} transactions</p>
      </div>
    </div>
  );
}; 