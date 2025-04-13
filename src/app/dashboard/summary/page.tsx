'use client';

import { DatePicker } from '@/components/common/DatePicker';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { expenseService } from '@/services/expenseService';
import { Expense } from '@/types/expense';
import { formatCurrency } from '@/utils/formatters';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface DailySummary {
  date: string;
  total: number;
  breakdown: Record<string, number>;
}

export default function SummaryPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);

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
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (user && selectedDate) {
      loadSummaryData();
    }
  }, [user, selectedDate]);

  const loadSummaryData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const date = new Date(selectedDate);
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const expenses = await expenseService.getExpensesByDateRange(
        user.uid,
        firstDay.toISOString().split('T')[0],
        lastDay.toISOString().split('T')[0]
      );

      const dailyData = expenses.map(exp => ({
        date: exp.date,
        total: exp.total || 0,
        breakdown: categories.reduce((acc, { key }) => ({
          ...acc,
          [key]: exp[key as keyof Expense] || 0
        }), {})
      }));

      setDailySummaries(dailyData.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Error loading summary data:', error);
      toast.error('Failed to load summary data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Monthly Summary</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Detailed breakdown of your expenses
                </p>
              </div>
              <DatePicker
                selectedDate={selectedDate}
                onChange={setSelectedDate}
              />
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="block sm:hidden">
          <div className="space-y-4">
            {dailySummaries.map((day) => (
              <div key={day.date} className="bg-white shadow rounded-lg p-4">
                <div className="font-medium text-gray-900 mb-2">
                  {new Date(day.date).toLocaleDateString()}
                </div>
                <div className="space-y-2">
                  {categories.map(({ key, label }) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-900">{formatCurrency(day.breakdown[key])}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Total</span>
                    <span className="font-medium text-indigo-600">{formatCurrency(day.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    {categories.map(({ label }) => (
                      <th key={label} className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {label}
                      </th>
                    ))}
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailySummaries.map((day) => (
                    <tr key={day.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      {categories.map(({ key }) => (
                        <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(day.breakdown[key])}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        {formatCurrency(day.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 