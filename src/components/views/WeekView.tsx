'use client';

import React from 'react';
import { TaskItem, UserRole } from '@/types';
import { formatCurrency, getCategoryConfig, getWeekDays, formatDateRu } from '@/lib/utils';
import { format, isSameDay } from 'date-fns';
import { Plus, CheckCircle2, Circle } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  tasks: TaskItem[];
  userRole: UserRole;
  onSelectTask: (task: TaskItem) => void;
  onSelectDay: (day: Date) => void;
  onToggleStatus: (task: TaskItem, e: React.MouseEvent) => void;
  onAddNewTaskOnDate?: (dateStr: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  tasks,
  userRole,
  onSelectTask,
  onSelectDay,
  onToggleStatus,
  onAddNewTaskOnDate,
}) => {
  const weekDays = getWeekDays(currentDate);
  const today = new Date();
  const isGuest = userRole === 'guest';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs overflow-x-auto">
      {/* 7 Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 min-w-[700px]">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isToday = isSameDay(day, today);
          const dayTasks = tasks
            .filter((t) => t.date === dateStr)
            .sort((a, b) => {
              if (a.isAllDay && !b.isAllDay) return -1;
              if (!a.isAllDay && b.isAllDay) return 1;
              return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
            });

          // Daily financial totals
          const dayIncome = dayTasks.reduce((acc, t) => acc + (t.financials?.income || 0), 0);
          const dayExpense = dayTasks.reduce((acc, t) => acc + (t.financials?.expense || 0), 0);

          return (
            <div
              key={dateStr}
              className={`flex flex-col rounded-xl border transition-all ${
                isToday
                  ? 'bg-slate-50/90 border-slate-900 ring-1 ring-slate-900 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Day Header */}
              <div
                onClick={() => onSelectDay(day)}
                className="p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-50 rounded-t-xl transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    {formatDateRu(day, 'EEE')}
                  </span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isToday ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-800'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Day Financial summary badges (Hidden for guest) */}
                {!isGuest && (dayIncome > 0 || dayExpense > 0) && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold">
                    {dayIncome > 0 && (
                      <span className="text-emerald-600">+{formatCurrency(dayIncome)}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-rose-600">-{formatCurrency(dayExpense)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tasks List for the day */}
              <div className="p-2 flex-1 space-y-2 min-h-[220px]">
                {dayTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[11px] text-slate-400 py-6 font-medium">
                    <span>Нет дел</span>
                    {!isGuest && onAddNewTaskOnDate && (
                      <button
                        onClick={() => onAddNewTaskOnDate(dateStr)}
                        className="mt-2 text-slate-700 hover:text-slate-900 text-[10px] font-bold flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Добавить
                      </button>
                    )}
                  </div>
                ) : (
                  dayTasks.map((task) => {
                    const cat = getCategoryConfig(task.category);
                    const hasIncome = (task.financials?.income || 0) > 0;
                    const hasExpense = (task.financials?.expense || 0) > 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className="p-2.5 rounded-lg border bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs group"
                        style={{ borderLeftColor: cat.color, borderLeftWidth: '3px' }}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {task.title}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              {task.isAllDay ? 'Весь день' : `${task.startTime || ''}`}
                            </div>
                          </div>

                          <button
                            onClick={(e) => onToggleStatus(task, e)}
                            disabled={isGuest}
                            className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Fin tag (Hidden for guest) */}
                        {!isGuest && (hasIncome || hasExpense) && (
                          <div className="flex items-center gap-1 text-[10px] font-bold mt-1.5 pt-1 border-t border-slate-100">
                            {hasIncome && (
                              <span className="text-emerald-600">
                                +{formatCurrency(task.financials.income)}
                              </span>
                            )}
                            {hasExpense && (
                              <span className="text-rose-600">
                                -{formatCurrency(task.financials.expense)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add button at bottom */}
              {!isGuest && onAddNewTaskOnDate && (
                <div className="p-2 border-t border-slate-100">
                  <button
                    onClick={() => onAddNewTaskOnDate(dateStr)}
                    className="w-full py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Добавить
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
