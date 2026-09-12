'use client';

import React from 'react';
import { TaskItem, UserRole } from '@/types';
import { formatCurrency, getCategoryConfig, HOURS_24 } from '@/lib/utils';
import { format } from 'date-fns';
import { Clock, Plus, CheckCircle2, Circle, Calendar, Wallet } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  tasks: TaskItem[];
  userRole: UserRole;
  onSelectTask: (task: TaskItem) => void;
  onToggleStatus: (task: TaskItem, e: React.MouseEvent) => void;
  onAddNewTaskAtHour?: (hour: string) => void;
  onAddNewTask?: () => void;
  onOpenMoneyModal?: (mode: 'base' | 'income' | 'expense') => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  tasks,
  userRole,
  onSelectTask,
  onToggleStatus,
  onAddNewTaskAtHour,
  onAddNewTask,
  onOpenMoneyModal,
}) => {
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dayTasks = tasks.filter((t) => t.date === dateStr);

  const allDayTasks = dayTasks.filter((t) => t.isAllDay);
  const timedTasks = dayTasks.filter((t) => !t.isAllDay);

  const isGuest = userRole === 'guest';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
      {/* All-Day Tasks Section */}
      {allDayTasks.length > 0 && (
        <div className="mb-6 pb-4 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-700" />
            Задачи на весь день ({allDayTasks.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {allDayTasks.map((task) => {
              const cat = getCategoryConfig(task.category);
              const hasIncome = (task.financials?.income || 0) > 0;
              const hasExpense = (task.financials?.expense || 0) > 0;

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="group relative p-3 rounded-xl border bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer shadow-xs"
                  style={{ borderColor: cat.borderColor }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <button
                        onClick={(e) => onToggleStatus(task, e)}
                        disabled={isGuest}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <h4
                          className={`text-xs font-bold text-slate-900 truncate ${
                            task.status === 'completed' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 border"
                          style={{ backgroundColor: cat.bgColor, color: cat.textColor, borderColor: cat.borderColor }}
                        >
                          {cat.label}
                        </span>
                      </div>
                    </div>

                    {/* Financial badges (Hidden for guest) */}
                    {!isGuest && (hasIncome || hasExpense) && (
                      <div className="flex flex-col items-end gap-0.5 text-[11px] font-bold">
                        {hasIncome && (
                          <span className="text-emerald-600 flex items-center gap-0.5">
                            +{formatCurrency(task.financials.income)}
                          </span>
                        )}
                        {hasExpense && (
                          <span className="text-rose-600 flex items-center gap-0.5">
                            -{formatCurrency(task.financials.expense)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hourly Timeline */}
      <div className="space-y-1">
        {HOURS_24.map((hour) => {
          const hourNum = parseInt(hour.split(':')[0], 10);
          // Find tasks that start in this hour
          const hourTasks = timedTasks.filter((t) => {
            if (!t.startTime) return false;
            const tHour = parseInt(t.startTime.split(':')[0], 10);
            return tHour === hourNum;
          });

          return (
            <div
              key={hour}
              className="group flex items-start gap-4 min-h-[56px] py-1.5 px-2 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-100"
            >
              {/* Hour Label */}
              <div className="w-14 text-xs font-mono font-semibold text-slate-400 pt-1 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 group-hover:text-slate-900 transition-colors" />
                <span>{hour}</span>
              </div>

              {/* Task Slots / Create trigger */}
              <div className="flex-1 flex flex-wrap gap-2 items-center">
                {hourTasks.length > 0 ? (
                  hourTasks.map((task) => {
                    const cat = getCategoryConfig(task.category);
                    const hasIncome = (task.financials?.income || 0) > 0;
                    const hasExpense = (task.financials?.expense || 0) > 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className="flex-1 min-w-[240px] max-w-full p-2.5 rounded-xl border bg-white hover:bg-slate-50/80 hover:border-slate-400 transition-all cursor-pointer shadow-xs flex items-center justify-between gap-3"
                        style={{ borderLeftColor: cat.color, borderLeftWidth: '3px' }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={(e) => onToggleStatus(task, e)}
                            disabled={isGuest}
                            className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold text-slate-900 truncate ${
                                  task.status === 'completed' ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {task.title}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                                style={{ backgroundColor: cat.bgColor, color: cat.textColor, borderColor: cat.borderColor }}
                              >
                                {cat.label}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                              <span>
                                {task.startTime} - {task.endTime || '...'}
                              </span>
                              {task.description && (
                                <span className="truncate max-w-[200px] text-slate-400">
                                  • {task.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Financials for this task (Hidden for guest) */}
                        {!isGuest && (hasIncome || hasExpense) && (
                          <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                            {hasIncome && (
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                +{formatCurrency(task.financials.income)}
                              </span>
                            )}
                            {hasExpense && (
                              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                                -{formatCurrency(task.financials.expense)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  !isGuest && onAddNewTaskAtHour && (
                    <button
                      onClick={() => onAddNewTaskAtHour(hour)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-opacity py-1 px-2.5 rounded-lg hover:bg-slate-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Добавить на {hour}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons at the Bottom of Day View */}
      {!isGuest && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
          {onAddNewTask && (
            <button
              type="button"
              onClick={onAddNewTask}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить дело</span>
            </button>
          )}

          {onOpenMoneyModal && (
            <button
              type="button"
              onClick={() => onOpenMoneyModal('expense')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Wallet className="w-4 h-4 text-slate-700" />
              <span>Добавить финансы</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
