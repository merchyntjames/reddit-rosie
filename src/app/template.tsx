'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page renders without sidebar
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // All other pages get the sidebar
  return <AppShell>{children}</AppShell>;
}
