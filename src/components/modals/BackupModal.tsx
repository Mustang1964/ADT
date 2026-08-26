'use client';

import React, { useRef, useState } from 'react';
import { TaskItem, UserRole } from '@/types';
import { exportTasksAsCsv, exportTasksAsJson, getInitialSeedTasks } from '@/lib/storage';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  userRole: UserRole;
  onImportTasks: (newTasks: TaskItem[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  tasks,
  userRole,
  onImportTasks,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isGuest = userRole === 'guest';

  const handleJsonExport = () => {
    exportTasksAsJson(tasks);
    setSuccessMsg('Файл резервной копии JSON успешно сохранен');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleCsvExport = () => {
    exportTasksAsCsv(tasks);
    setSuccessMsg('Таблица CSV с расписанием успешно выгружена');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          onImportTasks(parsed);
          setSuccessMsg(`Успешно импортировано ${parsed.length} записей`);
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1500);
        } else {
          setErrorMsg('Неверный формат резервной копии');
        }
      } catch (err) {
        setErrorMsg('Ошибка чтения JSON файла');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDemo = () => {
    if (confirm('Очистить все записи расписания?')) {
      const empty = getInitialSeedTasks();
      onImportTasks(empty);
      setSuccessMsg('Все записи расписания очищены');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Экспорт и Резервное копирование</h2>
              <p className="text-xs text-slate-500 font-medium">Сохранение и восстановление данных ADT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Выгрузка данных ({tasks.length} записей)
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleJsonExport}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300 transition-all text-left shadow-xs group"
              >
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <FileJson className="w-4 h-4 text-slate-700" />
                  <span>Экспорт JSON</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  Полная копия со всеми связями
                </p>
              </button>

              <button
                type="button"
                onClick={handleCsvExport}
                className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 hover:border-emerald-300 transition-all text-left shadow-xs group"
              >
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Экспорт CSV</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  Для открытия в Excel / Таблицах
                </p>
              </button>
            </div>
          </div>

          {/* Import section (Disabled in guest mode) */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Восстановление и Импорт
              </label>
              {isGuest && (
                <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600" /> Только для личного
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              type="button"
              disabled={isGuest}
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs font-bold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <Upload className="w-4 h-4 text-slate-700" />
              <span>Загрузить резервную копию JSON</span>
            </button>
          </div>

          {/* Reset Demo Data */}
          {!isGuest && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetToDemo}
                className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Очистить все данные расписания</span>
              </button>
            </div>
          )}
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
