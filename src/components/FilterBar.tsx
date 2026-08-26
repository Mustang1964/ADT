'use client';

import React from 'react';
import { Search, GraduationCap, Briefcase, Sparkles } from 'lucide-react';
import { ActivityCategory } from '@/types';

interface FilterBarProps {
  selectedCategory: ActivityCategory | 'all';
  setSelectedCategory: (cat: ActivityCategory | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <span>Все категории</span>
        </button>

        <button
          onClick={() => setSelectedCategory('study')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'study'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Учеба</span>
        </button>

        <button
          onClick={() => setSelectedCategory('work')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'work'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Работа</span>
        </button>

        <button
          onClick={() => setSelectedCategory('other')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'other'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Иное</span>
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        {/* Search */}
        <div className="relative flex-1 md:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск по делам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent shadow-xs"
          />
        </div>

        {/* Status selector */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent cursor-pointer shadow-xs"
        >
          <option value="all">Все статусы</option>
          <option value="planned">Запланировано</option>
          <option value="in_progress">В процессе</option>
          <option value="completed">Выполнено</option>
          <option value="cancelled">Отменено</option>
        </select>
      </div>
    </div>
  );
};
