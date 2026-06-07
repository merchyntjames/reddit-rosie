'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquareMore,
  Activity,
  Settings,
  Radio,
  CircleDot,
  ScrollText,
  Brain,
  AlertTriangle,
  X,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: typeof MessageSquareMore;
  children?: { href: string; label: string }[];
}

const navItems: NavItem[] = [
  { href: '/queue', label: 'Engagement Queue', icon: MessageSquareMore },
  {
    href: '/knowledgebase',
    label: 'Knowledgebase',
    icon: Brain,
    children: [
      { href: '/knowledgebase/company', label: 'Company Knowledge' },
      { href: '/knowledgebase/product', label: 'Product Knowledge' },
      { href: '/knowledgebase/brand', label: 'Brand Voice' },
      { href: '/knowledgebase/creators', label: 'Creator Profiles' },
    ],
  },
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-dark/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 w-[260px] bg-white border-r border-border flex flex-col z-40
          transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-10
        `}
      >
        {/* Logo / Branding — links to homepage */}
        <div className="flex items-center justify-between px-3 pt-4 pb-2">
          <Link href="/" className="flex-1" onClick={onClose}>
            <Image
              src="/rosie-logo.png"
              alt="Rosie The Redditor by Merchynt"
              width={520}
              height={300}
              className="w-full h-auto"
              priority
            />
          </Link>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface transition-colors lg:hidden ml-2"
            aria-label="Close menu"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === '/queue'
              ? pathname === '/' || pathname === '/queue'
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.href}>
                <Link
                  href={hasChildren ? item.children![0].href : item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                    isActive
                      ? 'bg-navy text-white'
                      : 'text-dark hover:bg-surface'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
                  {item.label}
                </Link>
                {/* Nested sub-nav */}
                {hasChildren && isActive && (
                  <div className="ml-7 mt-1 space-y-0.5">
                    {item.children!.map(child => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                            childActive
                              ? 'text-navy font-medium bg-navy/5'
                              : 'text-muted hover:text-dark hover:bg-surface'
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
    </>
  );
}
