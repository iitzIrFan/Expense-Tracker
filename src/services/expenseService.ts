import { auth, db, storage } from '@/config/firebase';
import { Expense } from '@/types/expense';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export const expenseService = {
  async addExpense(expense: Expense): Promise<Expense> {
    try {
      if (!expense.userId) {
        throw new Error('userId is required');
      }

      const expenseData = {
        ...expense,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'expenses'), expenseData);
      return { ...expenseData, id: docRef.id };
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  },

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    try {
      const updateData = {
        ...expense,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'expenses', id), updateData);
      return { ...updateData, id } as Expense;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  async getExpenses(userId: string): Promise<Expense[]> {
    try {
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  async addOrUpdateDailyExpense(expense: Expense): Promise<Expense> {
    try {
      // Add authentication check
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { userId, date } = expense;
      if (!userId || !date) {
        throw new Error('userId and date are required');
      }

      // Verify userId matches current user
      if (userId !== currentUser.uid) {
        throw new Error('User ID mismatch');
      }

      console.log('Current user:', currentUser.uid);
      console.log('Saving expense data:', {
        userId,
        date,
        expense
      });

      const cleanExpense = {
        userId,
        date,
        morningTea: Number(expense.morningTea) || 0,
        morningBreakfast: Number(expense.morningBreakfast) || 0,
        lunch: Number(expense.lunch) || 0,
        afternoonTea: Number(expense.afternoonTea) || 0,
        afternoonBreakfast: Number(expense.afternoonBreakfast) || 0,
        dinner: Number(expense.dinner) || 0,
        extra: Number(expense.extra) || 0,
        total: Number(expense.total) || 0,
        updatedAt: new Date().toISOString()
      };

      const docId = `${userId}_${date}`;
      const docRef = doc(db, 'dailyExpenses', docId);
      
      // Log the final data being written
      console.log('Writing to Firestore:', {
        docId,
        cleanExpense
      });

      // Check if the document exists
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, cleanExpense);
      } else {
        await setDoc(docRef, {
          ...cleanExpense,
          createdAt: new Date().toISOString()
        });
      }

      return { ...cleanExpense, id: docId };
    } catch (error) {
      console.error('Error saving daily expense:', error);
      throw error;
    }
  },

  async getDailyExpense(userId: string, date: string): Promise<Expense | null> {
    try {
      const docId = `${userId}_${date}`;
      const docRef = doc(db, 'dailyExpenses', docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure all numeric fields are properly converted
        return {
          id: docSnap.id,
          userId: data.userId,
          date: data.date,
          morningTea: Number(data.morningTea) || 0,
          morningBreakfast: Number(data.morningBreakfast) || 0,
          lunch: Number(data.lunch) || 0,
          afternoonTea: Number(data.afternoonTea) || 0,
          afternoonBreakfast: Number(data.afternoonBreakfast) || 0,
          dinner: Number(data.dinner) || 0,
          extra: Number(data.extra) || 0,
          total: Number(data.total) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting daily expense:', error);
      throw error;
    }
  },

  async getExpensesByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<Expense[]> {
    try {
      console.log('Fetching expenses for range:', { userId, startDate, endDate });
      
      const q = query(
        collection(db, 'dailyExpenses'),
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(q);
      const expenses = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          date: data.date,
          morningTea: Number(data.morningTea) || 0,
          morningBreakfast: Number(data.morningBreakfast) || 0,
          lunch: Number(data.lunch) || 0,
          afternoonTea: Number(data.afternoonTea) || 0,
          afternoonBreakfast: Number(data.afternoonBreakfast) || 0,
          dinner: Number(data.dinner) || 0,
          extra: Number(data.extra) || 0,
          total: Number(data.total) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Expense;
      });

      console.log('Found expenses:', expenses);
      return expenses;
    } catch (error: any) {
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.error('Missing index:', error.message);
        return [];
      }
      throw error;
    }
  },

  async getAllExpenses(userId: string): Promise<Expense[]> {
    try {
      console.log('Attempting to fetch expenses for user:', userId);
      const q = query(
        collection(db, 'dailyExpenses'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      console.log('Query response:', {
        empty: snapshot.empty,
        size: snapshot.size,
        metadata: snapshot.metadata
      });

      if (snapshot.empty) {
        console.log('No expenses found for user');
        return [];
      }

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          date: data.date,
          morningTea: Number(data.morningTea) || 0,
          morningBreakfast: Number(data.morningBreakfast) || 0,
          lunch: Number(data.lunch) || 0,
          afternoonTea: Number(data.afternoonTea) || 0,
          afternoonBreakfast: Number(data.afternoonBreakfast) || 0,
          dinner: Number(data.dinner) || 0,
          extra: Number(data.extra) || 0,
          total: Number(data.total) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Expense;
      });
    } catch (error: any) {
      // Handle index building state
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.warn('Index status:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        return [];
      }
      console.error('Error getting all expenses:', error);
      throw error;
    }
  },

  async uploadReceipt(userId: string, expenseId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `receipts/${userId}/${expenseId}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  async setBudget(budget: Budget): Promise<void> {
    const docRef = doc(db, 'budgets', `${budget.userId}_${budget.monthYear}`);
    await setDoc(docRef, {
      ...budget,
      updatedAt: new Date().toISOString()
    });
  },

  async getBudget(userId: string, monthYear: string): Promise<Budget | null> {
    const docRef = doc(db, 'budgets', `${userId}_${monthYear}`);
    const docSnap = await docRef.get();
    return docSnap.exists() ? (docSnap.data() as Budget) : null;
  },

  async setFinancialGoal(goal: FinancialGoal): Promise<void> {
    const docRef = doc(db, 'goals', `${goal.userId}_${goal.title}`);
    await setDoc(docRef, {
      ...goal,
      updatedAt: new Date().toISOString()
    });
  },

  async getFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    const q = query(collection(db, 'goals'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as FinancialGoal);
  }
}; 