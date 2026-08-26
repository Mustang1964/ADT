'use client';

import React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  BarChart3,
  Download,
  LogOut,
  ShieldAlert,
  UserCheck,
  CalendarDays,
  LayoutGrid,
  Clock,
} from 'lucide-react';
import { CalendarViewMode, UserRole } from '@/types';
import { formatDateRu } from '@/lib/utils';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears } from 'date-fns';

interface NavbarProps {
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  viewMode: CalendarViewMode;
  setViewMode: (m: CalendarViewMode) => void;
  userRole: UserRole;
  onOpenNewTask: () => void;
  onOpenAnalytics: () => void;
  onOpenBackup: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode,
  userRole,
  onOpenNewTask,
  onOpenAnalytics,
  onOpenBackup,
  onLogout,
}) => {
  const isGuest = userRole === 'guest';

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subYears(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addYears(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Date range title based on view
  const getDateTitle = () => {
    if (viewMode === 'day') {
      return formatDateRu(currentDate, 'EEEE, d MMMM yyyy');
    }
    if (viewMode === 'week') {
      return `${formatDateRu(currentDate, 'LLLL yyyy')} • Неделя ${format(currentDate, 'w')}`;
    }
    if (viewMode === 'month') {
      return formatDateRu(currentDate, 'LLLL yyyy');
    }
    return `${format(currentDate, 'yyyy')} год`;
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Date navigation */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <span className="text-sm font-black tracking-wider">
                ADT
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">ADT Platform</span>
                {isGuest ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-slate-500" /> Гость
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-600" /> Личный
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium capitalize">{getDateTitle()}</p>
            </div>
          </div>

          {/* Date Controls */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
            <button
              onClick={handlePrev}
              title="Назад"
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-xs"
            >
              Сегодня
            </button>
            <button
              onClick={handleNext}
              title="Вперед"
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: View Switcher (Day, Week, Month, Year) */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
          <button
            onClick={() => setViewMode('day')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'day'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>День</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'week'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Неделя</span>
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'month'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Месяц</span>
          </button>
          <button
            onClick={() => setViewMode('year')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'year'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Год</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* New Task Button (disabled visually if guest) */}
          <button
            onClick={onOpenNewTask}
            disabled={isGuest}
            title={isGuest ? 'В гостевом режиме добавление недоступно' : 'Добавить новое дело'}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
              isGuest
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Новое дело</span>
          </button>

          {/* Financial Analytics Modal Trigger (Admin only) */}
          {!isGuest && (
            <button
              onClick={onOpenAnalytics}
              title="Финансовая аналитика"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          )}

          {/* Backup / Export Trigger */}
          <button
            onClick={onOpenBackup}
            title="Резервное копирование и экспорт"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Выйти из платформы"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-xs"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
