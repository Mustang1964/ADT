'use client';

import React, { useState, useEffect } from 'react';
import { TaskItem, ActivityCategory, TaskStatus, UserRole, ExpenseCategory } from '@/types';
import { DEFAULT_CATEGORIES, EXPENSE_CATEGORIES, getExpenseCategoryLabel } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import {
  X,
  Calendar,
  Clock,
  Briefcase,
  GraduationCap,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Trash2,
  FileText,
  AlertTriangle,
  Lock,
  Tag,
  Receipt,
} from 'lucide-react';
import { format } from 'date-fns';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  defaultDate?: string;
  defaultHour?: string;
  userRole: UserRole;
  onSave: (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  defaultDate,
  defaultHour,
  userRole,
  onSave,
  onDelete,
}) => {
  const isGuest = userRole === 'guest';
  const isEdit = Boolean(task);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('work');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [date, setDate] = useState(defaultDate || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(defaultHour || '10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [income, setIncome] = useState<number | ''>('');
  const [expense, setExpense] = useState<number | ''>('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('food');
  const [status, setStatus] = useState<TaskStatus>('planned');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens or task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setCategory(task.category || 'work');
      setCustomCategoryName(task.customCategoryName || '');
      setDate(task.date || format(new Date(), 'yyyy-MM-dd'));
      setStartTime(task.startTime || '10:00');
      setEndTime(task.endTime || '11:00');
      setIsAllDay(Boolean(task.isAllDay));
      setIncome(task.financials?.income ?? '');
      setExpense(task.financials?.expense ?? '');
      
      // Determine expense category: from task.financials.expenseCategory or fallback from note
      const catId = task.financials?.expenseCategory;
      if (catId) {
        setExpenseCategory(catId);
      } else if (task.financials?.note) {
        const found = EXPENSE_CATEGORIES.find(
          (c) => c.id === task.financials?.note || c.label.toLowerCase() === task.financials?.note?.toLowerCase()
        );
        setExpenseCategory(found ? found.id : 'other');
      } else {
        setExpenseCategory('food');
      }

      setStatus(task.status || 'planned');
      setPriority(task.priority || 'medium');
    } else {
      setTitle('');
      setDescription('');
      setCategory('work');
      setCustomCategoryName('');
      setDate(defaultDate || format(new Date(), 'yyyy-MM-dd'));
      setStartTime(defaultHour || '10:00');
      // Set end time 1 hour after start
      if (defaultHour) {
        const h = parseInt(defaultHour.split(':')[0], 10);
        setEndTime(`${String(Math.min(h + 1, 23)).padStart(2, '0')}:00`);
      } else {
        setEndTime('11:00');
      }
      setIsAllDay(false);
      setIncome('');
      setExpense('');
      setExpenseCategory('food');
      setStatus('planned');
      setPriority('medium');
    }
    setError(null);
  }, [task, defaultDate, defaultHour, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;

    if (!title.trim()) {
      setError('Пожалуйста, укажите название дела');
      return;
    }

    const expValue = Number(expense) || 0;
    const incValue = Number(income) || 0;
    const catLabel = getExpenseCategoryLabel(expenseCategory);

    onSave({
      ...(task ? { id: task.id } : {}),
      title: title.trim(),
      description: description.trim(),
      category,
      customCategoryName: category === 'custom' ? customCategoryName : undefined,
      date,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      financials: {
        income: incValue,
        expense: expValue,
        currency: 'RUB',
        expenseCategory: expValue > 0 ? expenseCategory : undefined,
        note: expValue > 0 ? catLabel : undefined,
      },
      status,
      priority,
    });
    onClose();
  };

  const netDiff = (Number(income) || 0) - (Number(expense) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              {category === 'study' ? (
                <GraduationCap className="w-4 h-4" />
              ) : category === 'work' ? (
                <Briefcase className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isGuest ? 'Просмотр дела' : isEdit ? 'Редактировать дело' : 'Новое дело'}
              </h2>
              {isGuest && (
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                  <Lock className="w-2.5 h-2.5" /> Режим гостя (только чтение)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Название дела *
            </label>
            <input
              type="text"
              disabled={isGuest}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Защита проекта / Лекция / Разработка..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed shadow-xs"
            />
          </div>

          {/* Category selection (Study, Work, Other) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Тип занятости *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isGuest}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-transparent shadow-xs ring-2 ring-slate-900 ring-offset-1'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: cat.bgColor, borderColor: cat.borderColor, color: cat.textColor }
                        : {}
                    }
                  >
                    {cat.id === 'study' ? (
                      <GraduationCap className="w-3.5 h-3.5" />
                    ) : cat.id === 'work' ? (
                      <Briefcase className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-700" /> Дата
              </label>
              <input
                type="date"
                disabled={isGuest}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-50 shadow-xs"
              />
            </div>

            {/* Time / All Day */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-700" /> Время
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isGuest}
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                  />
                  <span>Весь день</span>
                </label>
              </div>

              {!isAllDay ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    disabled={isGuest}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-50 shadow-xs"
                  />
                  <input
                    type="time"
                    disabled={isGuest}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-50 shadow-xs"
                  />
                </div>
              ) : (
                <div className="py-2 text-xs text-slate-500 italic bg-slate-50 rounded-xl px-3 border border-slate-200">
                  Событие на весь день
                </div>
              )}
            </div>
          </div>

          {/* Financial Section: Income & Expense (Hidden for Guest) */}
          {!isGuest && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-900" />
                  Финансовые показатели
                </span>
                <span
                  className={`text-xs font-extrabold ${
                    netDiff > 0 ? 'text-emerald-600' : netDiff < 0 ? 'text-rose-600' : 'text-slate-500'
                  }`}
                >
                  Баланс: {netDiff > 0 ? '+' : ''}{formatCurrency(netDiff)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Income (Green) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Доход (₽)
                  </label>
                  <input
                    type="number"
                    disabled={isGuest}
                    value={income}
                    onChange={(e) => setIncome(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    step="any"
                    className="w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 placeholder-slate-400 focus:outline-none disabled:bg-slate-50 shadow-xs"
                  />
                </div>

                {/* Expense (Red) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Расход (₽)
                  </label>
                  <input
                    type="number"
                    disabled={isGuest}
                    value={expense}
                    onChange={(e) => setExpense(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    step="any"
                    className="w-full bg-white border border-rose-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600 rounded-xl px-3 py-2 text-xs font-bold text-rose-700 placeholder-slate-400 focus:outline-none disabled:bg-slate-50 shadow-xs"
                  />
                </div>
              </div>

              {/* Expense Category Dropdown (instead of freeform note) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-slate-500" />
                  Категория расхода
                </label>
                <select
                  disabled={isGuest}
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-50 shadow-xs cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji ? `${cat.emoji} ` : ''}{cat.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Укажите категорию трат для точного учета в финансовой аналитике
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-700" /> Описание
            </label>
            <textarea
              disabled={isGuest}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробности, пункты плана, ссылки или заметки..."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none disabled:bg-slate-50 shadow-xs"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Статус</label>
              <select
                disabled={isGuest}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-50 shadow-xs cursor-pointer"
              >
                <option value="planned">Запланировано</option>
                <option value="in_progress">В процессе</option>
                <option value="completed">Выполнено</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Приоритет</label>
              <select
                disabled={isGuest}
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-50 shadow-xs cursor-pointer"
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          {isEdit && !isGuest && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('Вы уверены, что хотите удалить это дело?')) {
                  onDelete(task!.id);
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              {isGuest ? 'Закрыть' : 'Отмена'}
            </button>

            {!isGuest && (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all active:scale-98"
              >
                {isEdit ? 'Сохранить изменения' : 'Создать дело'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
