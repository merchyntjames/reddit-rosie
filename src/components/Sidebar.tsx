'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquareMore,
  Activity,
  Settings,
  LogOut,
  Radio,
  CircleDot,
  ScrollText,
  Brain,
  AlertTriangle,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Engagement Queue', icon: MessageSquareMore },
  { href: '/knowledgebase', label: 'Knowledgebase', icon: Brain },
  { href: '/activity', label: 'Activity Log', icon: Activity },
  { href: '/settings', label: 'Account Settings', icon: Settings },
];

interface IntegrationStatuses {
  claude: { status: string; detail?: string };
  rss_scan: { status: string; detail?: string };
  last_scan_time: { status: string; detail?: string };
}

function formatETTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' ET';
  } catch {
    return 'Unknown';
  }
}

function StatusDot({ status }: { status: string }) {
  if (status === 'connected' || status === 'success') {
    return <CircleDot size={12} className="text-green" />;
  }
  if (status === 'needs_attention') {
    return <AlertTriangle size={12} className="text-orange" />;
  }
  return <CircleDot size={12} className="text-muted" />;
}

function StatusLabel({ status, detail }: { status: string; detail?: string }) {
  if (status === 'connected') return <span className="text-[11px] font-medium text-green">Connected</span>;
  if (status === 'success') return <span className="text-[11px] font-medium text-green">Success</span>;
  if (status === 'needs_attention') return <span className="text-[11px] font-medium text-orange">{detail || 'Needs attention'}</span>;
  if (status === 'failed') return <span className="text-[11px] font-medium text-pink">Failed</span>;
  if (status === 'not_connected') return <span className="text-[11px] font-medium text-muted">Not connected</span>;
  return <span className="text-[11px] font-medium text-muted">Unknown</span>;
}

export function Sidebar() {
  const pathname = usePathname();
  const [statuses, setStatuses] = useState<IntegrationStatuses | null>(null);

  useEffect(() => {
    async function fetchStatuses() {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setStatuses(data);
        }
      } catch {
        // Silently fail
      }
    }
    fetchStatuses();
  }, []);

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
          {/* Claude API */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot status={statuses?.claude?.status ?? 'unknown'} />
              <span className="text-[12px] text-dark">Claude API</span>
            </div>
            <StatusLabel status={statuses?.claude?.status ?? 'unknown'} detail={statuses?.claude?.detail} />
          </div>

          {/* Last RSS Scan */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={12} className="text-muted" />
              <span className="text-[12px] text-dark">Last RSS Scan</span>
            </div>
            <span className="text-[11px] text-muted">
              {statuses?.last_scan_time?.detail && statuses.last_scan_time.detail !== 'Never'
                ? formatETTime(statuses.last_scan_time.detail)
                : 'Never'}
            </span>
          </div>

          {/* RSS Scan Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot status={statuses?.rss_scan?.status ?? 'unknown'} />
              <span className="text-[12px] text-dark">RSS Scan Status</span>
            </div>
            <StatusLabel status={statuses?.rss_scan?.status ?? 'unknown'} />
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
      </div>
    </aside>
  );
}
