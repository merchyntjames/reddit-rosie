'use client';

import { useState, useEffect } from 'react';
import { mockProductKnowledge } from '@/lib/mock-data';
import { ProductKnowledge } from '@/lib/types';
import { useSaveStatus } from '@/lib/knowledgebase';
import { Building2, Package, Trophy, BookOpen, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';

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

export default function ProductKnowledgePage() {
  const [productKnowledge, setProductKnowledge] = useState<ProductKnowledge>(mockProductKnowledge);
  const { saveStatus, save } = useSaveStatus();

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.settings?.product_knowledge) setProductKnowledge(data.settings.product_knowledge);
    }).catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Product Knowledge</h1>
        <p className="text-[13px] text-muted mt-1">
          Company and product information that Rosie uses as context when generating drafts.
        </p>
      </div>

      <div className="space-y-3">
        <CollapsibleCard icon={Building2} title="Company Overview" subtitle="High-level description of what Merchynt does">
          <textarea
            value={productKnowledge.companyOverview}
            onChange={e => setProductKnowledge(prev => ({ ...prev, companyOverview: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
        </CollapsibleCard>

        {productKnowledge.products.map((product, index) => (
          <CollapsibleCard key={product.id} icon={Package} title={product.name} subtitle={product.description.slice(0, 80) + '...'}>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Description</label>
                <textarea value={product.description} onChange={e => { const u = [...productKnowledge.products]; u[index] = { ...u[index], description: e.target.value }; setProductKnowledge(prev => ({ ...prev, products: u })); }} rows={2} className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Key Features</label>
                <textarea value={product.keyFeatures} onChange={e => { const u = [...productKnowledge.products]; u[index] = { ...u[index], keyFeatures: e.target.value }; setProductKnowledge(prev => ({ ...prev, products: u })); }} rows={4} className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Pricing</label>
                <textarea value={product.pricing} onChange={e => { const u = [...productKnowledge.products]; u[index] = { ...u[index], pricing: e.target.value }; setProductKnowledge(prev => ({ ...prev, products: u })); }} rows={3} className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
              </div>
            </div>
          </CollapsibleCard>
        ))}

        <CollapsibleCard icon={Trophy} title="Competitor Context" subtitle="How Merchynt compares to competitors">
          <textarea value={productKnowledge.competitorContext} onChange={e => setProductKnowledge(prev => ({ ...prev, competitorContext: e.target.value }))} rows={6} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        <CollapsibleCard icon={BookOpen} title="Key Stats and Proof Points" subtitle="Data points Rosie can reference in drafts">
          <textarea value={productKnowledge.keyStats} onChange={e => setProductKnowledge(prev => ({ ...prev, keyStats: e.target.value }))} rows={6} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        <div className="flex justify-end pt-4">
          <button onClick={() => save({ product_knowledge: productKnowledge })} disabled={saveStatus === 'saving'} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
            {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
            {saveStatus === 'saved' && <Check size={14} />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error — try again' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
