'use client';

import React from 'react';
import { TaskItem, UserRole } from '@/types';
import { formatCurrency, getCategoryConfig, getMonthGrid } from '@/lib/utils';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  tasks: TaskItem[];
  userRole: UserRole;
  onSelectTask: (task: TaskItem) => void;
  onSelectDay: (day: Date) => void;
  onAddNewTaskOnDate?: (dateStr: string) => void;
}

const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  tasks,
  userRole,
  onSelectTask,
  onSelectDay,
  onAddNewTaskOnDate,
}) => {
  const monthDays = getMonthGrid(currentDate);
  const isGuest = userRole === 'guest';

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-6 border border-slate-200 shadow-xs">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {WEEKDAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={`text-xs font-bold uppercase tracking-wider py-1.5 ${
              i >= 5 ? 'text-rose-600' : 'text-slate-600'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {monthDays.map(({ date, isCurrentMonth, isToday }) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayTasks = tasks
            .filter((t) => t.date === dateStr)
            .sort((a, b) => {
              if (a.isAllDay && !b.isAllDay) return -1;
              if (!a.isAllDay && b.isAllDay) return 1;
              return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
            });

          const dayIncome = dayTasks.reduce((acc, t) => acc + (t.financials?.income || 0), 0);
          const dayExpense = dayTasks.reduce((acc, t) => acc + (t.financials?.expense || 0), 0);

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDay(date)}
              className={`min-h-[105px] sm:min-h-[120px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group ${
                isToday
                  ? 'bg-slate-50/90 border-slate-900 ring-1 ring-slate-900 shadow-sm'
                  : isCurrentMonth
                  ? 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/80 shadow-xs'
                  : 'bg-slate-50/50 border-slate-100 opacity-40 hover:opacity-75'
              }`}
            >
              {/* Day Cell Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isToday
                      ? 'bg-slate-900 text-white shadow-xs'
                      : isCurrentMonth
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {format(date, 'd')}
                </span>

                {/* Day Financial summary badge (Hidden for guest) */}
                {!isGuest && (dayIncome > 0 || dayExpense > 0) && (
                  <div className="flex items-center gap-1 text-[9px] font-bold">
                    {dayIncome > 0 && (
                      <span className="text-emerald-600">+{formatCurrency(dayIncome)}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-rose-600">-{formatCurrency(dayExpense)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Task badges */}
              <div className="space-y-1 my-1 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => {
                  const cat = getCategoryConfig(task.category);
                  return (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task);
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center gap-1 border transition-opacity hover:opacity-85 shadow-2xs"
                      style={{
                        backgroundColor: cat.bgColor,
                        color: cat.textColor,
                        borderColor: cat.borderColor,
                      }}
                    >
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}

                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-slate-500 font-semibold pl-1">
                    +{dayTasks.length - 3} еще
                  </div>
                )}
              </div>

              {/* Quick Add indicator on hover */}
              {!isGuest && onAddNewTaskOnDate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddNewTaskOnDate(dateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 self-end text-[10px] text-slate-500 hover:text-slate-900 p-0.5 rounded hover:bg-slate-200 transition-opacity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
