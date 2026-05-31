'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  Radio,
  CircleDot,
  ScrollText,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Queue', icon: Inbox },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/activity', label: 'Activity Log', icon: Activity },
  { href: '/settings', label: 'Account Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-border flex flex-col z-10">
      {/* Logo / Branding — links to homepage */}
      <Link href="/" className="px-3 pt-4 pb-2 block">
        <Image
          src="/rosie-logo.png"
          alt="Rosie The Redditor by Merchynt"
          width={520}
          height={300}
          className="w-full h-auto"
          priority
        />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                isActive
                  ? 'bg-navy text-white'
                  : 'text-dark hover:bg-surface'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Integration Status */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">Integration Status</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDot size={12} className="text-muted" />
              <span className="text-[12px] text-dark">Reddit API</span>
            </div>
            <span className="text-[11px] font-medium text-muted">Not connected</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDot size={12} className="text-muted" />
              <span className="text-[12px] text-dark">Claude API</span>
            </div>
            <span className="text-[11px] font-medium text-muted">Not connected</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={12} className="text-muted" />
              <span className="text-[12px] text-dark">Last scan</span>
            </div>
            <span className="text-[11px] text-muted">Never</span>
          </div>
        </div>

        <Link
          href="/changelog"
          className="flex items-center gap-1.5 mt-3 text-[11px] text-muted hover:text-navy transition-colors"
        >
          <ScrollText size={11} />
          Changelog
        </Link>
      </div>

      {/* User */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
            <span className="text-white text-xs font-semibold">JS</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-dark truncate">James Sowers</p>
            <p className="text-[11px] text-muted truncate">james@merchynt.com</p>
          </div>
        </div>
        <button className="flex items-center gap-2 mt-3 text-[12px] text-muted hover:text-dark transition-colors">
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
