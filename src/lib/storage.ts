import { TaskItem } from '@/types';
import { format } from 'date-fns';
import { getExpenseCategoryLabel } from './constants';

const STORAGE_KEY = 'adt_tasks_data_v2';
const BASE_BALANCE_KEY = 'adt_base_balance_v1';

export function getInitialSeedTasks(): TaskItem[] {
  return [];
}

/**
 * Loads tasks from localStorage or provides initial empty data
 */
export function loadTasksFromStorage(): TaskItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const empty: TaskItem[] = [];
      saveTasksToStorage(empty);
      return empty;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load tasks from storage', e);
    return [];
  }
}

/**
 * Saves tasks to localStorage
 */
export function saveTasksToStorage(tasks: TaskItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to storage', e);
  }
}

/**
 * Loads base initial/current balance amount
 */
export function loadBaseBalanceFromStorage(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(BASE_BALANCE_KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Saves base initial/current balance amount
 */
export function saveBaseBalanceToStorage(amount: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BASE_BALANCE_KEY, String(amount));
  } catch (e) {
    console.error('Failed to save base balance to storage', e);
  }
}

/**
 * Export tasks as downloadable JSON
 */
export function exportTasksAsJson(tasks: TaskItem[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `adt_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Export tasks as CSV with Russian headers
 */
export function exportTasksAsCsv(tasks: TaskItem[]): void {
  const headers = ['ID', 'Название', 'Категория', 'Категория расхода', 'Дата', 'Время начала', 'Время окончания', 'Доход (руб)', 'Расход (руб)', 'Статус', 'Описание'];
  const rows = tasks.map((t) => [
    t.id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.category === 'study' ? 'Учеба' : t.category === 'work' ? 'Работа' : 'Иное',
    (t.financials?.expense || 0) > 0
      ? `"${getExpenseCategoryLabel(t.financials.expenseCategory || t.financials.note)}"`
      : '',
    t.date,
    t.startTime || '',
    t.endTime || '',
    t.financials.income || 0,
    t.financials.expense || 0,
    t.status,
    `"${(t.description || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `adt_schedule_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
