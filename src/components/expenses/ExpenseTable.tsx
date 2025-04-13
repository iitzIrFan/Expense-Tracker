import { Expense } from '@/types/expense';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onCellValueChanged: (params: any) => void;
}

export const ExpenseTable = ({ 
  expenses, 
  onEdit, 
  onDelete,
  onCellValueChanged 
}: ExpenseTableProps) => {
  const numberFormatter = (params: any) => {
    return params.value ? `$${params.value.toFixed(2)}` : '$0.00';
  };

  const columnDefs: ColDef[] = [
    { 
      field: 'date', 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    { 
      field: 'morningTea',
      editable: true,
      valueFormatter: numberFormatter,
      type: 'numericColumn'
    },
    { 
      field: 'morningBreakfast',
      editable: true,
      valueFormatter: numberFormatter,
      type: 'numericColumn'
    },
    { 
      field: 'lunch',
      editable: true,
      valueFormatter: numberFormatter,
      type: 'numericColumn'
    },
    { 
      field: 'afternoonTea',
      editable: true,
      valueFormatter: numberFormatter,
      type: 'numericColumn'
    },
    { 
      field: 'afternoonBreakfast',
      editable: true,
      valueFormatter: numberFormatter,
      type: 'numericColumn'
    },
    { 
      field: 'dinner',
      editable: true,
      valueFormatter: numberFormatter,
      type: 'numericColumn'
    },
    { 
      field: 'extra',
      editable: true,
      valueFormatter: numberFormatter,
      type: 'numericColumn'
    },
    { 
      field: 'total',
      valueFormatter: numberFormatter,
      type: 'numericColumn',
      cellClass: 'font-bold',
      valueGetter: (params) => {
        const data = params.data;
        return (
          (data.morningTea || 0) +
          (data.morningBreakfast || 0) +
          (data.lunch || 0) +
          (data.afternoonTea || 0) +
          (data.afternoonBreakfast || 0) +
          (data.dinner || 0) +
          (data.extra || 0)
        );
      }
    },
    {
      headerName: 'Actions',
      cellRenderer: (params: any) => (
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(params.data)}
            className="px-2 py-1 text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete(params.data.id)}
            className="px-2 py-1 text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
      width: 120
    }
  ];

  return (
    <div className="ag-theme-alpine w-full h-[600px]">
      <AgGridReact
        rowData={expenses}
        columnDefs={columnDefs}
        defaultColDef={{
          flex: 1,
          minWidth: 100,
          resizable: true
        }}
        onCellValueChanged={onCellValueChanged}
        enableRangeSelection={true}
        copyHeadersToClipboard={true}
        suppressRowClickSelection={true}
      />
    </div>
  );
}; 