export type ActivityCategory = 'study' | 'work' | 'other' | string;

export interface TaskFinancials {
  income: number;    // Доход
  expense: number;   // Расход
  currency?: string; // Валюта (RUB по умолчанию, можно USD/EUR)
  note?: string;     // Заметка по финансам
}

export type TaskStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskItem {
  id: string;
  title: string;              // Название дела
  description: string;        // Описание
  category: ActivityCategory; // Тип занятости: 'study' | 'work' | 'other' | custom
  customCategoryName?: string;// Пользовательское название категории
  date: string;               // YYYY-MM-DD
  startTime?: string;         // HH:mm (например, "10:00")
  endTime?: string;           // HH:mm (например, "12:30")
  isAllDay: boolean;          // Весь день
  financials: TaskFinancials; // Фин. часть (доход и расход)
  status: TaskStatus;         // Статус
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export type CalendarViewMode = 'day' | 'week' | 'month' | 'year';

export type UserRole = 'admin' | 'guest';

export interface UserSession {
  role: UserRole;
  isLoggedIn: boolean;
  loginTime?: string;
  expiresAt?: number;
}

export interface ActivityCategoryConfig {
  id: ActivityCategory;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconName: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  baseBalance?: number;
  totalCurrentMoney?: number;
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
  taskCountByCategory: Record<string, number>;
  totalTasks: number;
  completedTasks: number;
}
