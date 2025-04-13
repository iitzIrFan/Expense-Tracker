import { Expense } from '@/types/expense';
import { formatCurrency } from '@/utils/formatters';
import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface ExpenseFormProps {
  userId: string;
  selectedDate: string;
  initialData?: Expense;
  onSubmit: (expense: Expense) => void;
  isSubmitting?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  userId,
  selectedDate,
  initialData,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<Expense>({
    userId,
    date: selectedDate,
    morningTea: 0,
    morningBreakfast: 0,
    lunch: 0,
    afternoonTea: 0,
    afternoonBreakfast: 0,
    dinner: 0,
    extra: 0,
    total: 0
  });

  const inputRefs = {
    morningTea: useRef<HTMLInputElement>(null),
    morningBreakfast: useRef<HTMLInputElement>(null),
    lunch: useRef<HTMLInputElement>(null),
    afternoonTea: useRef<HTMLInputElement>(null),
    afternoonBreakfast: useRef<HTMLInputElement>(null),
    dinner: useRef<HTMLInputElement>(null),
    extra: useRef<HTMLInputElement>(null)
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        userId,
        date: selectedDate,
        morningTea: 0,
        morningBreakfast: 0,
        lunch: 0,
        afternoonTea: 0,
        afternoonBreakfast: 0,
        dinner: 0,
        extra: 0,
        total: 0
      });
    }
  }, [initialData, userId, selectedDate]);

  const calculateTotal = (data: Partial<Expense>): number => {
    return Object.entries(inputRefs).reduce((sum, [key]) => {
      const value = data[key as keyof Expense];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  const handleChange = (field: keyof Expense) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
    if (isNaN(value)) return;

    const updatedData = {
      ...formData,
      [field]: value
    };

    updatedData.total = calculateTotal(updatedData);
    setFormData(updatedData);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: keyof typeof inputRefs) => {
    const fields = Object.keys(inputRefs);
    const currentIndex = fields.indexOf(field);

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextField = fields[currentIndex + 1];
      if (nextField) {
        inputRefs[nextField as keyof typeof inputRefs].current?.focus();
      } else {
        // If it's the last field, submit the form
        handleSubmit(e);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevField = fields[currentIndex - 1];
      if (prevField) {
        inputRefs[prevField as keyof typeof inputRefs].current?.focus();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate total
    const calculatedTotal = calculateTotal(formData);
    if (calculatedTotal !== formData.total) {
      toast.error('Form total mismatch. Please check your entries.');
      return;
    }

    onSubmit(formData);
  };

  // Function to check if the selected date is today
  const isToday = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    const todayStr = localDate.toISOString().split('T')[0];
    return selectedDate === todayStr;
  };

  const handleClearForm = () => {
    if (!isToday()) return; // Extra safety check
    setFormData({
      userId,
      date: selectedDate,
      morningTea: 0,
      morningBreakfast: 0,
      lunch: 0,
      afternoonTea: 0,
      afternoonBreakfast: 0,
      dinner: 0,
      extra: 0,
      total: 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isToday() && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleClearForm}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md
              text-red-600 bg-white hover:bg-red-50 border border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Clear All
          </button>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(inputRefs).map(([field, ref]) => (
          <div key={field} className="flex flex-col space-y-1 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start">
            <label className="block text-sm font-medium text-gray-700">
              {field.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <div className="sm:col-span-2">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  ref={ref}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={formData[field as keyof Expense] === 0 ? '' : formData[field as keyof Expense]}
                  onChange={handleChange(field as keyof Expense)}
                  onKeyDown={(e) => handleKeyDown(e, field as keyof typeof inputRefs)}
                  className="block w-full pl-7 pr-3 py-2 text-base sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-base sm:text-lg font-medium text-gray-900">Total</span>
          <span className="text-lg sm:text-xl font-bold text-indigo-600">
            {formatCurrency(formData.total)}
          </span>
        </div>
      </div>

      <div className="pt-5">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2.5 text-base font-medium text-white
            ${isSubmitting
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Daily Expenses'}
        </button>
      </div>
    </form>
  );
};
