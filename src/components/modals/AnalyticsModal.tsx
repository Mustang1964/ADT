'use client';

import React, { useState, useMemo } from 'react';
import { FinancialSummary, TaskItem, ActivityCategory, UserRole, ExpenseCategory } from '@/types';
import { EXPENSE_CATEGORIES, getExpenseCategoryLabel } from '@/lib/constants';
import { formatRawCurrency, formatCurrency } from '@/lib/utils';
import {
  X,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Filter,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Tag,
  Layers,
  Sparkles,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  format,
  parseISO,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: FinancialSummary;
  tasks: TaskItem[];
  userRole?: UserRole;
  onDeleteTask?: (taskId: string) => void;
  onDeleteTasks?: (taskIds: string[]) => void;
}

type PeriodPreset = 'all' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
type OperationFilter = 'all' | 'income' | 'expense';

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  tasks,
  userRole = 'admin',
  onDeleteTask,
  onDeleteTasks,
}) => {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string>('all');
  const [operationType, setOperationType] = useState<OperationFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'timeline'>('bar');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Deletion mode state
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ open: boolean; ids: string[]; isSingle?: boolean }>({
    open: false,
    ids: [],
  });

  // Filter tasks based on all active filters
  const filteredTasks = useMemo(() => {
    const now = new Date();

    return tasks.filter((task) => {
      // 1. Period filter
      try {
        const taskDate = parseISO(task.date);

        if (periodPreset === 'this_week') {
          const start = startOfWeek(now, { weekStartsOn: 1 });
          const end = endOfWeek(now, { weekStartsOn: 1 });
          if (!isWithinInterval(taskDate, { start, end })) return false;
        } else if (periodPreset === 'this_month') {
          const start = startOfMonth(now);
          const end = endOfMonth(now);
          if (!isWithinInterval(taskDate, { start, end })) return false;
        } else if (periodPreset === 'last_month') {
          const prev = subMonths(now, 1);
          const start = startOfMonth(prev);
          const end = endOfMonth(prev);
          if (!isWithinInterval(taskDate, { start, end })) return false;
        } else if (periodPreset === 'this_year') {
          const start = startOfYear(now);
          const end = endOfYear(now);
          if (!isWithinInterval(taskDate, { start, end })) return false;
        } else if (periodPreset === 'custom') {
          if (customStartDate && task.date < customStartDate) return false;
          if (customEndDate && task.date > customEndDate) return false;
        }
      } catch {
        return false;
      }

      // 2. Activity Category filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      // 3. Expense Category filter (if selected, task must be an expense matching this category)
      if (selectedExpenseCategory !== 'all') {
        const exp = task.financials?.expense || 0;
        if (exp <= 0) return false;

        const taskExpCat = task.financials?.expenseCategory;
        const taskNote = (task.financials?.note || '').toLowerCase();

        // Check against id or label
        const targetOption = EXPENSE_CATEGORIES.find((c) => c.id === selectedExpenseCategory);
        const matchCatId = taskExpCat === selectedExpenseCategory;
        const matchNoteLabel = targetOption ? taskNote === targetOption.label.toLowerCase() : false;
        const matchNoteId = taskNote === selectedExpenseCategory.toLowerCase();

        if (!matchCatId && !matchNoteLabel && !matchNoteId) {
          return false;
        }
      }

      // 4. Operation filter (Income vs Expense)
      const inc = task.financials?.income || 0;
      const exp = task.financials?.expense || 0;

      if (operationType === 'income' && inc <= 0) return false;
      if (operationType === 'expense' && exp <= 0) return false;

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchNote = (task.financials?.note || '').toLowerCase().includes(q);
        const matchDesc = (task.description || '').toLowerCase().includes(q);
        const matchExpCat = task.financials?.expenseCategory
          ? getExpenseCategoryLabel(task.financials.expenseCategory).toLowerCase().includes(q)
          : false;
        if (!matchTitle && !matchNote && !matchDesc && !matchExpCat) return false;
      }

      return true;
    });
  }, [tasks, periodPreset, customStartDate, customEndDate, selectedCategory, selectedExpenseCategory, operationType, searchQuery]);

  // Financial summary for filtered tasks
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCategory: Record<string, { income: number; expense: number; count: number }> = {
      study: { income: 0, expense: 0, count: 0 },
      work: { income: 0, expense: 0, count: 0 },
      other: { income: 0, expense: 0, count: 0 },
    };

    filteredTasks.forEach((t) => {
      const inc = t.financials?.income || 0;
      const exp = t.financials?.expense || 0;
      const cat = t.category || 'other';

      income += inc;
      expense += exp;

      if (!byCategory[cat]) {
        byCategory[cat] = { income: 0, expense: 0, count: 0 };
      }
      byCategory[cat].income += inc;
      byCategory[cat].expense += exp;
      byCategory[cat].count += 1;
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      byCategory,
      totalTasks: filteredTasks.length,
    };
  }, [filteredTasks]);

  // Bar chart category data
  const categoryChartData = useMemo(() => {
    const cats = [
      { id: 'study', name: 'Учеба' },
      { id: 'work', name: 'Работа' },
      { id: 'other', name: 'Иное' },
    ];

    return cats.map((c) => ({
      name: c.name,
      Доход: stats.byCategory[c.id]?.income || 0,
      Расход: stats.byCategory[c.id]?.expense || 0,
      Баланс: (stats.byCategory[c.id]?.income || 0) - (stats.byCategory[c.id]?.expense || 0),
    }));
  }, [stats]);

  // Pie chart data: for expenses, calculate breakdown by expense categories
  const expensePieData = useMemo(() => {
    const byExpCategory: Record<string, number> = {};
    const palette = [
      '#f43f5e', '#fb923c', '#f59e0b', '#10b981', '#06b6d4',
      '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#14b8a6', '#64748b'
    ];

    filteredTasks.forEach((t) => {
      const exp = t.financials?.expense || 0;
      if (exp <= 0) return;

      const catId = t.financials?.expenseCategory;
      let label = 'Прочее';
      if (catId) {
        label = getExpenseCategoryLabel(catId);
      } else if (t.financials?.note) {
        label = getExpenseCategoryLabel(t.financials.note);
      }

      byExpCategory[label] = (byExpCategory[label] || 0) + exp;
    });

    const entries = Object.entries(byExpCategory);
    return entries.map(([name, value], idx) => ({
      name,
      value,
      color: palette[idx % palette.length],
    })).filter((d) => d.value > 0);
  }, [filteredTasks]);

  const incomePieData = useMemo(() => {
    return [
      { name: 'Учеба', value: stats.byCategory.study?.income || 0, color: '#0ea5e9' },
      { name: 'Работа', value: stats.byCategory.work?.income || 0, color: '#10b981' },
      { name: 'Иное', value: stats.byCategory.other?.income || 0, color: '#8b5cf6' },
    ].filter((d) => d.value > 0);
  }, [stats]);

  // Timeline chronology data for trend line
  const timelineChartData = useMemo(() => {
    const map = new Map<string, { date: string; income: number; expense: number; net: number }>();

    filteredTasks.forEach((t) => {
      const d = t.date;
      const current = map.get(d) || { date: d, income: 0, expense: 0, net: 0 };
      current.income += t.financials?.income || 0;
      current.expense += t.financials?.expense || 0;
      current.net = current.income - current.expense;
      map.set(d, current);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        dateLabel: format(parseISO(item.date), 'd MMM', { locale: ru }),
      }));
  }, [filteredTasks]);

  // Sorted list of financial transactions for detailed table
  const sortedFinancialList = useMemo(() => {
    const list = filteredTasks.filter(
      (t) => (t.financials?.income || 0) > 0 || (t.financials?.expense || 0) > 0
    );

    return list.sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      const aAmt = Math.max(a.financials?.income || 0, a.financials?.expense || 0);
      const bAmt = Math.max(b.financials?.income || 0, b.financials?.expense || 0);
      if (sortBy === 'amount_desc') return bAmt - aAmt;
      return aAmt - bAmt;
    });
  }, [filteredTasks, sortBy]);

  // Toggle selection for a specific task id
  const handleToggleSelect = (taskId: string) => {
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Select all or deselect all in current view
  const handleToggleSelectAll = () => {
    if (selectedForDelete.size === sortedFinancialList.length) {
      setSelectedForDelete(new Set());
    } else {
      setSelectedForDelete(new Set(sortedFinancialList.map((t) => t.id)));
    }
  };

  // Open confirmation for selected or single task
  const handleRequestDelete = (taskId?: string) => {
    if (taskId) {
      setConfirmDeleteModal({ open: true, ids: [taskId], isSingle: true });
    } else if (selectedForDelete.size > 0) {
      setConfirmDeleteModal({ open: true, ids: Array.from(selectedForDelete), isSingle: false });
    }
  };

  // Perform actual deletion
  const handleExecuteDelete = () => {
    const ids = confirmDeleteModal.ids;
    if (ids.length === 0) return;

    if (ids.length === 1 && onDeleteTask) {
      onDeleteTask(ids[0]);
    } else if (onDeleteTasks) {
      onDeleteTasks(ids);
    } else if (onDeleteTask) {
      ids.forEach((id) => onDeleteTask(id));
    }

    // Clean up selection
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });

    setConfirmDeleteModal({ open: false, ids: [] });

    // If all selected were deleted, exit delete mode
    if (ids.length === selectedForDelete.size) {
      setIsDeleteMode(false);
    }
  };

  const isGuest = userRole === 'guest';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Confirmation Modal */}
        {confirmDeleteModal.open && (
          <div className="absolute inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  {confirmDeleteModal.isSingle ? 'Удалить эту запись?' : `Удалить выбранные записи (${confirmDeleteModal.ids.length})?`}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Данное действие безвозвратно удалит {confirmDeleteModal.isSingle ? 'выбранную операцию' : `${confirmDeleteModal.ids.length} операц.`} из аналитики и календаря. Остальные данные останутся нетронутыми.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModal({ open: false, ids: [] })}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors shadow-sm"
                >
                  Да, удалить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Финансовая Аналитика ADT
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Глубокий анализ доходов, расходов, категорий и динамики за любой период
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          {/* Top Row: Period Presets & Search */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Period Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-bold">
              <button
                onClick={() => setPeriodPreset('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  periodPreset === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Все время
              </button>
              <button
                onClick={() => setPeriodPreset('this_week')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  periodPreset === 'this_week'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Эта неделя
              </button>
              <button
                onClick={() => setPeriodPreset('this_month')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  periodPreset === 'this_month'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Этот месяц
              </button>
              <button
                onClick={() => setPeriodPreset('last_month')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  periodPreset === 'last_month'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Прошлый месяц
              </button>
              <button
                onClick={() => setPeriodPreset('this_year')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  periodPreset === 'this_year'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Весь год
              </button>
              <button
                onClick={() => setPeriodPreset('custom')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  periodPreset === 'custom'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Свой период
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по статьям..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
              />
            </div>
          </div>

          {/* Custom Date Range if active */}
          {periodPreset === 'custom' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-2xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>С:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-1 text-xs"
              />
              <span>По:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-1 text-xs"
              />
            </div>
          )}

          {/* Second Row: Category & Operation Type filters */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              {/* Activity Category selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs cursor-pointer"
                title="Фильтр по типу активности"
              >
                <option value="all">Все активности</option>
                <option value="study">Учеба</option>
                <option value="work">Работа</option>
                <option value="other">Иное</option>
              </select>

              {/* Expense Category selector */}
              <select
                value={selectedExpenseCategory}
                onChange={(e) => setSelectedExpenseCategory(e.target.value)}
                className="bg-white border border-rose-300 rounded-xl px-3 py-1.5 font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600 shadow-xs cursor-pointer"
                title="Фильтр по категории расходов"
              >
                <option value="all">Все категории трат</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji ? `${cat.emoji} ` : ''}{cat.label}
                  </option>
                ))}
              </select>

              {/* Operation type selector */}
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs cursor-pointer"
              >
                <option value="all">Все операции (Доходы + Расходы)</option>
                <option value="income">Только доходы (+)</option>
                <option value="expense">Только расходы (-)</option>
              </select>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  chartType === 'bar' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Столбцы
              </button>
              <button
                type="button"
                onClick={() => setChartType('timeline')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  chartType === 'timeline' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Динамика
              </button>
              <button
                type="button"
                onClick={() => setChartType('pie')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  chartType === 'pie' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Круговая
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-xs">
              <div className="text-xs font-bold text-emerald-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Доходы за выборку
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-emerald-200 font-extrabold text-emerald-800">
                  +{filteredTasks.filter((t) => (t.financials?.income || 0) > 0).length} опер.
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1.5 tracking-tight">
                +{formatRawCurrency(stats.totalIncome)}
              </div>
              <div className="text-[11px] text-emerald-800/70 mt-1 font-medium">
                Учеба: {formatRawCurrency(stats.byCategory.study?.income || 0)} • Работа: {formatRawCurrency(stats.byCategory.work?.income || 0)}
              </div>
            </div>

            <div className="p-4.5 rounded-2xl border border-rose-200 bg-rose-50/60 shadow-xs">
              <div className="text-xs font-bold text-rose-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" /> Расходы за выборку
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-rose-200 font-extrabold text-rose-800">
                  -{filteredTasks.filter((t) => (t.financials?.expense || 0) > 0).length} опер.
                </span>
              </div>
              <div className="text-2xl font-black text-rose-700 mt-1.5 tracking-tight">
                -{formatRawCurrency(stats.totalExpense)}
              </div>
              <div className="text-[11px] text-rose-800/70 mt-1 font-medium">
                Иное: {formatRawCurrency(stats.byCategory.other?.expense || 0)} • Учеба: {formatRawCurrency(stats.byCategory.study?.expense || 0)}
              </div>
            </div>

            <div
              className={`p-4.5 rounded-2xl border shadow-xs ${
                stats.netBalance >= 0
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-rose-200 bg-rose-50/60'
              }`}
            >
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4" /> Чистый результат
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200 font-extrabold text-slate-700">
                  {stats.netBalance >= 0 ? 'Прибыль' : 'Дефицит'}
                </span>
              </div>
              <div
                className={`text-2xl font-black mt-1.5 tracking-tight ${
                  stats.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {stats.netBalance >= 0 ? '+' : ''}{formatRawCurrency(stats.netBalance)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Всего затронуто событий: {stats.totalTasks}
              </div>
            </div>
          </div>

          {/* Visualization Section */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
            {/* Chart 1: Bar Category Chart */}
            {chartType === 'bar' && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-900" />
                  Сравнение доходов и расходов по категориям
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontWeight: 600,
                        }}
                        formatter={(value: any) => formatRawCurrency(Number(value))}
                      />
                      <Legend />
                      <Bar dataKey="Доход" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Расход" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Chart 2: Timeline Dynamics Line Chart */}
            {chartType === 'timeline' && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-900" />
                  Хронологическая динамика движения средств
                </h3>
                {timelineChartData.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            fontWeight: 600,
                          }}
                          formatter={(value: any) => formatRawCurrency(Number(value))}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="income" name="Доход" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="expense" name="Расход" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="net" name="Чистое сальдо" stroke="#0f172a" strokeWidth={2} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                    Нет данных за выбранный период
                  </div>
                )}
              </div>
            )}

            {/* Chart 3: Pie Distribution */}
            {chartType === 'pie' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income Pie */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                    Структура Доходов
                  </h4>
                  {incomePieData.length > 0 ? (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={incomePieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {incomePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderColor: '#e2e8f0',
                              borderRadius: '12px',
                            }}
                            formatter={(value: any) => formatRawCurrency(Number(value))}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                      Нет данных по доходам
                    </div>
                  )}
                </div>

                {/* Expense Pie */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">
                    Структура Расходов
                  </h4>
                  {expensePieData.length > 0 ? (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensePieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {expensePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderColor: '#e2e8f0',
                              borderRadius: '12px',
                            }}
                            formatter={(value: any) => formatRawCurrency(Number(value))}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                      Нет данных по расходам
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Transactions Breakdown List */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-slate-700" />
                  Детализация операций ({sortedFinancialList.length})
                </h3>

                {isDeleteMode && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 animate-pulse">
                    Выбрано: {selectedForDelete.size}
                  </span>
                )}
              </div>

              {/* Action buttons & Sorting selector */}
              <div className="flex items-center gap-2">
                {!isGuest && sortedFinancialList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteMode(!isDeleteMode);
                      if (isDeleteMode) {
                        setSelectedForDelete(new Set());
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                      isDeleteMode
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleteMode ? 'Выйти из режима' : 'Удалить'}</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700 cursor-pointer text-xs"
                  >
                    <option value="date_desc">Сначала новые</option>
                    <option value="date_asc">Сначала старые</option>
                    <option value="amount_desc">По сумме (убывание)</option>
                    <option value="amount_asc">По сумме (возрастание)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Batch Action Toolbar when in Delete Mode */}
            {isDeleteMode && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 mb-3 rounded-xl bg-slate-50 border border-slate-200 animate-fade-in">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors"
                  >
                    {selectedForDelete.size === sortedFinancialList.length && sortedFinancialList.length > 0 ? (
                      <>
                        <Square className="w-3.5 h-3.5 text-slate-500" />
                        <span>Снять все</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-slate-900" />
                        <span>Выбрать все</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs text-slate-500">
                    Отметьте нужные операции галочками ниже
                  </span>
                </div>

                <button
                  type="button"
                  disabled={selectedForDelete.size === 0}
                  onClick={() => handleRequestDelete()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                    selectedForDelete.size > 0
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить выбранные ({selectedForDelete.size})</span>
                </button>
              </div>
            )}

            {sortedFinancialList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                Финансовых записей по заданным фильтрам не найдено
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                {sortedFinancialList.map((task) => {
                  const inc = task.financials?.income || 0;
                  const exp = task.financials?.expense || 0;
                  const isSelected = selectedForDelete.has(task.id);

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        if (isDeleteMode) {
                          handleToggleSelect(task.id);
                        }
                      }}
                      className={`py-2.5 flex items-center justify-between gap-3 px-2.5 rounded-xl transition-all ${
                        isDeleteMode ? 'cursor-pointer' : ''
                      } ${
                        isSelected
                          ? 'bg-rose-50/70 border border-rose-200'
                          : 'hover:bg-slate-50/80 border border-transparent'
                      }`}
                    >
                      {/* Left: Checkbox in delete mode */}
                      {isDeleteMode && (
                        <div className="shrink-0 pr-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(task.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{format(parseISO(task.date), 'd MMMM yyyy', { locale: ru })}</span>
                          <span>•</span>
                          <span className="capitalize font-semibold text-slate-700">
                            {task.category === 'study' ? 'Учеба' : task.category === 'work' ? 'Работа' : 'Иное'}
                          </span>
                          {exp > 0 && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <Receipt className="w-2.5 h-2.5" />
                                {getExpenseCategoryLabel(task.financials?.expenseCategory || task.financials?.note)}
                              </span>
                            </>
                          )}
                          {task.financials?.note && exp <= 0 && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-400 truncate">{task.financials.note}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right shrink-0">
                        <div>
                          {inc > 0 && (
                            <div className="text-xs font-black text-emerald-700">
                              +{formatCurrency(inc)}
                            </div>
                          )}
                          {exp > 0 && (
                            <div className="text-xs font-black text-rose-700">
                              -{formatCurrency(exp)}
                            </div>
                          )}
                        </div>

                        {/* Direct Delete button per item in delete mode */}
                        {isDeleteMode && !isGuest && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestDelete(task.id);
                            }}
                            title="Удалить эту запись"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-white hover:bg-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500">
            Найдено записей: <strong className="text-slate-800">{filteredTasks.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-xs"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
