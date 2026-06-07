'use client';

import { ConversationStatus } from '@/lib/types';
import { RefreshCw, Trash2, Loader2 } from 'lucide-react';

interface FilterBarProps {
  activeFilter: ConversationStatus | 'all';
  onFilterChange: (filter: ConversationStatus | 'all') => void;
  counts: Record<ConversationStatus | 'all', number>;
  onScanNow: () => void;
  onClearQueue: () => void;
  isScanning: boolean;
  hasNewItems: boolean;
}

const filters: { key: ConversationStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'Ready For Review' },
  { key: 'completed', label: 'Completed' },
  { key: 'dismissed', label: 'Dismissed' },
];

export function FilterBar({ activeFilter, onFilterChange, counts, onScanNow, onClearQueue, isScanning, hasNewItems }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-1 overflow-x-auto">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors ${
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

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {hasNewItems && (
          <button
            onClick={onClearQueue}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-[13px] font-medium text-muted hover:text-dark hover:bg-surface transition-colors"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Clear queue</span>
            <span className="sm:hidden">Clear</span>
          </button>
        )}
        <button
          onClick={onScanNow}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue text-white text-[13px] font-medium hover:bg-blue/90 transition-colors disabled:opacity-50"
        >
          {isScanning ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {isScanning ? (
            <span className="hidden sm:inline">Scanning Reddit...</span>
          ) : (
            'Scan now'
          )}
          {isScanning && <span className="sm:hidden">Scanning...</span>}
        </button>
      </div>
    </div>
  );
}
