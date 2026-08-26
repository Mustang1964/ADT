'use client';

import React from 'react';
import { FinancialSummary, TaskItem } from '@/types';
import { formatRawCurrency } from '@/lib/utils';
import {
  X,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
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
} from 'recharts';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: FinancialSummary;
  tasks: TaskItem[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  summary,
}) => {
  if (!isOpen) return null;

  // Prepare data for category comparison chart
  const categoryData = [
    {
      name: 'Учеба',
      Доход: summary.incomeByCategory.study || 0,
      Расход: summary.expenseByCategory.study || 0,
    },
    {
      name: 'Работа',
      Доход: summary.incomeByCategory.work || 0,
      Расход: summary.expenseByCategory.work || 0,
    },
    {
      name: 'Иное',
      Доход: summary.incomeByCategory.other || 0,
      Расход: summary.expenseByCategory.other || 0,
    },
  ];

  // Pie chart data for expense distribution
  const expensePieData = [
    { name: 'Учеба', value: summary.expenseByCategory.study || 0, color: '#0ea5e9' },
    { name: 'Работа', value: summary.expenseByCategory.work || 0, color: '#10b981' },
    { name: 'Иное', value: summary.expenseByCategory.other || 0, color: '#8b5cf6' },
  ].filter((d) => d.value > 0);

  // Pie chart data for income distribution
  const incomePieData = [
    { name: 'Учеба', value: summary.incomeByCategory.study || 0, color: '#0ea5e9' },
    { name: 'Работа', value: summary.incomeByCategory.work || 0, color: '#10b981' },
    { name: 'Иное', value: summary.incomeByCategory.other || 0, color: '#8b5cf6' },
  ].filter((d) => d.value > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Финансовая Аналитика ADT</h2>
              <p className="text-xs text-slate-500 font-medium">
                Детальный баланс доходов и расходов по типам занятости
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Summary Big Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-xs">
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Общий доход
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                +{formatRawCurrency(summary.totalIncome)}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 shadow-xs">
              <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" /> Общий расход
              </div>
              <div className="text-2xl font-extrabold text-rose-700 mt-1">
                -{formatRawCurrency(summary.totalExpense)}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-xs ${
              summary.netBalance >= 0 ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'
            }`}>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4" /> Чистый результат
              </div>
              <div
                className={`text-2xl font-extrabold mt-1 ${
                  summary.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {summary.netBalance >= 0 ? '+' : ''}{formatRawCurrency(summary.netBalance)}
              </div>
            </div>
          </div>

          {/* Bar Chart: Income vs Expense by Category */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-slate-900" />
              Доходы и Расходы по типам занятости
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontWeight: 600,
                    }}
                    formatter={(value: any) => formatRawCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="Доход" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Расход" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Income Distribution */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                Структура Доходов
              </h3>
              {incomePieData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
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
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontWeight: 600,
                        }}
                        formatter={(value: any) => formatRawCurrency(Number(value))}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-medium">
                  Нет данных по доходам
                </div>
              )}
            </div>

            {/* Expense Distribution */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">
                Структура Расходов
              </h3>
              {expensePieData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
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
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontWeight: 600,
                        }}
                        formatter={(value: any) => formatRawCurrency(Number(value))}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-medium">
                  Нет данных по расходам
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
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
