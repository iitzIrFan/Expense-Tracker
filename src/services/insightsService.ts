import { db } from '@/config/firebase';
import { Expense } from '@/types/expense';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { expenseService } from './expenseService';

interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable' | 'neutral';
  description: string;
}

interface SpendingInsight {
  type: 'saving' | 'warning' | 'info';
  message: string;
  amount?: number;
  category?: string;
}

export const insightsService = {
  async generateInsights(userId: string) {
    const expenses = await this.getUserExpenses(userId);
    const today = new Date();
    const lastThirtyDays = new Date(today);
    lastThirtyDays.setDate(today.getDate() - 30);

    return {
      dailyAverages: this.analyzeDailyAverages(expenses),
      weeklyTotals: this.analyzeWeeklyTotals(expenses),
      monthlyTrends: this.analyzeMonthlyTrends(expenses),
      topSpendingDays: this.analyzeTopSpendingDays(expenses),
      predictions: this.generatePredictions(expenses)
    };
  },

  async getUserExpenses(userId: string): Promise<Expense[]> {
    const q = query(collection(db, 'dailyExpenses'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  },

  analyzeDailyAverages(expenses: Expense[]) {
    if (!expenses.length) return {};

    const totals = {
      morningTea: 0,
      morningBreakfast: 0,
      lunch: 0,
      afternoonTea: 0,
      afternoonBreakfast: 0,
      dinner: 0,
      extra: 0
    };

    // Sum up all expenses
    expenses.forEach(expense => {
      Object.keys(totals).forEach(key => {
        const value = expense[key as keyof Expense];
        totals[key as keyof typeof totals] += typeof value === 'number' ? value : 0;
      });
    });

    // Calculate averages
    const count = expenses.length;
    return Object.keys(totals).reduce((acc, key) => {
      acc[key] = totals[key as keyof typeof totals] / count;
      return acc;
    }, {} as { [key: string]: number });
  },

  analyzeSpendingTrend(expenses: Expense[]): TrendAnalysis {
    if (expenses.length < 2) {
      return {
        trend: 'neutral',
        description: "Not enough data to determine spending trends. Continue tracking your expenses for more insights."
      };
    }
    
    const recentExpenses = expenses.slice(-7);
    const olderExpenses = expenses.slice(-14, -7);
    
    const recentAvg = recentExpenses.reduce((sum, exp) => sum + (exp.total || 0), 0) / recentExpenses.length;
    const olderAvg = olderExpenses.reduce((sum, exp) => sum + (exp.total || 0), 0) / olderExpenses.length;
    
    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (percentChange > 10) {
      return {
        trend: 'increasing',
        description: "Your spending has increased recently. Consider reviewing your daily expenses to identify areas for potential savings."
      };
    }
    if (percentChange < -10) {
      return {
        trend: 'decreasing',
        description: "Great job! Your spending trend shows a decrease compared to previous weeks."
      };
    }
    return {
      trend: 'stable',
      description: "Your spending pattern has remained stable over the past weeks."
    };
  },

  generateTrendDescription(trendAnalysis: TrendAnalysis): string {
    return trendAnalysis.description;
  },

  analyzeWeeklyTotals(expenses: Expense[]) {
    const weeklyTotals: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const week = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
      weeklyTotals[week] = (weeklyTotals[week] || 0) + (expense.total || 0);
    });

    return weeklyTotals;
  },

  analyzeMonthlyTrends(expenses: Expense[]) {
    const monthlyTrends = expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!acc[monthYear]) {
        acc[monthYear] = {
          total: 0,
          count: 0
        };
      }
      acc[monthYear].total += expense.total || 0;
      acc[monthYear].count += 1;
      return acc;
    }, {} as { [key: string]: { total: number; count: number } });

    return Object.entries(monthlyTrends).map(([date, data]) => ({
      date,
      total: data.total,
      average: data.total / data.count
    }));
  },

  analyzeTopSpendingDays(expenses: Expense[]) {
    return expenses
      .sort((a, b) => (b.total || 0) - (a.total || 0))
      .slice(0, 5)
      .map(expense => ({
        date: expense.date,
        total: expense.total || 0,
        breakdown: {
          'Morning Tea': expense.morningTea || 0,
          'Morning Breakfast': expense.morningBreakfast || 0,
          'Lunch': expense.lunch || 0,
          'Afternoon Tea': expense.afternoonTea || 0,
          'Afternoon Breakfast': expense.afternoonBreakfast || 0,
          'Dinner': expense.dinner || 0,
          'Extra': expense.extra || 0
        }
      }));
  },

  generatePredictions(expenses: Expense[]) {
    const trendAnalysis = this.analyzeSpendingTrend(expenses);
    const avgDaily = expenses.reduce((sum, exp) => sum + (exp.total || 0), 0) / Math.max(expenses.length, 1);
    
    return {
      nextWeekEstimate: avgDaily * 7,
      trendDescription: this.generateTrendDescription(trendAnalysis)
    };
  },

  async getSpendingInsights(userId: string, dateRange: { start: string; end: string }): Promise<SpendingInsight[]> {
    const expenses = await expenseService.getExpensesByDateRange(
      userId,
      dateRange.start,
      dateRange.end
    );

    const insights: SpendingInsight[] = [];

    // Analyze spending patterns
    const categoryTotals = this.calculateCategoryTotals(expenses);
    const unusualExpenses = this.findUnusualExpenses(expenses);
    const savingOpportunities = this.findSavingOpportunities(expenses);

    return [...categoryTotals, ...unusualExpenses, ...savingOpportunities];
  },

  private calculateCategoryTotals(expenses: Expense[]): SpendingInsight[] {
    // Calculate and return category-wise spending insights
  },

  private findUnusualExpenses(expenses: Expense[]): SpendingInsight[] {
    // Identify expenses that are significantly higher than usual
  },

  private findSavingOpportunities(expenses: Expense[]): SpendingInsight[] {
    // Identify potential areas for saving money
  }
}; 