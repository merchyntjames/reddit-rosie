'use client';

import { useState } from 'react';
import { Copy, Check, Building2, User, RefreshCw, GraduationCap, Loader2, X } from 'lucide-react';

export interface DraftItem {
  draftType: 'corporate' | 'personal';
  creatorId: string | null;
  creatorName: string;
  content: string;
  version?: number;
}

interface DraftPanelProps {
  drafts: DraftItem[];
  conversationId: string;
  onDraftUpdated?: (draftType: string, creatorId: string | null, newContent: string) => void;
}

export function DraftPanel({ drafts, conversationId, onDraftUpdated }: DraftPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showReroll, setShowReroll] = useState(false);
  const [showTrain, setShowTrain] = useState(false);
  const [rerollFeedback, setRerollFeedback] = useState('');
  const [trainText, setTrainText] = useState('');
  const [isRerolling, setIsRerolling] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainSuccess, setTrainSuccess] = useState(false);

  const activeDraft = drafts[activeIndex];
  if (!activeDraft) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeDraft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = activeDraft.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReroll = async () => {
    if (!rerollFeedback.trim()) return;
    setIsRerolling(true);
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reroll',
          conversationId,
          draftType: activeDraft.draftType,
          creatorId: activeDraft.creatorId,
          previousDraft: activeDraft.content,
          feedback: rerollFeedback,
        }),
      });
      const data = await res.json();
      if (data.content) {
        onDraftUpdated?.(activeDraft.draftType, activeDraft.creatorId, data.content);
        setShowReroll(false);
        setRerollFeedback('');
      }
    } catch (err) {
      console.error('Reroll failed:', err);
    } finally {
      setIsRerolling(false);
    }
  };

  const handleTrain = async () => {
    if (!trainText.trim()) return;
    setIsTraining(true);
    try {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'train',
          conversationId,
          draftType: activeDraft.draftType,
          creatorId: activeDraft.creatorId,
          originalDraft: activeDraft.content,
          rewrittenDraft: trainText,
        }),
      });
      setTrainSuccess(true);
      setTimeout(() => {
        setShowTrain(false);
        setTrainText('');
        setTrainSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Training submission failed:', err);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="p-4 sm:p-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-surface rounded-lg p-1 w-full sm:w-fit overflow-x-auto">
        {drafts.map((draft, index) => (
          <button
            key={`${draft.draftType}-${draft.creatorId}`}
            onClick={() => { setActiveIndex(index); setShowReroll(false); setShowTrain(false); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors ${
              activeIndex === index
                ? 'bg-white text-dark shadow-sm'
                : 'text-muted hover:text-dark'
            }`}
          >
            {draft.draftType === 'corporate' ? <Building2 size={14} /> : <User size={14} />}
            {draft.creatorName}
          </button>
        ))}
      </div>

      {/* Draft Content */}
      <div className="relative">
        <div className="bg-surface rounded-lg p-4 sm:pr-28">
          <p className="text-[13px] text-dark leading-relaxed whitespace-pre-wrap select-text cursor-text">{activeDraft.content}</p>
        </div>

        {/* Action buttons — top right on desktop, below content on mobile */}
        <div className="flex items-center gap-1 mt-2 sm:mt-0 sm:absolute sm:top-3 sm:right-3">
          <button
            onClick={handleCopy}
            className="p-2 rounded-md hover:bg-white transition-colors group"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check size={15} className="text-green" />
            ) : (
              <Copy size={15} className="text-muted group-hover:text-dark" />
            )}
          </button>
          <button
            onClick={() => { setShowReroll(!showReroll); setShowTrain(false); }}
            className={`p-2 rounded-md hover:bg-white transition-colors group ${showReroll ? 'bg-white' : ''}`}
            title="Re-roll with feedback"
          >
            <RefreshCw size={15} className={showReroll ? 'text-navy' : 'text-muted group-hover:text-dark'} />
          </button>
          <button
            onClick={() => { setShowTrain(!showTrain); setShowReroll(false); setTrainText(activeDraft.content); }}
            className={`p-2 rounded-md hover:bg-white transition-colors group ${showTrain ? 'bg-white' : ''}`}
            title="Train the AI with your rewrite"
          >
            <GraduationCap size={15} className={showTrain ? 'text-navy' : 'text-muted group-hover:text-dark'} />
          </button>
        </div>
      </div>

      {/* Re-Roll Panel */}
      {showReroll && (
        <div className="mt-3 p-4 rounded-lg border border-navy/20 bg-navy/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold text-dark">Re-roll this draft</p>
            <button onClick={() => setShowReroll(false)} className="text-muted hover:text-dark">
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] text-muted mb-2">
            Tell Rosie how to modify this response. She will regenerate it with your feedback.
          </p>
          <textarea
            value={rerollFeedback}
            onChange={(e) => setRerollFeedback(e.target.value)}
            placeholder="e.g., Make it shorter, mention our free trial, be more opinionated about GBP categories..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-[13px] text-dark placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none mb-2"
          />
          <div className="flex justify-end">
            <button
              onClick={handleReroll}
              disabled={!rerollFeedback.trim() || isRerolling}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              {isRerolling ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Re-roll draft
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Train Panel */}
      {showTrain && (
        <div className="mt-3 p-4 rounded-lg border border-green/20 bg-green/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold text-dark">Train the AI</p>
            <button onClick={() => setShowTrain(false)} className="text-muted hover:text-dark">
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] text-muted mb-2">
            Paste your rewritten version below. Rosie will learn from the differences between her draft and your version to improve future responses.
          </p>
          <textarea
            value={trainText}
            onChange={(e) => setTrainText(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-[13px] text-dark placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-green/20 resize-y mb-2"
          />
          <div className="flex justify-end">
            {trainSuccess ? (
              <span className="flex items-center gap-2 text-[13px] text-green font-medium">
                <Check size={14} />
                Training submitted
              </span>
            ) : (
              <button
                onClick={handleTrain}
                disabled={!trainText.trim() || isTraining}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green text-white text-[13px] font-medium hover:bg-green/90 transition-colors disabled:opacity-50"
              >
                {isTraining ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <GraduationCap size={14} />
                    Submit training
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-[11px] text-muted mt-2">
        {activeDraft.draftType === 'corporate'
          ? 'Uses we/us/our pronouns. Discloses Merchynt affiliation.'
          : `Uses I/me/my pronouns. Written as ${activeDraft.creatorName}.`}
        {activeDraft.version && activeDraft.version > 1 && (
          <span className="ml-1 text-blue">v{activeDraft.version} (re-rolled)</span>
        )}
      </p>
    </div>
  );
}
