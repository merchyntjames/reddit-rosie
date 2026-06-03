'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ArrowUp,
  Tag,
  Clock,
} from 'lucide-react';
import { Conversation } from '@/lib/types';
import { DraftPanel } from './DraftPanel';

interface ConversationCardProps {
  conversation: Conversation;
  onStatusChange: (id: string, status: Conversation['status']) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function RelevanceBadge({ score }: { score: number }) {
  let colorClass = 'bg-green/10 text-green';
  if (score < 60) colorClass = 'bg-orange/10 text-orange';
  else if (score < 80) colorClass = 'bg-blue/10 text-blue';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${colorClass}`}>
      {score}/100
    </span>
  );
}

function StatusBadge({ status }: { status: Conversation['status'] }) {
  const styles = {
    new: 'bg-navy/10 text-navy',
    in_progress: 'bg-blue/10 text-blue',
    completed: 'bg-green/10 text-green',
    dismissed: 'bg-muted/20 text-muted',
  };
  const labels = {
    new: 'New',
    in_progress: 'In Progress',
    completed: 'Completed',
    dismissed: 'Dismissed',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function ConversationCard({ conversation, onStatusChange }: ConversationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-border transition-shadow hover:shadow-sm">
      {/* Card Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Subreddit + Meta */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] font-semibold text-pink">{conversation.subreddit}</span>
              <span className="text-border">|</span>
              <span className="text-[12px] text-muted flex items-center gap-1">
                <Clock size={11} />
                Posted {timeAgo(conversation.discoveredAt)}
              </span>
              {conversation.upvotes > 0 && (
                <>
                  <span className="text-border">|</span>
                  <span className="text-[12px] text-muted flex items-center gap-1">
                    <ArrowUp size={11} />
                    {conversation.upvotes}
                  </span>
                </>
              )}
              {conversation.commentCount > 0 && (
                <>
                  <span className="text-border">|</span>
                  <span className="text-[12px] text-muted flex items-center gap-1">
                    <MessageSquare size={11} />
                    {conversation.commentCount}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h3 className="text-[15px] font-semibold text-dark leading-snug mb-1.5">
              {conversation.postTitle}
            </h3>

            {/* Snippet */}
            <p className="text-[13px] text-muted leading-relaxed line-clamp-2">
              {conversation.postSnippet}
            </p>

            {/* Keywords */}
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <Tag size={11} className="text-muted" />
              {conversation.matchedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface text-muted border border-border"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Right side: badges + expand */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <RelevanceBadge score={conversation.relevanceScore} />
            <StatusBadge status={conversation.status} />
            <div className="mt-1 text-muted">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Post Meta + Link */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <p className="text-[12px] font-medium text-muted">
              Posted by <span className="text-dark">{conversation.postAuthor}</span>
            </p>
            <a
              href={conversation.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[12px] text-blue hover:text-navy transition-colors"
            >
              View on Reddit
              <ArrowUpRight size={12} />
            </a>
          </div>

          {/* Draft Panel */}
          {conversation.status !== 'dismissed' && (
            conversation.corporateDraft || conversation.personalDraft ? (
              <DraftPanel
                corporateDraft={conversation.corporateDraft}
                personalDraft={conversation.personalDraft}
              />
            ) : (
              <div className="p-5 text-center">
                <p className="text-[13px] text-muted">AI drafts will appear here once Claude API is connected.</p>
                <p className="text-[11px] text-muted mt-1">For now, view the conversation on Reddit and compose your reply manually.</p>
              </div>
            )
          )}

          {/* Actions */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {conversation.status !== 'dismissed' && (
                <button
                  onClick={() => onStatusChange(conversation.id, 'dismissed')}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium text-muted border border-border hover:bg-surface transition-colors"
                >
                  Dismiss
                </button>
              )}
              {conversation.status === 'dismissed' && (
                <button
                  onClick={() => onStatusChange(conversation.id, 'new')}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium text-muted border border-border hover:bg-surface transition-colors"
                >
                  Restore
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {conversation.status !== 'completed' && conversation.status !== 'dismissed' && (
                <button
                  onClick={() => onStatusChange(conversation.id, 'completed')}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-navy hover:bg-navy/90 transition-colors"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
