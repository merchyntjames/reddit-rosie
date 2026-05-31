'use client';

import { mockConversations } from '@/lib/mock-data';

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

export function StatsBar() {
  const newCount = mockConversations.filter(c => c.status === 'new').length;
  const total = mockConversations.length;
  const completed = mockConversations.filter(c => c.status === 'completed').length;
  const avgRelevance = Math.round(
    mockConversations.filter(c => c.status !== 'dismissed').reduce((sum, c) => sum + c.relevanceScore, 0) /
    mockConversations.filter(c => c.status !== 'dismissed').length
  );

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard label="New Today" value={newCount} />
      <StatCard label="Total Tracked" value={total} sublabel="Last 7 days" />
      <StatCard label="Responded" value={completed} sublabel={`${Math.round((completed / total) * 100)}% response rate`} />
      <StatCard label="Avg Relevance" value={avgRelevance} sublabel="Higher = better match" />
    </div>
  );
}
