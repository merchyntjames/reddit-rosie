'use client';

import { ConversationStatus } from '@/lib/types';
import { Search } from 'lucide-react';

interface FilterBarProps {
  activeFilter: ConversationStatus | 'all';
  onFilterChange: (filter: ConversationStatus | 'all') => void;
  counts: Record<ConversationStatus | 'all', number>;
}

const filters: { key: ConversationStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'dismissed', label: 'Dismissed' },
];

export function FilterBar({ activeFilter, onFilterChange, counts }: FilterBarProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-1">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              activeFilter === filter.key
                ? 'bg-navy text-white'
                : 'text-muted hover:text-dark hover:bg-surface'
            }`}
          >
            {filter.label}
            <span className={`ml-1.5 text-[11px] ${
              activeFilter === filter.key ? 'text-white/70' : 'text-muted'
            }`}>
              {counts[filter.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search conversations..."
          className="pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 w-[240px]"
        />
      </div>
    </div>
  );
}
