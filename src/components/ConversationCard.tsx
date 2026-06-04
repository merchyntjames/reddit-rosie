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
import { DraftPanel, type DraftItem } from './DraftPanel';

interface ConversationCardProps {
  conversation: Conversation;
  onStatusChange: (id: string, status: Conversation['status']) => void;
  onDraftsGenerated?: (id: string, drafts: DraftItem[]) => void;
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

const DISMISS_REASONS = [
  { value: 'wrong_topic', label: 'Wrong topic — not relevant to our expertise' },
  { value: 'too_promotional', label: 'Too promotional — someone else selling' },
  { value: 'too_basic', label: 'Too basic — not worth our time to engage' },
  { value: 'wrong_audience', label: 'Wrong audience — not our ICP' },
  { value: 'already_answered', label: 'Already well-answered by others' },
  { value: 'low_engagement', label: 'Low engagement — not worth the effort' },
  { value: 'other', label: 'Other' },
];

export function ConversationCard({ conversation, onStatusChange, onDraftsGenerated }: ConversationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissCustom, setDismissCustom] = useState('');
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismissWithFeedback = async () => {
    if (!dismissReason) return;
    setIsDismissing(true);
    try {
      await fetch('/api/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          reason: dismissReason,
          customFeedback: dismissCustom || undefined,
        }),
      });
      onStatusChange(conversation.id, 'dismissed');
      setShowDismissModal(false);
      setDismissReason('');
      setDismissCustom('');
    } catch (err) {
      console.error('Dismiss failed:', err);
    } finally {
      setIsDismissing(false);
    }
  };

  const handleDismissWithoutFeedback = () => {
    onStatusChange(conversation.id, 'dismissed');
    setShowDismissModal(false);
  };

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
      setDrafts(data.drafts);
      onDraftsGenerated?.(conversation.id, data.drafts);
    } catch (err) {
      setGenerateError(String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Load cached drafts on expand if we have old-style drafts
  const hasDrafts = drafts.length > 0 || conversation.corporateDraft || conversation.personalDraft;

  // Convert legacy single drafts to multi-draft format
  const displayDrafts: DraftItem[] = drafts.length > 0
    ? drafts
    : [
        ...(conversation.corporateDraft ? [{ draftType: 'corporate' as const, creatorId: null, creatorName: 'Merchynt Response', content: conversation.corporateDraft }] : []),
        ...(conversation.personalDraft ? [{ draftType: 'personal' as const, creatorId: '1', creatorName: 'James Sowers', content: conversation.personalDraft }] : []),
      ];

  const handleDraftUpdated = (draftType: string, creatorId: string | null, newContent: string) => {
    setDrafts(prev => prev.map(d =>
      d.draftType === draftType && d.creatorId === creatorId
        ? { ...d, content: newContent, version: (d.version ?? 1) + 1 }
        : d
    ));
  };

  return (
    <div className="bg-white rounded-xl border border-border transition-shadow hover:shadow-sm">
      {/* Card Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Subreddit + Meta + View on Reddit */}
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
              <span className="text-border">|</span>
              <a
                href={conversation.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[12px] text-blue hover:text-navy transition-colors"
              >
                View on Reddit
                <ArrowUpRight size={12} />
              </a>
            </div>

            {/* Title — selectable */}
            <h3 className="text-[15px] font-semibold text-dark leading-snug mb-1.5 select-text cursor-text">
              {conversation.postTitle}
            </h3>

            {/* Snippet — selectable, expanded to ~500 chars */}
            <p className="text-[13px] text-muted leading-relaxed line-clamp-4 select-text cursor-text">
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

          {/* Right side: badges */}
          <div className="flex flex-col items-end justify-between shrink-0 self-stretch">
            <div className="flex flex-col items-end gap-2">
              <RelevanceBadge score={conversation.relevanceScore} />
              <StatusBadge status={conversation.status} />
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-muted hover:bg-border hover:text-dark transition-colors"
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
            displayDrafts.length > 0 ? (
              <DraftPanel
                drafts={displayDrafts}
                conversationId={conversation.id}
                onDraftUpdated={handleDraftUpdated}
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
                    Creates corporate and personal drafts based on the brand context in your{' '}
                    <Link
                      href="/knowledgebase"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue hover:text-navy underline"
                    >
                      Knowledgebase
                    </Link>.
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
                  onClick={() => setShowDismissModal(true)}
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

      {/* Dismiss Feedback Modal */}
      {showDismissModal && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50" onClick={() => setShowDismissModal(false)}>
          <div className="bg-white rounded-xl border border-border p-6 w-full max-w-[480px] mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-dark mb-1">Dismiss this conversation</h3>
            <p className="text-[13px] text-muted mb-4">
              Your feedback helps Rosie improve her filtering and quality scoring over time.
            </p>

            {/* Reason selection */}
            <div className="space-y-2 mb-4">
              {DISMISS_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    dismissReason === r.value
                      ? 'border-navy bg-navy/5'
                      : 'border-border hover:bg-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="dismiss-reason"
                    value={r.value}
                    checked={dismissReason === r.value}
                    onChange={() => setDismissReason(r.value)}
                    className="accent-navy"
                  />
                  <span className="text-[13px] text-dark">{r.label}</span>
                </label>
              ))}
            </div>

            {/* Custom feedback */}
            {dismissReason && (
              <textarea
                value={dismissCustom}
                onChange={(e) => setDismissCustom(e.target.value)}
                placeholder="Optional: any additional context for Rosie..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-navy/20 mb-4 resize-none"
              />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleDismissWithoutFeedback}
                className="text-[13px] text-muted hover:text-dark transition-colors"
              >
                Dismiss without feedback
              </button>
              <button
                onClick={handleDismissWithFeedback}
                disabled={!dismissReason || isDismissing}
                className="px-5 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
              >
                {isDismissing ? 'Submitting...' : 'Submit feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
