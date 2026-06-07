'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border flex items-center px-4 gap-3 z-20 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-dark" />
        </button>
        <Image
          src="/rosie-logo.png"
          alt="Reddit Rosie"
          width={140}
          height={80}
          className="h-8 w-auto"
        />
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset for sidebar on desktop, offset for top bar on mobile */}
      <main className="flex-1 ml-0 lg:ml-[260px] mt-14 lg:mt-0 min-h-screen bg-surface">
        {children}
      </main>
    </div>
  );
}
