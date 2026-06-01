'use client';

import { Conversation } from '@/lib/types';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
}

function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-bold text-dark">{value}</p>
      {sublabel && <p className="text-[12px] text-muted mt-1">{sublabel}</p>}
    </div>
  );
}

interface StatsBarProps {
  conversations: Conversation[];
}

export function StatsBar({ conversations }: StatsBarProps) {
  const newCount = conversations.filter(c => c.status === 'new').length;
  const total = conversations.length;
  const completed = conversations.filter(c => c.status === 'completed').length;
  const nonDismissed = conversations.filter(c => c.status !== 'dismissed');
  const avgRelevance = nonDismissed.length > 0
    ? Math.round(nonDismissed.reduce((sum, c) => sum + c.relevanceScore, 0) / nonDismissed.length)
    : 0;
  const responseRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard label="New" value={newCount} />
      <StatCard label="Total Tracked" value={total} sublabel="Last 7 days" />
      <StatCard label="Responded" value={completed} sublabel={`${responseRate}% response rate`} />
      <StatCard label="Avg Relevance" value={avgRelevance} sublabel="Higher = better match" />
    </div>
  );
}
