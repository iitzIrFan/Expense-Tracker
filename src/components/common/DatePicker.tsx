import { addDays, format, subDays } from 'date-fns';
import React from 'react';

interface DatePickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
  minDate?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onChange, minDate }) => {
  const handlePrevDay = () => {
    const newDate = subDays(new Date(selectedDate), 1);
    onChange(format(newDate, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const newDate = addDays(new Date(selectedDate), 1);
    onChange(format(newDate, 'yyyy-MM-dd'));
  };

  return (
    <div className="flex flex-col w-full sm:w-auto">
      <div className="flex items-center space-x-2">
        <input
          type="date"
          value={selectedDate}
          min={minDate}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <span className="text-xs sm:text-sm text-gray-600 mt-1 text-center sm:text-left">
        {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
      </span>
    </div>
  );
}; 