'use client';

import { useState, useEffect } from 'react';
import { mockBrandVoice } from '@/lib/mock-data';
import { BrandVoice } from '@/lib/types';
import { useSaveStatus } from '@/lib/knowledgebase';
import { Megaphone, Shield, BookOpen, MessageSquare, Plus, X, Loader2, Check } from 'lucide-react';

export default function BrandVoicePage() {
  const [brandVoice, setBrandVoice] = useState<BrandVoice>(mockBrandVoice);
  const [newSampleResponse, setNewSampleResponse] = useState('');
  const { saveStatus, save } = useSaveStatus();

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.settings?.brand_voice) setBrandVoice(data.settings.brand_voice);
    }).catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Brand Voice</h1>
        <p className="text-[13px] text-muted mt-1">
          How Merchynt sounds when speaking as a company. This shapes the corporate voice drafts.
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Voice Description</h2>
          </div>
          <textarea value={brandVoice.voiceDescription} onChange={e => setBrandVoice(prev => ({ ...prev, voiceDescription: e.target.value }))} rows={4} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </section>

        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Reddit-Specific Guidelines</h2>
          </div>
          <p className="text-[13px] text-muted mb-4">Non-negotiable guardrails for how Rosie behaves on Reddit.</p>
          <textarea value={brandVoice.redditGuidelines} onChange={e => setBrandVoice(prev => ({ ...prev, redditGuidelines: e.target.value }))} rows={6} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </section>

        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Topics to Avoid</h2>
          </div>
          <textarea value={brandVoice.topicsToAvoid} onChange={e => setBrandVoice(prev => ({ ...prev, topicsToAvoid: e.target.value }))} rows={5} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </section>

        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Approved Terminology</h2>
          </div>
          <textarea value={brandVoice.approvedTerminology} onChange={e => setBrandVoice(prev => ({ ...prev, approvedTerminology: e.target.value }))} rows={5} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </section>

        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Sample Responses</h2>
          </div>
          <p className="text-[13px] text-muted mb-4">Example replies that show Rosie the tone and format you want.</p>
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
        </section>

        <div className="flex justify-end">
          <button onClick={() => save({ brand_voice: brandVoice })} disabled={saveStatus === 'saving'} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
            {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
            {saveStatus === 'saved' && <Check size={14} />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error — try again' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
