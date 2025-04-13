export interface Expense {
  id?: string;
  userId: string;
  date: string;
  morningTea: number;
  morningBreakfast: number;
  lunch: number;
  afternoonTea: number;
  afternoonBreakfast: number;
  dinner: number;
  extra: number;
  total: number;
  receiptUrl?: string;
  category?: string;
  description?: string;
  isRecurring?: boolean;
  sharedWith?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt: string;
}

export interface Budget {
  userId: string;
  monthYear: string;
  categories: {
    [key: string]: number;
  };
  totalLimit: number;
  notifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialGoal {
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  createdAt: string;
  updatedAt: string;
} 