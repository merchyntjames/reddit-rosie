'use client';

import { useState, useEffect } from 'react';
import { mockBrandVoice } from '@/lib/mock-data';
import { BrandVoice } from '@/lib/types';
import { useSaveStatus } from '@/lib/knowledgebase';
import { Megaphone, Shield, BookOpen, MessageSquare, Plus, X, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';

function CollapsibleCard({ icon: Icon, title, subtitle, children, defaultOpen = false }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-navy" />
          <div>
            <h2 className="text-[15px] font-semibold text-dark">{title}</h2>
            <p className="text-[12px] text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-muted">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function BrandVoicePage() {
  const [brandVoice, setBrandVoice] = useState<BrandVoice>(mockBrandVoice);
  const [newSampleResponse, setNewSampleResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { saveStatus, save } = useSaveStatus();

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.settings?.brand_voice) setBrandVoice(data.settings.brand_voice);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Brand Voice</h1>
        <p className="text-[13px] text-muted mt-1">
          How Merchynt sounds when speaking as a company. This shapes the corporate voice drafts.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-navy" />
        </div>
      ) : (
      <div className="space-y-3">
        <CollapsibleCard icon={Megaphone} title="Voice Description" subtitle="The overall tone and personality of the Merchynt brand">
          <textarea value={brandVoice.voiceDescription} onChange={e => setBrandVoice(prev => ({ ...prev, voiceDescription: e.target.value }))} rows={4} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        <CollapsibleCard icon={Shield} title="Reddit-Specific Guidelines" subtitle="Non-negotiable guardrails for how Rosie behaves on Reddit">
          <textarea value={brandVoice.redditGuidelines} onChange={e => setBrandVoice(prev => ({ ...prev, redditGuidelines: e.target.value }))} rows={6} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        <CollapsibleCard icon={Shield} title="Topics to Avoid" subtitle="Subjects Rosie should never engage with">
          <textarea value={brandVoice.topicsToAvoid} onChange={e => setBrandVoice(prev => ({ ...prev, topicsToAvoid: e.target.value }))} rows={5} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        <CollapsibleCard icon={BookOpen} title="Approved Terminology" subtitle="Preferred words and phrases for consistency">
          <textarea value={brandVoice.approvedTerminology} onChange={e => setBrandVoice(prev => ({ ...prev, approvedTerminology: e.target.value }))} rows={5} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        <CollapsibleCard icon={MessageSquare} title="Sample Responses" subtitle={`${brandVoice.sampleResponses.length} example${brandVoice.sampleResponses.length !== 1 ? 's' : ''} for tone reference`}>
          <div className="space-y-3 mb-4">
            {brandVoice.sampleResponses.map((sample, index) => (
              <div key={index} className="relative">
                <textarea value={sample} onChange={e => { const u = [...brandVoice.sampleResponses]; u[index] = e.target.value; setBrandVoice(prev => ({ ...prev, sampleResponses: u })); }} rows={4} className="w-full px-4 py-3 pr-10 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
                <button onClick={() => setBrandVoice(prev => ({ ...prev, sampleResponses: prev.sampleResponses.filter((_, i) => i !== index) }))} className="absolute top-2 right-2 p-1 text-muted hover:text-dark"><X size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newSampleResponse} onChange={e => setNewSampleResponse(e.target.value)} placeholder="Paste a sample response..." className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20" />
            <button onClick={() => { if (newSampleResponse.trim()) { setBrandVoice(prev => ({ ...prev, sampleResponses: [...prev.sampleResponses, newSampleResponse] })); setNewSampleResponse(''); } }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors"><Plus size={14} />Add</button>
          </div>
        </CollapsibleCard>

        <div className="flex justify-end pt-4">
          <button onClick={() => save({ brand_voice: brandVoice })} disabled={saveStatus === 'saving'} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
            {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
            {saveStatus === 'saved' && <Check size={14} />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error — try again' : 'Save Changes'}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
