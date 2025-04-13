import { Expense } from '@/types/expense';
import { read, utils, write } from 'xlsx';

export const exportService = {
  exportToExcel(expenses: Expense[]) {
    const worksheet = utils.json_to_sheet(expenses);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Expenses');
    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'expenses');
  },

  importFromExcel(file: File): Promise<Expense[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const expenses = utils.sheet_to_json(firstSheet) as Expense[];
          resolve(expenses);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  saveAsExcelFile(buffer: any, fileName: string) {
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.xlsx`;
    link.click();
  }
}; 