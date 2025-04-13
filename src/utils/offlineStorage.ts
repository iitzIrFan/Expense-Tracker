import { Expense } from '@/types/expense';
import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface ExpenseDBSchema extends DBSchema {
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'by-date': string; 'by-category': string; 'by-sync-status': string };
  };
  customCategories: {
    key: string;
    value: {
      name: string;
      userId: string;
      createdAt: string;
    };
  };
}

let db: IDBPDatabase<ExpenseDBSchema>;

export async function initDB() {
  db = await openDB<ExpenseDBSchema>('expense-tracker', 1, {
    upgrade(db) {
      const expenseStore = db.createObjectStore('expenses', {
        keyPath: 'id',
        autoIncrement: true
      });
      expenseStore.createIndex('by-date', 'date');
      expenseStore.createIndex('by-category', 'category');
      expenseStore.createIndex('by-sync-status', 'syncStatus');

      db.createObjectStore('customCategories', {
        keyPath: 'name'
      });
    }
  });
}

export async function saveExpenseOffline(expense: ExpenseDBSchema['expenses']['value']) {
  if (!db) await initDB();
  await db.put('expenses', {
    ...expense,
    syncStatus: 'pending',
    updatedAt: new Date().toISOString()
  });
}

export async function getPendingExpenses() {
  if (!db) await initDB();
  return db.getAllFromIndex('expenses', 'by-sync-status', 'pending');
}

export async function markExpenseAsSynced(id: string) {
  if (!db) await initDB();
  const expense = await db.get('expenses', id);
  if (expense) {
    await db.put('expenses', {
      ...expense,
      syncStatus: 'synced'
    });
  }
}

export async function saveCustomCategory(category: ExpenseDBSchema['customCategories']['value']) {
  if (!db) await initDB();
  await db.put('customCategories', category);
}

export async function getCustomCategories(userId: string) {
  if (!db) await initDB();
  const categories = await db.getAll('customCategories');
  return categories.filter(cat => cat.userId === userId);
} 