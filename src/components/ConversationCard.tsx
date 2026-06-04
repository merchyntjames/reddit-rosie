'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ArrowUp,
  Tag,
  Clock,
  Info,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Conversation } from '@/lib/types';
import { DraftPanel } from './DraftPanel';

interface ConversationCardProps {
  conversation: Conversation;
  onStatusChange: (id: string, status: Conversation['status']) => void;
  onDraftsGenerated?: (id: string, corporate: string, personal: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function RelevanceBadge({ score }: { score: number }) {
  let colorClass = 'bg-green/10 text-green';
  if (score < 60) colorClass = 'bg-orange/10 text-orange';
  else if (score < 80) colorClass = 'bg-blue/10 text-blue';

  return (
    <div className="flex items-center gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${colorClass}`}>
        {score}/100 Quality Score
      </span>
      <Link
        href="/settings?tab=quality"
        onClick={(e) => e.stopPropagation()}
        className="group relative"
        title="How are Quality Scores calculated?"
      >
        <Info size={13} className="text-muted hover:text-navy transition-colors" />
        <span className="absolute right-0 top-full mt-1 w-48 px-2.5 py-1.5 rounded-md bg-dark text-white text-[10px] leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
          Scored by keyword matches, topic relevance, and engagement signals. Click to see details.
        </span>
      </Link>
    </div>
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
    new: 'Ready',
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

export function ConversationCard({ conversation, onStatusChange, onDraftsGenerated }: ConversationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerateDrafts = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate drafts');
      }
      onDraftsGenerated?.(conversation.id, data.corporate, data.personal);
    } catch (err) {
      setGenerateError(String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border transition-shadow hover:shadow-sm">
      {/* Card Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Subreddit + Meta */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] font-semibold text-pink">{conversation.subreddit}</span>
              <span className="text-border">|</span>
              <span className="text-[12px] text-muted flex items-center gap-1">
                <Clock size={11} />
                Posted {timeAgo(conversation.discoveredAt)} ago by {conversation.postAuthor}
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

            {/* Title — selectable */}
            <h3 className="text-[15px] font-semibold text-dark leading-snug mb-1.5 select-text cursor-text">
              {conversation.postTitle}
            </h3>

            {/* Snippet — selectable, expanded to ~500 chars */}
            <p className="text-[13px] text-muted leading-relaxed line-clamp-4 select-text cursor-text">
              {conversation.postSnippet}
            </p>

            {/* Keywords + View on Reddit */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5 flex-wrap">
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
              <a
                href={conversation.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[12px] text-blue hover:text-navy transition-colors shrink-0 ml-4"
              >
                View on Reddit
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>

          {/* Right side: badges + expand */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <RelevanceBadge score={conversation.relevanceScore} />
            <StatusBadge status={conversation.status} />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 w-7 h-7 rounded-full bg-surface flex items-center justify-center text-muted hover:bg-border hover:text-dark transition-colors"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Draft Panel */}
          {conversation.status !== 'dismissed' && (
            conversation.corporateDraft || conversation.personalDraft ? (
              <DraftPanel
                corporateDraft={conversation.corporateDraft}
                personalDraft={conversation.personalDraft}
              />
            ) : (
              <div className="p-5 text-center">
                <button
                  onClick={handleGenerateDrafts}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating drafts...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate AI Drafts
                    </>
                  )}
                </button>
                {generateError && (
                  <p className="text-[12px] text-pink mt-2">{generateError}</p>
                )}
                {!isGenerating && !generateError && (
                  <p className="text-[11px] text-muted mt-2">
                    Creates corporate and personal voice drafts using your brand context.
                  </p>
                )}
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
