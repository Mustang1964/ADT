import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ActivityCategory, FinancialSummary, TaskItem } from '@/types';
import { DEFAULT_CATEGORIES } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting
export function formatCurrency(amount: number, currency: string = 'RUB'): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  const currSymbol = currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;

  return `${sign}${formatted} ${currSymbol}`;
}

export function formatRawCurrency(amount: number, currency: string = 'RUB'): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(amount);
  const currSymbol = currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
  return `${formatted} ${currSymbol}`;
}

// Date formatting with Russian locale
export function formatDateRu(date: Date | string, formatStr: string = 'd MMMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: ru });
}

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// Category helper
export function getCategoryConfig(categoryId: ActivityCategory) {
  const found = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
  if (found) return found;

  // Fallback for custom category
  return {
    id: categoryId,
    label: categoryId,
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    textColor: '#6d28d9',
    iconName: 'Tag',
  };
}

// Calculate financial summary for an array of tasks
export function calculateFinancialSummary(tasks: TaskItem[], baseBalance: number = 0): FinancialSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  const incomeByCategory: Record<string, number> = { study: 0, work: 0, other: 0 };
  const expenseByCategory: Record<string, number> = { study: 0, work: 0, other: 0 };
  const taskCountByCategory: Record<string, number> = { study: 0, work: 0, other: 0 };
  let completedTasks = 0;

  for (const task of tasks) {
    const inc = Number(task.financials?.income) || 0;
    const exp = Number(task.financials?.expense) || 0;
    const cat = task.category || 'other';

    totalIncome += inc;
    totalExpense += exp;

    incomeByCategory[cat] = (incomeByCategory[cat] || 0) + inc;
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + exp;
    taskCountByCategory[cat] = (taskCountByCategory[cat] || 0) + 1;

    if (task.status === 'completed') {
      completedTasks += 1;
    }
  }

  const netPeriod = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netBalance: netPeriod,
    baseBalance,
    totalCurrentMoney: baseBalance + netPeriod,
    incomeByCategory,
    expenseByCategory,
    taskCountByCategory,
    totalTasks: tasks.length,
    completedTasks,
  };
}

// Calendar view helpers
export function getWeekDays(currentDate: Date): Date[] {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthGrid(currentDate: Date): { date: Date; isCurrentMonth: boolean; isToday: boolean }[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Grid start from Monday of the first week
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  // Grid end at Sunday of the last week
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = new Date();

  return days.map((day) => ({
    date: day,
    isCurrentMonth: isSameMonth(day, currentDate),
    isToday: isSameDay(day, today),
  }));
}

export const HOURS_24 = Array.from({ length: 24 }, (_, i) => {
  const hour = String(i).padStart(2, '0');
  return `${hour}:00`;
});
