'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, Check, X, MessageSquare, Clock, Loader2, Trash2, RotateCcw, WifiOff } from 'lucide-react';

interface ActivityItem {
  id: number;
  action: string;
  conversation_id: string | null;
  subreddit: string | null;
  post_title: string | null;
  details: string | null;
  created_at: string;
}

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case 'completed':
      return (
        <div className="w-7 h-7 rounded-full bg-green/10 flex items-center justify-center shrink-0">
          <Check size={14} className="text-green" />
        </div>
      );
    case 'dismissed':
      return (
        <div className="w-7 h-7 rounded-full bg-muted/10 flex items-center justify-center shrink-0">
          <X size={14} className="text-muted" />
        </div>
      );
    case 'cleared':
      return (
        <div className="w-7 h-7 rounded-full bg-muted/10 flex items-center justify-center shrink-0">
          <Trash2 size={14} className="text-muted" />
        </div>
      );
    case 'restored':
      return (
        <div className="w-7 h-7 rounded-full bg-blue/10 flex items-center justify-center shrink-0">
          <RotateCcw size={14} className="text-blue" />
        </div>
      );
    case 'drafted':
      return (
        <div className="w-7 h-7 rounded-full bg-blue/10 flex items-center justify-center shrink-0">
          <MessageSquare size={14} className="text-blue" />
        </div>
      );
    case 'discovered':
    default:
      return (
        <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
          <ArrowUpRight size={14} className="text-navy" />
        </div>
      );
  }
}

function formatActionLabel(action: string): string {
  switch (action) {
    case 'completed': return 'Response posted';
    case 'dismissed': return 'Conversation dismissed';
    case 'cleared': return 'Cleared from queue';
    case 'restored': return 'Restored to queue';
    case 'drafted': return 'Drafts generated';
    case 'discovered': return 'New conversation found';
    default: return action;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch('/api/activity?limit=100');
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setActivities(data.activities ?? []);
      } catch (err) {
        console.error('Failed to fetch activity:', err);
        setError(String(err));
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivity();
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-[900px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Activity Log</h1>
        <p className="text-[13px] text-muted mt-1">
          A timeline of everything Rosie has found and everything you have acted on.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Loader2 size={24} className="animate-spin text-navy mx-auto mb-3" />
          <p className="text-[13px] text-muted">Loading activity...</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <WifiOff size={24} className="text-muted mx-auto mb-3" />
          <p className="text-[15px] text-dark font-medium">Could not load activity log</p>
          <p className="text-[13px] text-muted mt-1">Database connection may not be configured yet.</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && activities.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <p className="text-[15px] text-muted">No activity recorded yet.</p>
          <p className="text-[13px] text-muted mt-1">Actions will appear here as Rosie discovers conversations and you respond to them.</p>
        </div>
      )}

      {/* Activity List */}
      {!isLoading && !error && activities.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {activities.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 sm:gap-4 p-4 ${
                index !== activities.length - 1 ? 'border-b border-border' : ''
              } hover:bg-surface/50 transition-colors`}
            >
              <ActionIcon action={item.action} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-dark">
                  <span className="font-medium">{formatActionLabel(item.action)}</span>
                  {item.subreddit && (
                    <>
                      {' '}
                      <span className="text-muted">in</span>
                      {' '}
                      <span className="font-medium text-pink">r/{item.subreddit}</span>
                    </>
                  )}
                </p>
                {item.post_title && (
                  <p className="text-[12px] text-muted mt-0.5 truncate">
                    {item.post_title}
                  </p>
                )}
                {item.details && !item.post_title && (
                  <p className="text-[12px] text-muted mt-0.5">
                    {item.details}
                  </p>
                )}
                <span className="text-[11px] text-muted flex items-center gap-1 mt-1">
                  <Clock size={11} />
                  {timeAgo(item.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
