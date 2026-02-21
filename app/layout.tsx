import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tika - Kanban Board',
  description: 'Ticket-based Kanban Board TODO App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
