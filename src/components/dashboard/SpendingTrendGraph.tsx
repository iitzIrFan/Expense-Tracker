import { Expense } from '@/types/expense';
import { formatCurrency } from '@/utils/formatters';
import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SpendingTrendGraphProps {
  expenses: Expense[];
}

export const SpendingTrendGraph: React.FC<SpendingTrendGraphProps> = ({ expenses }) => {
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const data = {
    labels: sortedExpenses.map(exp => new Date(exp.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Daily Spending',
        data: sortedExpenses.map(exp => exp.total || 0),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Total: ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatCurrency(value),
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Spending Trend</h3>
      </div>
      <div className="p-4" style={{ height: '400px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}; 