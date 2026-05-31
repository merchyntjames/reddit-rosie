'use client';

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
  Circle,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Queue', icon: Inbox },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/activity', label: 'Activity Log', icon: Activity },
  { href: '/settings', label: 'Account Settings', icon: Settings },
];

const connectedAccounts = [
  { username: 'u/merchynt', label: 'Merchynt', status: 'active' as const },
  { username: 'u/jamessowers', label: 'James Sowers', status: 'active' as const },
  { username: 'u/justinsilverman', label: 'Justin Silverman', status: 'inactive' as const },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-border flex flex-col z-10">
      {/* Logo / Branding */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-dark leading-tight">Reddit Rosie</h1>
            <p className="text-xs text-muted">by Merchynt</p>
          </div>
        </div>
      </div>

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

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDot size={12} className="text-green" />
              <span className="text-[12px] text-dark">Reddit API</span>
            </div>
            <span className="text-[11px] font-medium text-green">Connected</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDot size={12} className="text-green" />
              <span className="text-[12px] text-dark">Claude API</span>
            </div>
            <span className="text-[11px] font-medium text-green">Connected</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={12} className="text-muted" />
              <span className="text-[12px] text-dark">Last scan</span>
            </div>
            <span className="text-[11px] text-muted">12 min ago</span>
          </div>
        </div>

        {/* Reddit Accounts */}
        <div className="pt-3 border-t border-border">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Reddit Accounts</p>
          <div className="space-y-1.5">
            {connectedAccounts.map((account) => (
              <div key={account.username} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Circle
                    size={8}
                    className={account.status === 'active' ? 'text-green fill-green' : 'text-muted fill-muted'}
                  />
                  <span className="text-[12px] text-dark">{account.username}</span>
                </div>
                <span className={`text-[10px] font-medium ${
                  account.status === 'active' ? 'text-green' : 'text-muted'
                }`}>
                  {account.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
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
