'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  Users,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Пожалуйста, введите пароль доступа');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, isGuest }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Неверный пароль доступа');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] bg-radial-grid">
      {/* Background subtle elements */}
      <div className="absolute inset-0 subtle-grid opacity-60 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-xl border border-slate-200">
          {/* Brand Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white p-0.5 shadow-md shadow-slate-900/10 mb-3.5">
              <span className="text-xl font-black tracking-wider">
                ADT
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              График Занятости ADT
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Персональное расписание и учет доходов/расходов
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mode selection toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-700" />
                Тип доступа
              </label>

              {/* Toggle switch boxes */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsGuest(false);
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    !isGuest
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Личный</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsGuest(true);
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    isGuest
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Users className="w-4 h-4 text-slate-600" />
                  <span>Гость</span>
                </button>
              </div>

              {/* Checkbox option */}
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer pt-0.5 pl-1">
                <input
                  type="checkbox"
                  checked={isGuest}
                  onChange={(e) => {
                    setIsGuest(e.target.checked);
                    setError(null);
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                />
                <span>Вход в режиме <strong>Гость</strong> (иначе <strong>Личный</strong>)</span>
              </label>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-700" />
                Пароль доступа
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all pr-11 shadow-xs tracking-wider"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isGuest ? 'Войти в режиме Гостя' : 'Войти как Личный'}</span>
                </>
              )}
            </button>
          </form>

          {/* Security Footer Notice */}
          <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Защита сессий HTTP-Only JWT • Защита от подбора паролей</span>
          </div>
        </div>
      </div>
    </div>
  );
}
