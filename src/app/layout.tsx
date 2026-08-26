import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ADT — График занятости & Финансовый учет',
  description: 'Персональная платформа для ведения личного графика занятости на день, неделю, месяц, год с учетом доходов и расходов.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
