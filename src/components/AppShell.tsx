'use client';

import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen bg-surface">
        {children}
      </main>
    </div>
  );
}
