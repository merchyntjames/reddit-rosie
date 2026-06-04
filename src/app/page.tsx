'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatsBar } from '@/components/StatsBar';
import { FilterBar } from '@/components/FilterBar';
import { ConversationCard } from '@/components/ConversationCard';
import { Conversation, ConversationStatus } from '@/lib/types';
import { Loader2, CircleDot, WifiOff } from 'lucide-react';

export default function QueuePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeFilter, setActiveFilter] = useState<ConversationStatus | 'all'>('new');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'json' | null>(null);
  const [scanStatus, setScanStatus] = useState<'success' | 'failed' | 'unknown'>('unknown');
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  // Fetch scan status from API (same source as sidebar)
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.rss_scan?.status) setScanStatus(data.rss_scan.status as 'success' | 'failed' | 'unknown');
        if (data.last_scan_time?.detail && data.last_scan_time.detail !== 'Never') {
          setLastScanTime(data.last_scan_time.detail);
        }
      })
      .catch(() => {});
  }, []);

  const fetchConversations = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Try Supabase API route first
      const res = await fetch('/api/reddit');

      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          setConversations(data.posts);
          setIsLive(true);
          setDataSource('supabase');
          setLastFetchedAt(data.meta?.fetchedAt || new Date().toISOString());
          return; // Success — done
        }
      }

      // Fallback: read from static JSON
      const jsonRes = await fetch('/data/conversations.json');
      if (!jsonRes.ok) throw new Error('No data source available');

      const data = await jsonRes.json();
      const posts: Conversation[] = data.posts.map((post: {
        id: string;
        title: string;
        selftext?: string;
        authorUsername: string;
        subredditName: string;
        score: number;
        commentsCount: number;
        createdAtDate: string;
        permalink: string;
        relevanceScore: number;
        matchedKeywords: string[];
      }) => ({
        id: post.id,
        subreddit: `r/${post.subredditName}`,
        postTitle: post.title,
        postSnippet: post.selftext
          ? post.selftext.slice(0, 500).replace(/\n+/g, ' ').trim() + (post.selftext.length > 300 ? '...' : '')
          : '',
        postAuthor: `u/${post.authorUsername}`,
        postUrl: post.permalink
          ? `https://reddit.com${post.permalink}`
          : `https://reddit.com/r/${post.subredditName}/comments/${post.id}`,
        commentCount: post.commentsCount ?? 0,
        upvotes: post.score ?? 0,
        relevanceScore: post.relevanceScore,
        matchedKeywords: post.matchedKeywords ?? [],
        discoveredAt: post.createdAtDate,
        status: 'new' as ConversationStatus,
        corporateDraft: '',
        personalDraft: '',
      }));

      setConversations(posts);
      setIsLive(true);
      setDataSource('json');
      setLastFetchedAt(data.fetchedAt || new Date().toISOString());
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError(String(err));
      setIsLive(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleStatusChange = async (id: string, newStatus: ConversationStatus) => {
    // Optimistic update
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
    );

    // Persist to Supabase
    if (dataSource === 'supabase') {
      try {
        await fetch('/api/reddit', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: newStatus }),
        });
      } catch (err) {
        console.error('Failed to update status in Supabase:', err);
      }
    }
  };

  const handleDraftsGenerated = (id: string, corporate: string, personal: string) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, corporateDraft: corporate, personalDraft: personal } : c)
    );
  };

  const handleScanNow = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) {
        console.error('Scan failed:', data.error);
      }
      // Refresh the queue to show new posts
      await fetchConversations();
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearQueue = async () => {
    // Optimistic update — remove new/in_progress from view
    setConversations(prev => prev.filter(c => c.status !== 'new' && c.status !== 'in_progress'));

    // Delete from Supabase
    try {
      await fetch('/api/reddit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_queue' }),
      });
    } catch (err) {
      console.error('Failed to clear queue in Supabase:', err);
    }
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-dark">Engagement Queue</h1>
            <div className="flex items-center gap-1.5">
              <CircleDot size={10} className={scanStatus === 'success' ? 'text-green' : scanStatus === 'failed' ? 'text-pink' : 'text-muted'} />
              <span className={`text-[11px] font-medium ${scanStatus === 'success' ? 'text-green' : scanStatus === 'failed' ? 'text-pink' : 'text-muted'}`}>
                {lastScanTime
                  ? `Last updated ${new Date(lastScanTime).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })} ET`
                  : 'Not yet scanned'}
              </span>
            </div>
          </div>
          <p className="text-[13px] text-muted mt-1">
            Reddit conversations matching your keywords and subreddits.
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsBar conversations={conversations} />

      {/* Filters */}
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
        onScanNow={handleScanNow}
        onClearQueue={handleClearQueue}
        isScanning={isRefreshing}
        hasNewItems={counts.new > 0}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Loader2 size={24} className="animate-spin text-navy mx-auto mb-3" />
          <p className="text-[15px] text-dark font-medium">Loading queue...</p>
          <p className="text-[13px] text-muted mt-1">Fetching conversations from the database.</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <WifiOff size={24} className="text-muted mx-auto mb-3" />
          <p className="text-[15px] text-dark font-medium">Could not load conversations</p>
          <p className="text-[13px] text-muted mt-1 max-w-md mx-auto">
            Check that Supabase is configured. The Queue will show conversations once the database connection is active.
          </p>
          <button
            onClick={() => fetchConversations()}
            className="mt-4 px-4 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Conversation List */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {filteredConversations.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <p className="text-[15px] text-muted">No conversations match this filter.</p>
            </div>
          ) : (
            <>
              {filteredConversations.map(conversation => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  onStatusChange={handleStatusChange}
                  onDraftsGenerated={handleDraftsGenerated}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
