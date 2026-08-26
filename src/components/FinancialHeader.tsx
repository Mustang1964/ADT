'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Wallet, CheckCircle2, ListTodo, Plus, Edit2, Calendar } from 'lucide-react';
import { FinancialSummary, UserRole } from '@/types';
import { formatRawCurrency } from '@/lib/utils';

interface FinancialHeaderProps {
  summary: FinancialSummary;
  periodLabel: string;
  userRole?: UserRole;
  onOpenMoneyModal?: (mode: 'base' | 'income' | 'expense') => void;
}

export const FinancialHeader: React.FC<FinancialHeaderProps> = ({
  summary,
  periodLabel,
  userRole = 'admin',
  onOpenMoneyModal,
}) => {
  const isGuest = userRole === 'guest';
  const totalMoney = summary.totalCurrentMoney !== undefined ? summary.totalCurrentMoney : summary.netBalance;
  const isPositive = totalMoney >= 0;

  // In guest mode: ONLY SHOW OCCUPANCY & PROGRESS. NO FINANCIALS!
  if (isGuest) {
    return (
      <div className="my-4">
        <div className="p-4.5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Загруженность графика ({periodLabel})</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                  Режим просмотра
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Выполнено дел: <strong className="text-slate-800">{summary.completedTasks}</strong> из <strong className="text-slate-800">{summary.totalTasks}</strong> ({summary.totalTasks > 0 ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1 text-sky-700">
              Учеба: {summary.taskCountByCategory.study || 0}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-700">
              Работа: {summary.taskCountByCategory.work || 0}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-purple-700">
              Иное: {summary.taskCountByCategory.other || 0}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
      {/* Total Income Card (Green) */}
      <div
        onClick={() => onOpenMoneyModal && onOpenMoneyModal('income')}
        className="group relative p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-xs flex items-center justify-between transition-all hover:bg-emerald-50/90 hover:border-emerald-300 cursor-pointer"
        title="Нажмите, чтобы добавить доход"
      >
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Доходы ({periodLabel})</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-white text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
              + Добавить
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1 tracking-tight">
            +{formatRawCurrency(summary.totalIncome)}
          </div>
          <div className="text-[11px] text-emerald-800/70 mt-0.5 font-medium">
            Учеба: {formatRawCurrency(summary.incomeByCategory.study || 0)} • Работа: {formatRawCurrency(summary.incomeByCategory.work || 0)}
          </div>
        </div>
        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-white border border-emerald-200 items-center justify-center text-emerald-600 shadow-xs group-hover:scale-105 transition-transform">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* Total Expense Card (Red) */}
      <div
        onClick={() => onOpenMoneyModal && onOpenMoneyModal('expense')}
        className="group relative p-4 rounded-2xl border border-rose-200 bg-rose-50/60 shadow-xs flex items-center justify-between transition-all hover:bg-rose-50/90 hover:border-rose-300 cursor-pointer"
        title="Нажмите, чтобы зафиксировать расход"
      >
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>Расходы ({periodLabel})</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-white text-rose-800 px-1.5 py-0.2 rounded border border-rose-200">
              + Записать
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-1 tracking-tight">
            -{formatRawCurrency(summary.totalExpense)}
          </div>
          <div className="text-[11px] text-rose-800/70 mt-0.5 font-medium">
            Иное: {formatRawCurrency(summary.expenseByCategory.other || 0)} • Учеба: {formatRawCurrency(summary.expenseByCategory.study || 0)}
          </div>
        </div>
        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-white border border-rose-200 items-center justify-center text-rose-600 shadow-xs group-hover:scale-105 transition-transform">
          <TrendingDown className="w-5 h-5" />
        </div>
      </div>

      {/* Net Balance / Current Money Card (Editable Base Balance) */}
      <div
        onClick={() => onOpenMoneyModal && onOpenMoneyModal('base')}
        className={`group relative p-4 rounded-2xl border shadow-xs flex items-center justify-between transition-all cursor-pointer ${
          isPositive
            ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50/90 hover:border-emerald-300'
            : 'border-rose-200 bg-rose-50/60 hover:bg-rose-50/90 hover:border-rose-300'
        }`}
        title="Нажмите, чтобы настроить текущие деньги / стартовый баланс"
      >
        <div>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${isPositive ? 'text-emerald-800' : 'text-rose-800'}`}>
            <Wallet className="w-4 h-4" />
            <span>Текущий Баланс</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-white text-slate-800 px-1.5 py-0.2 rounded border border-slate-200">
              Изменить
            </span>
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold mt-1 tracking-tight ${
              isPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isPositive ? '+' : ''}
            {formatRawCurrency(totalMoney)}
          </div>
          <div className={`text-[11px] font-medium mt-0.5 ${isPositive ? 'text-emerald-800/70' : 'text-rose-800/70'}`}>
            {summary.baseBalance && summary.baseBalance > 0
              ? `База: ${formatRawCurrency(summary.baseBalance)} • Сальдо: ${summary.netBalance >= 0 ? '+' : ''}${formatRawCurrency(summary.netBalance)}`
              : isPositive
              ? 'Положительный баланс'
              : 'Отрицательный дефицит'}
          </div>
        </div>
        <div
          className={`hidden sm:flex w-10 h-10 rounded-xl bg-white items-center justify-center shadow-xs group-hover:scale-105 transition-transform ${
            isPositive ? 'text-emerald-600 border border-emerald-200' : 'text-rose-600 border border-rose-200'
          }`}
        >
          <Wallet className="w-5 h-5" />
        </div>
      </div>

      {/* Tasks & Productivity Card */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-xs flex items-center justify-between transition-all hover:bg-slate-50/90">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <ListTodo className="w-4 h-4 text-slate-900" />
            <span>Загруженность дел</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 tracking-tight flex items-baseline gap-2">
            <span>
              {summary.completedTasks} / {summary.totalTasks}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({summary.totalTasks > 0 ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Учеба: {summary.taskCountByCategory.study || 0} • Работа: {summary.taskCountByCategory.work || 0} • Иное:{' '}
            {summary.taskCountByCategory.other || 0}
          </div>
        </div>
        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center text-slate-800 shadow-xs">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
