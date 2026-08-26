import { ActivityCategoryConfig } from '@/types';

export const APP_NAME = 'ADT';
export const APP_SUBTITLE = 'Activity & Day Tracker';

export const DEFAULT_MAIN_PASSWORD = process.env.MAIN_PASSWORD || '11111111';
export const DEFAULT_GUEST_PASSWORD = process.env.GUEST_PASSWORD || '88888888';

export const AUTH_COOKIE_NAME = 'adt_session_token';

export const DEFAULT_CATEGORIES: ActivityCategoryConfig[] = [
  {
    id: 'study',
    label: 'Учеба',
    color: '#0284c7', // Sky / Cyan
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    textColor: '#0369a1',
    iconName: 'GraduationCap',
  },
  {
    id: 'work',
    label: 'Работа',
    color: '#059669', // Emerald
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    textColor: '#047857',
    iconName: 'Briefcase',
  },
  {
    id: 'other',
    label: 'Иное',
    color: '#7c3aed', // Purple
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    textColor: '#6d28d9',
    iconName: 'Sparkles',
  },
];

export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: 'Запланировано', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
  in_progress: { label: 'В процессе', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  completed: { label: 'Выполнено', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Отменено', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};
