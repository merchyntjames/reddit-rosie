'use client';

import { useState, useEffect } from 'react';
import { mockProductKnowledge, mockBrandVoice } from '@/lib/mock-data';
import { ProductKnowledge, BrandVoice } from '@/lib/types';
import { useSaveStatus } from '@/lib/knowledgebase';
import { Building2, Trophy, BookOpen, Users, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';

function CollapsibleCard({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

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

export default function CompanyKnowledgePage() {
  const [productKnowledge, setProductKnowledge] = useState<ProductKnowledge>(mockProductKnowledge);
  const [brandVoice, setBrandVoice] = useState<BrandVoice>(mockBrandVoice);
  const [isLoading, setIsLoading] = useState(true);
  const { saveStatus, save } = useSaveStatus();

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.settings?.product_knowledge) setProductKnowledge(data.settings.product_knowledge);
      if (data.settings?.brand_voice) setBrandVoice(data.settings.brand_voice);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const handleSave = () => save({
    product_knowledge: productKnowledge,
    brand_voice: brandVoice,
  });

  return (
    <div className="p-8 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Company Knowledge</h1>
        <p className="text-[13px] text-muted mt-1">
          Core company information, competitive positioning, proof points, and target audiences that Rosie uses across all drafts.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-navy" />
        </div>
      ) : (
      <div className="space-y-3">
        <CollapsibleCard icon={Building2} title="Company Overview" subtitle="High-level description of what Merchynt does">
          <textarea
            value={productKnowledge.companyOverview}
            onChange={e => setProductKnowledge(prev => ({ ...prev, companyOverview: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
        </CollapsibleCard>

        <CollapsibleCard icon={Trophy} title="Competitor Context" subtitle="How Merchynt compares to competitors">
          <textarea value={productKnowledge.competitorContext} onChange={e => setProductKnowledge(prev => ({ ...prev, competitorContext: e.target.value }))} rows={6} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        <CollapsibleCard icon={BookOpen} title="Key Stats and Proof Points" subtitle="Data points Rosie can reference in drafts">
          <textarea value={productKnowledge.keyStats} onChange={e => setProductKnowledge(prev => ({ ...prev, keyStats: e.target.value }))} rows={6} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        <CollapsibleCard icon={Users} title="Audience Description" subtitle="Who Merchynt is talking to — shapes tone and relevance of drafts">
          <textarea value={brandVoice.audienceDescription || ''} onChange={e => setBrandVoice(prev => ({ ...prev, audienceDescription: e.target.value }))} rows={12} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        <div className="flex justify-end pt-4">
          <button onClick={handleSave} disabled={saveStatus === 'saving'} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
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
