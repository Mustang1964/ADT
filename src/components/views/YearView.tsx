'use client';

import React from 'react';
import { TaskItem, UserRole } from '@/types';
import { formatRawCurrency } from '@/lib/utils';
import {
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ru } from 'date-fns/locale';

interface YearViewProps {
  currentDate: Date;
  tasks: TaskItem[];
  userRole: UserRole;
  onSelectDay: (day: Date) => void;
  onSelectMonth: (monthDate: Date) => void;
}

export const YearView: React.FC<YearViewProps> = ({
  currentDate,
  tasks,
  userRole,
  onSelectDay,
  onSelectMonth,
}) => {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const today = new Date();
  const isGuest = userRole === 'guest';

  return (
    <div className="space-y-6">
      {/* 12 Months Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
          const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
          const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

          // Month statistics
          const monthTasks = tasks.filter((t) => {
            const taskDate = new Date(t.date);
            return isSameMonth(taskDate, month);
          });

          const monthIncome = monthTasks.reduce((acc, t) => acc + (t.financials?.income || 0), 0);
          const monthExpense = monthTasks.reduce((acc, t) => acc + (t.financials?.expense || 0), 0);
          const monthBalance = monthIncome - monthExpense;

          return (
            <div
              key={month.toISOString()}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              {/* Month Header */}
              <div>
                <div
                  onClick={() => onSelectMonth(month)}
                  className="flex items-center justify-between cursor-pointer group pb-2 border-b border-slate-100"
                >
                  <h3 className="text-sm font-extrabold capitalize text-slate-900 group-hover:text-slate-600 transition-colors">
                    {format(month, 'LLLL', { locale: ru })}
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    {monthTasks.length} дел
                  </span>
                </div>

                {/* Mini Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 text-center mt-2 mb-1">
                  {['П', 'В', 'С', 'Ч', 'П', 'С', 'В'].map((d, idx) => (
                    <span
                      key={idx}
                      className={`text-[9px] font-bold ${
                        idx >= 5 ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Mini Day Heatmap Matrix */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCurMonth = isSameMonth(day, month);
                    const isToday = isSameDay(day, today);
                    const dayTasks = tasks.filter((t) => t.date === dateStr);
                    const taskCount = dayTasks.length;

                    // Color density based on tasks
                    let bgClass = 'bg-slate-50 text-slate-600';
                    if (taskCount >= 3) bgClass = 'bg-slate-900 text-white font-bold';
                    else if (taskCount >= 1) bgClass = 'bg-slate-200 text-slate-900 font-semibold';

                    if (isToday) {
                      bgClass = 'bg-slate-900 text-white font-black ring-2 ring-emerald-500';
                    }

                    return (
                      <button
                        key={dateStr}
                        onClick={() => onSelectDay(day)}
                        className={`w-full aspect-square rounded text-[9px] flex items-center justify-center transition-all ${
                          !isCurMonth ? 'opacity-20 pointer-events-none' : 'hover:scale-110 hover:ring-1 hover:ring-slate-900'
                        } ${bgClass}`}
                        title={`${format(day, 'd MMMM')}: ${taskCount} дел`}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month Financial Summary footer (Hidden for guest) */}
              {!isGuest && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
                  <div className="flex items-center gap-1.5">
                    {monthIncome > 0 && (
                      <span className="text-emerald-600">+{formatRawCurrency(monthIncome)}</span>
                    )}
                    {monthExpense > 0 && (
                      <span className="text-rose-600">-{formatRawCurrency(monthExpense)}</span>
                    )}
                  </div>
                  <div
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      monthBalance >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                    }`}
                  >
                    {monthBalance >= 0 ? '+' : ''}{formatRawCurrency(monthBalance)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
