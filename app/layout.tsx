import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Seth Assistant',
  description: 'MVP of Seth AI assistant',
  icons: {
    icon: '/logo-symbol.svg',
    shortcut: '/logo-symbol.svg',
    apple: '/logo-symbol.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head></head>
      <body className="min-h-screen font-sans-brand">{children}</body>
    </html>
  );
}


