import { expenseService } from '@/services/expenseService';
import { Expense } from '@/types/expense';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface ExpenseContextType {
  expenses: Expense[];
  currentExpense: Expense | null;
  loading: boolean;
  loadExpenses: (date?: string) => Promise<void>;
  saveExpense: (expense: Expense) => Promise<Expense | undefined>;
  deleteExpense: (expenseId: string) => Promise<void>;
  totalsByCategory: Record<string, number>;
  weeklyTotal: number;
  monthlyTotal: number;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

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

  const deleteExpense = async (expenseId: string) => {
    if (!user) {
      toast.error('Please log in to delete expenses');
      return;
    }

    try {
      await expenseService.deleteExpense(expenseId);
      await loadExpenses();
      toast.success('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const calculateTotals = () => {
    const totals = expenses.reduce((acc, expense) => {
      Object.entries(expense).forEach(([key, value]) => {
        if (typeof value === 'number' && key !== 'total') {
          acc[key] = (acc[key] || 0) + value;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    const weeklyTotal = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return expDate >= weekAgo;
      })
      .reduce((sum, exp) => sum + (exp.total || 0), 0);

    const monthlyTotal = expenses.reduce((sum, exp) => sum + (exp.total || 0), 0);

    return { totals, weeklyTotal, monthlyTotal };
  };

  const { totals: totalsByCategory, weeklyTotal, monthlyTotal } = calculateTotals();

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const value = {
    expenses,
    currentExpense,
    loading,
    loadExpenses,
    saveExpense,
    deleteExpense,
    totalsByCategory,
    weeklyTotal,
    monthlyTotal
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}; 