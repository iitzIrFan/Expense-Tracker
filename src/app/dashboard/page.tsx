'use client';

import { DatePicker } from '@/components/common/DatePicker';
import { SpendingTrendGraph } from '@/components/dashboard/SpendingTrendGraph';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { expenseService } from '@/services/expenseService';
import { Expense } from '@/types/expense';
import { formatCurrency } from '@/utils/formatters';
import { CalendarIcon, ChartBarIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface CategoryTotal {
  category: string;
  total: number;
  transactions: number;
}

interface DashboardStats {
  dailyAverage: number;
  monthlyTotal: number;
  highestSpending: { date: string; amount: number };
  lowestSpending: { date: string; amount: number };
  mostFrequentCategory: string;
  spendingTrend: 'increasing' | 'decreasing' | 'stable';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Get first and last day of current month
  const getDefaultDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Format dates to YYYY-MM-DD
    const formatDate = (date: Date) => {
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split('T')[0];
    };

    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  // Add quick select options for date ranges
  const handleQuickSelect = (range: 'thisMonth' | 'lastMonth' | 'last30Days') => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (range) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last30Days':
        end = now;
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const formatDate = (date: Date) => {
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split('T')[0];
    };

    setDateRange({
      start: formatDate(start),
      end: formatDate(end)
    });
  };

  const categories = [
    { key: 'morningTea', label: 'Morning Tea' },
    { key: 'morningBreakfast', label: 'Morning Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'afternoonTea', label: 'Afternoon Tea' },
    { key: 'afternoonBreakfast', label: 'Afternoon Breakfast' },
    { key: 'dinner', label: 'Dinner' },
    { key: 'extra', label: 'Extra' }
  ];

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, dateRange]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allExpenses = await expenseService.getExpensesByDateRange(
        user.uid,
        dateRange.start,
        dateRange.end
      );

      setExpenses(allExpenses);
      calculateStats(allExpenses);
      calculateCategoryTotals(allExpenses);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (expenses: Expense[]) => {
    if (!expenses.length) {
      setStats(null);
      return;
    }

    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.total || 0), 0);
    const sortedByAmount = [...expenses].sort((a, b) => (b.total || 0) - (a.total || 0));
    
    // Calculate spending trend
    const recentExpenses = expenses.slice(-7);
    const olderExpenses = expenses.slice(-14, -7);
    const recentAvg = recentExpenses.reduce((sum, exp) => sum + (exp.total || 0), 0) / recentExpenses.length;
    const olderAvg = olderExpenses.reduce((sum, exp) => sum + (exp.total || 0), 0) / olderExpenses.length;
    
    const trend = recentAvg > olderAvg * 1.1 
      ? 'increasing' 
      : recentAvg < olderAvg * 0.9 
        ? 'decreasing' 
        : 'stable';

    setStats({
      dailyAverage: totalAmount / expenses.length,
      monthlyTotal: totalAmount,
      highestSpending: {
        date: sortedByAmount[0].date,
        amount: sortedByAmount[0].total || 0
      },
      lowestSpending: {
        date: sortedByAmount[sortedByAmount.length - 1].date,
        amount: sortedByAmount[sortedByAmount.length - 1].total || 0
      },
      mostFrequentCategory: findMostFrequentCategory(expenses),
      spendingTrend: trend
    });
  };

  const calculateCategoryTotals = (expenses: Expense[]) => {
    const totals = categories.map(({ key, label }) => {
      const categoryExpenses = expenses.filter(exp => {
        const value = exp[key as keyof Expense];
        return typeof value === 'number' && value > 0;
      });
      
      const total = categoryExpenses.reduce((sum, exp) => {
        const value = exp[key as keyof Expense];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);

      return {
        category: label,
        total,
        transactions: categoryExpenses.length
      };
    });

    setCategoryTotals(totals.sort((a, b) => b.total - a.total));
  };

  const findMostFrequentCategory = (expenses: Expense[]): string => {
    const categoryCounts = categories.map(({ key, label }) => ({
      label,
      count: expenses.filter(exp => {
        const value = exp[key as keyof Expense];
        return typeof value === 'number' && value > 0;
      }).length
    }));
    return categoryCounts.reduce((max, cat) => cat.count > max.count ? cat : max).label;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4 px-4 sm:px-0">
          <div className="h-10 bg-gray-200 rounded w-3/4 sm:w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 sm:px-0">
        {/* Date Range Selector */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Monthly Overview</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleQuickSelect('thisMonth')}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                >
                  This Month
                </button>
                <button
                  onClick={() => handleQuickSelect('lastMonth')}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100"
                >
                  Last Month
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <DatePicker
                    selectedDate={dateRange.start}
                    onChange={(date) => {
                      if (date > dateRange.end) {
                        setDateRange({ start: date, end: date });
                      } else {
                        setDateRange(prev => ({ ...prev, start: date }));
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <DatePicker
                    selectedDate={dateRange.end}
                    onChange={(date) => {
                      if (date < dateRange.start) {
                        setDateRange({ start: date, end: date });
                      } else {
                        setDateRange(prev => ({ ...prev, end: date }));
                      }
                    }}
                    minDate={dateRange.start}
                  />
                </div>
              </div>
              <div className="flex-none sm:ml-4">
                <p className="text-sm text-gray-500">
                  {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <CurrencyRupeeIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monthly Total</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(stats?.monthlyTotal || 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Daily Avg: {formatCurrency(stats?.dailyAverage || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Highest Day</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(stats?.highestSpending.amount || 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats?.highestSpending.date 
                    ? new Date(stats.highestSpending.date).toLocaleDateString()
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Trend</p>
                <p className="text-xl font-semibold text-gray-900 capitalize">
                  {stats?.spendingTrend || '-'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Most used: {stats?.mostFrequentCategory || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Spending Graph */}
        {expenses.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <SpendingTrendGraph expenses={expenses} />
          </div>
        )}

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Expense Breakdown</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {categoryTotals.map(({ category, total, transactions }) => (
              <div key={category} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                  <span className="text-gray-900 font-medium mb-2 sm:mb-0">{category}</span>
                  <span className="text-lg font-semibold text-indigo-600">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row text-sm text-gray-500 space-y-2 sm:space-y-0 sm:space-x-4">
                  <span>Transactions: {transactions}</span>
                  <span>
                    {((total / (stats?.monthlyTotal || 1)) * 100).toFixed(1)}% of total
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(total / (stats?.monthlyTotal || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 