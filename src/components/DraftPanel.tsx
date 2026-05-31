'use client';

import { useState } from 'react';
import { Copy, Check, Building2, User } from 'lucide-react';

interface DraftPanelProps {
  corporateDraft: string;
  personalDraft: string;
}

type DraftTab = 'corporate' | 'personal';

export function DraftPanel({ corporateDraft, personalDraft }: DraftPanelProps) {
  const [activeTab, setActiveTab] = useState<DraftTab>('corporate');
  const [copied, setCopied] = useState(false);

  const activeDraft = activeTab === 'corporate' ? corporateDraft : personalDraft;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const textarea = document.createElement('textarea');
      textarea.value = activeDraft;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-surface rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('corporate')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
            activeTab === 'corporate'
              ? 'bg-white text-dark shadow-sm'
              : 'text-muted hover:text-dark'
          }`}
        >
          <Building2 size={14} />
          Corporate Voice
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
            activeTab === 'personal'
              ? 'bg-white text-dark shadow-sm'
              : 'text-muted hover:text-dark'
          }`}
        >
          <User size={14} />
          Personal Voice
        </button>
      </div>

      {/* Draft Content */}
      <div className="relative">
        <div className="bg-surface rounded-lg p-4 pr-12">
          <p className="text-[13px] text-dark leading-relaxed whitespace-pre-wrap">{activeDraft}</p>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-md hover:bg-white transition-colors group"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check size={16} className="text-green" />
          ) : (
            <Copy size={16} className="text-muted group-hover:text-dark" />
          )}
        </button>
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-muted mt-2">
        {activeTab === 'corporate'
          ? 'Uses we/us/our pronouns. Discloses Merchynt affiliation.'
          : 'Uses I/me/my pronouns. Frames tools as personal recommendations.'}
      </p>
    </div>
  );
}
