import { useAuth } from '@/contexts/AuthContext';
import { expenseService } from '@/services/expenseService';
import { Expense } from '@/types/expense';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export function useExpenses() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);

  const loadExpenses = async (date?: string) => {
    if (!user) return;
    setLoading(true);
    try {
      if (date) {
        const expense = await expenseService.getDailyExpense(user.uid, date);
        setCurrentExpense(expense);
      }
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const allExpenses = await expenseService.getExpensesByDateRange(
        user.uid,
        thirtyDaysAgo.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const saveExpense = async (expense: Expense) => {
    if (!user) {
      toast.error('Please log in to save expenses');
      return;
    }

    try {
      const result = await expenseService.addOrUpdateDailyExpense(expense);
      await loadExpenses(expense.date);
      toast.success('Expense saved successfully!');
      return result;
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
      throw error;
    }
  };

  return {
    expenses,
    currentExpense,
    loading,
    loadExpenses,
    saveExpense
  };
} 