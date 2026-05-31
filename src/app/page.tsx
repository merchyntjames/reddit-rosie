'use client';

import { useState } from 'react';
import { StatsBar } from '@/components/StatsBar';
import { FilterBar } from '@/components/FilterBar';
import { ConversationCard } from '@/components/ConversationCard';
import { mockConversations } from '@/lib/mock-data';
import { Conversation, ConversationStatus } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

export default function QueuePage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeFilter, setActiveFilter] = useState<ConversationStatus | 'all'>('all');

  const handleStatusChange = (id: string, newStatus: ConversationStatus) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
    );
  };

  const filteredConversations = activeFilter === 'all'
    ? conversations
    : conversations.filter(c => c.status === activeFilter);

  const counts = {
    all: conversations.length,
    new: conversations.filter(c => c.status === 'new').length,
    in_progress: conversations.filter(c => c.status === 'in_progress').length,
    completed: conversations.filter(c => c.status === 'completed').length,
    dismissed: conversations.filter(c => c.status === 'dismissed').length,
  };

  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Queue</h1>
          <p className="text-[13px] text-muted mt-1">
            Reddit conversations matching your keywords and subreddits.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-white text-[13px] font-medium text-dark hover:bg-surface transition-colors">
          <RefreshCw size={14} />
          Scan now
        </button>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Filters */}
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* Conversation List */}
      <div className="space-y-3">
        {filteredConversations.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <p className="text-[15px] text-muted">No conversations match this filter.</p>
          </div>
        ) : (
          filteredConversations.map(conversation => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
