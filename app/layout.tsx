import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Seth Assistant',
  description: 'MVP of Seth AI assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head></head>
      <body className="min-h-screen font-sans-brand">{children}</body>
    </html>
  );
}


