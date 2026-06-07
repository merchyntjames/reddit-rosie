'use client';

import { useState, useEffect } from 'react';
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
  const [totalTracked30d, setTotalTracked30d] = useState<number | null>(null);
  const [totalResponded, setTotalResponded] = useState<number | null>(null);

  // Fetch historical stats from Supabase
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.totalTracked30d !== undefined) setTotalTracked30d(data.totalTracked30d);
        if (data.totalResponded !== undefined) setTotalResponded(data.totalResponded);
      })
      .catch(() => {});
  }, []);

  const readyForReview = conversations.filter(c => c.status === 'new').length;
  const nonDismissed = conversations.filter(c => c.status !== 'dismissed');
  const avgQuality = nonDismissed.length > 0
    ? Math.round(nonDismissed.reduce((sum, c) => sum + c.relevanceScore, 0) / nonDismissed.length)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
      <StatCard label="Ready For Review" value={readyForReview} />
      <StatCard
        label="Total Tracked"
        value={totalTracked30d ?? conversations.length}
        sublabel="Last 30 days"
      />
      <StatCard
        label="Total Responded"
        value={totalResponded ?? conversations.filter(c => c.status === 'completed').length}
        sublabel={(() => {
          const tracked = totalTracked30d ?? conversations.length;
          const responded = totalResponded ?? conversations.filter(c => c.status === 'completed').length;
          const rate = tracked > 0 ? Math.round((responded / tracked) * 100) : 0;
          return `${rate}% response rate`;
        })()}
      />
      <StatCard
        label="Avg Quality Score"
        value={`${avgQuality} / 100`}
        sublabel="Higher score = better"
      />
    </div>
  );
}
