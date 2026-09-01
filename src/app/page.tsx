'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarViewMode, TaskItem, UserRole, ActivityCategory, TaskStatus } from '@/types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadBaseBalanceFromStorage,
  saveBaseBalanceToStorage,
} from '@/lib/storage';
import { calculateFinancialSummary, formatDateRu } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { FinancialHeader } from '@/components/FinancialHeader';
import { FilterBar } from '@/components/FilterBar';
import { DayView } from '@/components/views/DayView';
import { WeekView } from '@/components/views/WeekView';
import { MonthView } from '@/components/views/MonthView';
import { YearView } from '@/components/views/YearView';
import { TaskModal } from '@/components/modals/TaskModal';
import { AnalyticsModal } from '@/components/modals/AnalyticsModal';
import { BackupModal } from '@/components/modals/BackupModal';
import { MoneyModal } from '@/components/modals/MoneyModal';
import {
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  parseISO,
  format,
} from 'date-fns';
import { ShieldAlert } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // User session state
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  // View & Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filter & Search state
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Tasks & Money state
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [baseBalance, setBaseBalance] = useState<number>(0);
  const [isTasksLoaded, setIsTasksLoaded] = useState(false);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [modalDefaultHour, setModalDefaultHour] = useState<string | undefined>(undefined);

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Money modal state
  const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);
  const [moneyModalMode, setMoneyModalMode] = useState<'base' | 'income' | 'expense'>('base');

  // Check auth session
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.isLoggedIn) {
            setUserRole(data.role || 'admin');
            setIsSessionLoaded(true);
            return;
          }
        }
        router.push('/login');
      } catch (err) {
        router.push('/login');
      }
    }
    checkSession();
  }, [router]);

  // Load tasks & base balance from cloud with localStorage fallback and sync
  useEffect(() => {
    async function loadData() {
      // 1. Initial fast local load
      const localTasks = loadTasksFromStorage();
      const localBase = loadBaseBalanceFromStorage();
      setTasks(localTasks);
      setBaseBalance(localBase);
      setIsTasksLoaded(true);

      // 2. Fetch fresh data from Cloud Server
      try {
        const res = await fetch('/api/data/sync');
        if (res.ok) {
          const cloud = await res.json();
          if (cloud.success) {
            // Task synchronization:
            // If cloud has tasks, use cloud tasks.
            // If cloud is empty but local has tasks, restore cloud with local tasks!
            if (Array.isArray(cloud.tasks) && cloud.tasks.length > 0) {
              setTasks(cloud.tasks);
              saveTasksToStorage(cloud.tasks);
            } else if (localTasks.length > 0) {
              fetch('/api/data/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: localTasks }),
              }).catch(() => {});
            }

            // Balance synchronization:
            // If cloud has a balance > 0, sync to local.
            // If cloud has 0 but local has a balance, push local balance to cloud instead of resetting to 0!
            if (typeof cloud.baseBalance === 'number' && cloud.baseBalance > 0) {
              setBaseBalance(cloud.baseBalance);
              saveBaseBalanceToStorage(cloud.baseBalance);
            } else if (localBase > 0) {
              fetch('/api/data/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseBalance: localBase }),
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.error('Cloud sync error, using local data', err);
      }
    }

    loadData();
  }, []);

  // Save tasks on state changes & push to cloud
  const updateTasks = (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    saveTasksToStorage(newTasks);

    // Sync to cloud in background
    fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: newTasks }),
    }).catch((err) => console.error('Cloud task sync failed:', err));
  };

  // Base balance updater & push to cloud
  const handleSaveBaseBalance = (newBase: number) => {
    setBaseBalance(newBase);
    saveBaseBalanceToStorage(newBase);

    // Sync to cloud in background
    fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseBalance: newBase }),
    }).catch((err) => console.error('Cloud balance sync failed:', err));
  };

  // Quick transaction adder
  const handleAddQuickTransaction = (tx: {
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: ActivityCategory;
    date: string;
  }) => {
    const nowIso = new Date().toISOString();
    const newTask: TaskItem = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: tx.title,
      description: tx.type === 'income' ? 'Финансовое поступление' : 'Финансовый расход',
      category: tx.category,
      date: tx.date,
      isAllDay: true,
      financials: {
        income: tx.type === 'income' ? tx.amount : 0,
        expense: tx.type === 'expense' ? tx.amount : 0,
        currency: 'RUB',
      },
      status: 'completed',
      priority: 'medium',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    updateTasks([newTask, ...tasks]);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  // Filtered tasks based on active filters and search
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Category filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = (task.description || '').toLowerCase().includes(q);
        const matchFin = (task.financials?.note || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchFin) return false;
      }
      return true;
    });
  }, [tasks, selectedCategory, statusFilter, searchQuery]);

  // Tasks in the currently viewed period (for the FinancialHeader stats)
  const periodTasks = useMemo(() => {
    return tasks.filter((task) => {
      try {
        const taskDate = parseISO(task.date);
        if (viewMode === 'day') {
          return isSameDay(taskDate, currentDate);
        } else if (viewMode === 'week') {
          return isSameWeek(taskDate, currentDate, { weekStartsOn: 1 });
        } else if (viewMode === 'month') {
          return isSameMonth(taskDate, currentDate);
        } else {
          return isSameYear(taskDate, currentDate);
        }
      } catch {
        return false;
      }
    });
  }, [tasks, currentDate, viewMode]);

  const periodSummary = useMemo(() => {
    return calculateFinancialSummary(periodTasks, baseBalance);
  }, [periodTasks, baseBalance]);

  const periodLabel = useMemo(() => {
    if (viewMode === 'day') return formatDateRu(currentDate, 'd MMM');
    if (viewMode === 'week') return 'Текущая неделя';
    if (viewMode === 'month') return formatDateRu(currentDate, 'LLLL');
    return `${format(currentDate, 'yyyy')} год`;
  }, [viewMode, currentDate]);

  // Task creation/editing handlers
  const handleOpenNewTask = (dateStr?: string, hourStr?: string) => {
    if (userRole === 'guest') return;
    setEditingTask(null);
    setModalDefaultDate(dateStr || format(currentDate, 'yyyy-MM-dd'));
    setModalDefaultHour(hourStr || '10:00');
    setIsTaskModalOpen(true);
  };

  const handleSelectTask = (task: TaskItem) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleToggleStatus = (task: TaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole === 'guest') return;

    const nextStatus: TaskStatus = task.status === 'completed' ? 'planned' : 'completed';
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, status: nextStatus, updatedAt: new Date().toISOString() } : t
    );
    updateTasks(updated);
  };

  const handleSaveTask = (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (userRole === 'guest') return;

    const nowIso = new Date().toISOString();
    if (taskData.id) {
      // Edit existing task
      const updated = tasks.map((t) =>
        t.id === taskData.id
          ? {
              ...t,
              ...taskData,
              updatedAt: nowIso,
            }
          : t
      );
      updateTasks(updated);
    } else {
      // Create new task
      const newTask: TaskItem = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: nowIso,
        updatedAt: nowIso,
        ...taskData,
      };
      updateTasks([newTask, ...tasks]);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (userRole === 'guest') return;
    const updated = tasks.filter((t) => t.id !== taskId);
    updateTasks(updated);
  };

  const handleDeleteTasks = (taskIds: string[]) => {
    if (userRole === 'guest' || taskIds.length === 0) return;
    const idSet = new Set(taskIds);
    const updated = tasks.filter((t) => !idSet.has(t.id));
    updateTasks(updated);
  };

  const handleSelectDay = (day: Date) => {
    setCurrentDate(day);
    setViewMode('day');
  };

  const handleSelectMonth = (monthDate: Date) => {
    setCurrentDate(monthDate);
    setViewMode('month');
  };

  const handleOpenMoneyModal = (mode: 'base' | 'income' | 'expense') => {
    if (userRole === 'guest') return;
    setMoneyModalMode(mode);
    setIsMoneyModalOpen(true);
  };

  if (!isSessionLoaded || !isTasksLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium tracking-wide">Загрузка платформы ADT...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-radial-grid pb-16 text-slate-900">
      {/* Top Navbar */}
      <Navbar
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        userRole={userRole}
        onOpenNewTask={() => handleOpenNewTask()}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        {/* Guest Mode Advisory Banner */}
        {userRole === 'guest' && (
          <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-900 shadow-sm">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Гостевой режим (Только просмотр занятости):</strong> Отображается график и расписание дел. Финансовые данные скрыты.
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-900 font-semibold transition-colors shrink-0 shadow-xs"
            >
              Войти как Личный
            </button>
          </div>
        )}

        {/* Financial Overview Header */}
        <FinancialHeader
          summary={periodSummary}
          periodLabel={periodLabel}
          userRole={userRole}
          onOpenMoneyModal={handleOpenMoneyModal}
        />

        {/* Filter and Search Bar */}
        <FilterBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Active View Component */}
        <div className="mt-2">
          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              tasks={filteredTasks}
              userRole={userRole}
              onSelectTask={handleSelectTask}
              onToggleStatus={handleToggleStatus}
              onAddNewTaskAtHour={(hour) => handleOpenNewTask(undefined, hour)}
            />
          )}

          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              tasks={filteredTasks}
              userRole={userRole}
              onSelectTask={handleSelectTask}
              onSelectDay={handleSelectDay}
              onToggleStatus={handleToggleStatus}
              onAddNewTaskOnDate={(dateStr) => handleOpenNewTask(dateStr)}
            />
          )}

          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              tasks={filteredTasks}
              userRole={userRole}
              onSelectTask={handleSelectTask}
              onSelectDay={handleSelectDay}
              onAddNewTaskOnDate={(dateStr) => handleOpenNewTask(dateStr)}
            />
          )}

          {viewMode === 'year' && (
            <YearView
              currentDate={currentDate}
              tasks={filteredTasks}
              userRole={userRole}
              onSelectDay={handleSelectDay}
              onSelectMonth={handleSelectMonth}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={editingTask}
        defaultDate={modalDefaultDate}
        defaultHour={modalDefaultHour}
        userRole={userRole}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <MoneyModal
        isOpen={isMoneyModalOpen}
        onClose={() => setIsMoneyModalOpen(false)}
        initialMode={moneyModalMode}
        currentBaseBalance={baseBalance}
        onSaveBaseBalance={handleSaveBaseBalance}
        onAddQuickTransaction={handleAddQuickTransaction}
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        summary={periodSummary}
        tasks={tasks}
        userRole={userRole}
        onDeleteTask={handleDeleteTask}
        onDeleteTasks={handleDeleteTasks}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        tasks={tasks}
        userRole={userRole}
        onImportTasks={(imported) => updateTasks(imported)}
      />
    </div>
  );
}
