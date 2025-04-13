'use client';

import { DatePicker } from '@/components/common/DatePicker';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { expenseService } from '@/services/expenseService';
import { Expense } from '@/types/expense';
import { formatCurrency } from '@/utils/formatters';
import { ChevronLeftIcon, ChevronRightIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useHotkeys } from 'react-hotkeys-hook';

export default function DailyExpensePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousDayTotal, setPreviousDayTotal] = useState<number | null>(null);
  const [weeklyAverage, setWeeklyAverage] = useState<number | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  // Get today's date in YYYY-MM-DD format for the current timezone
  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // Initialize date after mount to avoid hydration mismatch
  useEffect(() => {
    const todayDate = getTodayDate();
    setSelectedDate(todayDate);
  }, []); // Empty dependency array means this runs once on mount

  // Reset to today's date when user clicks a button (optional)
  const handleResetToToday = () => {
    setSelectedDate(getTodayDate());
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate.toISOString().split('T')[0]);
  };

  const handlePreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate.toISOString().split('T')[0]);
  };

  const handleCopyPrevious = async () => {
    if (!user || isCopying) return;
    setIsCopying(true);

    try {
      const previousDate = new Date(selectedDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const prevDateStr = previousDate.toISOString().split('T')[0];
      const prevExpense = await expenseService.getDailyExpense(user.uid, prevDateStr);

      if (prevExpense) {
        const newExpense = {
          ...prevExpense,
          date: selectedDate,
          updatedAt: new Date().toISOString()
        };
        await expenseService.addOrUpdateDailyExpense(newExpense);
        await loadDailyExpense();
        toast.success('Copied expenses from previous day');
      } else {
        toast.error('No previous day expenses found');
      }
    } catch (error) {
      console.error('Error copying expenses:', error);
      toast.error('Failed to copy expenses');
    } finally {
      setIsCopying(false);
    }
  };

  // Setup hotkeys directly
  useHotkeys('left', handlePreviousDay, [selectedDate]);
  useHotkeys('right', handleNextDay, [selectedDate]);
  useHotkeys('ctrl+c', handleCopyPrevious, [selectedDate, user, isCopying]);

  useEffect(() => {
    if (user && selectedDate) {
      loadDailyExpense();
      loadPreviousDayTotal();
      loadWeeklyAverage();
    }
  }, [user, selectedDate]);

  const loadDailyExpense = async () => {
    if (!user) return;
    const expense = await expenseService.getDailyExpense(user.uid, selectedDate);
    setCurrentExpense(expense);
  };

  const loadPreviousDayTotal = async () => {
    if (!user) return;
    const previousDate = new Date(selectedDate);
    previousDate.setDate(previousDate.getDate() - 1);
    const prevDateStr = previousDate.toISOString().split('T')[0];
    const prevExpense = await expenseService.getDailyExpense(user.uid, prevDateStr);
    setPreviousDayTotal(prevExpense?.total || null);
  };

  const loadWeeklyAverage = async () => {
    if (!user) return;
    const endDate = new Date(selectedDate);
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - 7);
    
    const expenses = await expenseService.getExpensesByDateRange(
      user.uid,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    if (expenses.length > 0) {
      const total = expenses.reduce((sum, exp) => sum + (exp.total || 0), 0);
      setWeeklyAverage(total / expenses.length);
    } else {
      setWeeklyAverage(null);
    }
  };

  const handleSubmit = async (expense: Expense) => {
    if (!user) {
      toast.error('Please log in to save expenses');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const expenseData = {
        ...expense,
        userId: user.uid,
        date: selectedDate,
        updatedAt: new Date().toISOString()
      };

      await expenseService.addOrUpdateDailyExpense(expenseData);
      await loadDailyExpense();
      
      toast.success('Expense saved successfully!');
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedDate) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-3 py-4 sm:p-6">
            {/* Header with Navigation */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Daily Expenses
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousDay}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Previous Day (←)"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <DatePicker
                    selectedDate={selectedDate}
                    onChange={setSelectedDate}
                  />
                  <button
                    onClick={handleNextDay}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Next Day (→)"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={handleCopyPrevious}
                  disabled={isCopying}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ClipboardIcon className="h-4 w-4 mr-2" />
                  Copy Previous Day
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {previousDayTotal !== null && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500">Previous Day</h4>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(previousDayTotal || 0)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {weeklyAverage !== null && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500">Weekly Average</h4>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(weeklyAverage)}
                  </p>
                  <p className="text-sm text-gray-500">Last 7 days</p>
                </div>
              )}
            </div>

            <ExpenseForm
              userId={user?.uid || ''}
              selectedDate={selectedDate}
              initialData={currentExpense || undefined}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 