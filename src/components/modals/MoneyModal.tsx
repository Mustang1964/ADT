'use client';

import React, { useState, useEffect } from 'react';
import { TaskItem, ActivityCategory, ExpenseCategory } from '@/types';
import { formatRawCurrency } from '@/lib/utils';
import { EXPENSE_CATEGORIES, getExpenseCategoryLabel } from '@/lib/constants';
import {
  X,
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  Check,
  Plus,
  ArrowRight,
  Sparkles,
  Receipt,
} from 'lucide-react';
import { format } from 'date-fns';

interface MoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'base' | 'income' | 'expense';
  currentBaseBalance: number;
  onSaveBaseBalance: (newBase: number) => void;
  onAddQuickTransaction: (transaction: {
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: ActivityCategory;
    expenseCategory?: ExpenseCategory;
    date: string;
  }) => void;
}

export const MoneyModal: React.FC<MoneyModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'base',
  currentBaseBalance,
  onSaveBaseBalance,
  onAddQuickTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'base' | 'quick'>('base');
  const [baseAmount, setBaseAmount] = useState<number | ''>(currentBaseBalance || '');

  // Quick transaction fields
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txTitle, setTxTitle] = useState('');
  const [txCategory, setTxCategory] = useState<ActivityCategory>('work');
  const [txExpenseCategory, setTxExpenseCategory] = useState<ExpenseCategory>('food');
  const [txDate, setTxDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBaseAmount(currentBaseBalance || '');
      if (initialMode === 'income' || initialMode === 'expense') {
        setActiveTab('quick');
        setTxType(initialMode);
      } else {
        setActiveTab('base');
      }
      setSuccessMsg(null);
    }
  }, [isOpen, currentBaseBalance, initialMode]);

  if (!isOpen) return null;

  const handleSaveBase = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(baseAmount) || 0;
    onSaveBaseBalance(val);
    setSuccessMsg('Текущий базовый капитал сохранен!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1000);
  };

  const handleAddQuickTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(txAmount) || 0;
    if (amt <= 0) return;

    onAddQuickTransaction({
      title: txTitle.trim() || (txType === 'income' ? 'Поступление средств' : 'Расход средств'),
      amount: amt,
      type: txType,
      category: txCategory,
      expenseCategory: txType === 'expense' ? txExpenseCategory : undefined,
      date: txDate,
    });

    setSuccessMsg(`Операция на ${formatRawCurrency(amt)} успешно добавлена!`);
    setTxAmount('');
    setTxTitle('');
    setTxExpenseCategory('food');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Управление финансами</h2>
              <p className="text-xs text-slate-500 font-medium">
                Редактирование текущих денег и быстрых операций
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

        {/* Tab switch */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('base')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'base'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Базовый баланс</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quick')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'quick'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Быстрая операция</span>
            </button>
          </div>
        </div>

        {/* Success alert */}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Base Balance / Current Cash */}
        {activeTab === 'base' && (
          <form onSubmit={handleSaveBase} className="p-5 space-y-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-xs font-bold text-slate-700">Что такое базовый баланс?</span>
              <p className="text-[11px] text-slate-500">
                Это сумма текущих средств (капитал/сбережения на руках). К этой сумме прибавляются все доходы и вычитаются расходы за выбранный период.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-700" />
                Текущие деньги / Стартовый капитал (₽)
              </label>
              <input
                type="number"
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                step="1000"
                className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-base font-extrabold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить текущие деньги</span>
            </button>
          </form>
        )}

        {/* Tab 2: Quick transaction */}
        {activeTab === 'quick' && (
          <form onSubmit={handleAddQuickTx} className="p-5 space-y-4">
            {/* Type Switch */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  txType === 'income'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>+ Доход</span>
              </button>
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  txType === 'expense'
                    ? 'border-rose-300 bg-rose-50 text-rose-700 ring-1 ring-rose-500 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>- Расход</span>
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Сумма (₽) *
              </label>
              <input
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Например: 5000"
                min="1"
                step="100"
                required
                className={`w-full bg-white border rounded-2xl px-4 py-2.5 text-sm font-extrabold focus:outline-none focus:ring-2 shadow-xs ${
                  txType === 'income'
                    ? 'border-emerald-300 text-emerald-700 focus:ring-emerald-600'
                    : 'border-rose-300 text-rose-700 focus:ring-rose-600'
                }`}
              />
            </div>

            {/* Title / Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Название / Назначение
              </label>
              <input
                type="text"
                value={txTitle}
                onChange={(e) => setTxTitle(e.target.value)}
                placeholder={txType === 'income' ? 'Например: Зарплата, подработка' : 'Например: Продукты, аренда, книги'}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
              />
            </div>

            {/* Category & Date Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Тип активности
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value as ActivityCategory)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs cursor-pointer"
                >
                  <option value="work">Работа</option>
                  <option value="study">Учеба</option>
                  <option value="other">Иное</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Дата
                </label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                />
              </div>
            </div>

            {/* Expense Category Selection when txType is expense */}
            {txType === 'expense' && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-rose-600" />
                  Категория расхода
                </label>
                <select
                  value={txExpenseCategory}
                  onChange={(e) => setTxExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-600 shadow-xs cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji ? `${cat.emoji} ` : ''}{cat.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Зафиксировать {txType === 'income' ? 'доход' : 'расход'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
