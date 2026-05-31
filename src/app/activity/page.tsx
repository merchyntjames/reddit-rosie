'use client';

import { ArrowUpRight, Check, X, MessageSquare, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  action: 'completed' | 'dismissed' | 'drafted' | 'discovered';
  description: string;
  subreddit: string;
  timestamp: string;
  postTitle: string;
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    action: 'completed',
    description: 'Response posted',
    subreddit: 'r/marketing',
    timestamp: '2 hours ago',
    postTitle: 'Has anyone tried using AI to respond to Google reviews?',
  },
  {
    id: '2',
    action: 'dismissed',
    description: 'Conversation dismissed',
    subreddit: 'r/LocalSEO',
    timestamp: '3 hours ago',
    postTitle: 'GBP suspended for no reason - anyone else dealing with this?',
  },
  {
    id: '3',
    action: 'drafted',
    description: 'Drafts generated',
    subreddit: 'r/SEO',
    timestamp: '4 hours ago',
    postTitle: 'Merchynt vs BrightLocal vs Whitespark for local SEO?',
  },
  {
    id: '4',
    action: 'discovered',
    description: 'New conversation found',
    subreddit: 'r/LocalSEO',
    timestamp: '4 hours ago',
    postTitle: 'Best tools for managing Google Business Profiles at scale?',
  },
  {
    id: '5',
    action: 'discovered',
    description: 'New conversation found',
    subreddit: 'r/digital_marketing',
    timestamp: '5 hours ago',
    postTitle: 'AI is changing local search - how are you adapting?',
  },
  {
    id: '6',
    action: 'drafted',
    description: 'Drafts generated',
    subreddit: 'r/digital_marketing',
    timestamp: '5 hours ago',
    postTitle: 'AI is changing local search - how are you adapting?',
  },
  {
    id: '7',
    action: 'discovered',
    description: 'New conversation found',
    subreddit: 'r/smallbusiness',
    timestamp: '6 hours ago',
    postTitle: 'How do I get more Google reviews without being annoying?',
  },
  {
    id: '8',
    action: 'completed',
    description: 'Response posted',
    subreddit: 'r/agency',
    timestamp: '1 day ago',
    postTitle: 'Best white-label SEO tools for small agencies?',
  },
  {
    id: '9',
    action: 'dismissed',
    description: 'Conversation dismissed',
    subreddit: 'r/Entrepreneur',
    timestamp: '1 day ago',
    postTitle: 'How to rank higher on Google Maps (general discussion)',
  },
  {
    id: '10',
    action: 'completed',
    description: 'Response posted',
    subreddit: 'r/SEO',
    timestamp: '2 days ago',
    postTitle: 'Anyone using AI for local SEO work? Results?',
  },
];

function ActionIcon({ action }: { action: ActivityItem['action'] }) {
  switch (action) {
    case 'completed':
      return (
        <div className="w-7 h-7 rounded-full bg-green/10 flex items-center justify-center">
          <Check size={14} className="text-green" />
        </div>
      );
    case 'dismissed':
      return (
        <div className="w-7 h-7 rounded-full bg-muted/10 flex items-center justify-center">
          <X size={14} className="text-muted" />
        </div>
      );
    case 'drafted':
      return (
        <div className="w-7 h-7 rounded-full bg-blue/10 flex items-center justify-center">
          <MessageSquare size={14} className="text-blue" />
        </div>
      );
    case 'discovered':
      return (
        <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center">
          <ArrowUpRight size={14} className="text-navy" />
        </div>
      );
  }
}

export default function ActivityPage() {
  return (
    <div className="p-8 max-w-[900px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Activity Log</h1>
        <p className="text-[13px] text-muted mt-1">
          A timeline of everything Rosie has found and everything you have acted on.
        </p>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl border border-border">
        {mockActivity.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-start gap-4 p-4 ${
              index !== mockActivity.length - 1 ? 'border-b border-border' : ''
            } hover:bg-surface/50 transition-colors`}
          >
            <ActionIcon action={item.action} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-dark">
                <span className="font-medium">{item.description}</span>
                {' '}
                <span className="text-muted">in</span>
                {' '}
                <span className="font-medium text-pink">{item.subreddit}</span>
              </p>
              <p className="text-[12px] text-muted mt-0.5 truncate">
                {item.postTitle}
              </p>
            </div>
            <span className="text-[11px] text-muted flex items-center gap-1 shrink-0 mt-0.5">
              <Clock size={11} />
              {item.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
