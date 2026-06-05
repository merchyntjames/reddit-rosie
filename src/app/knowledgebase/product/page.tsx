'use client';

import { useState, useEffect } from 'react';
import { mockProductKnowledge } from '@/lib/mock-data';
import { ProductKnowledge } from '@/lib/types';
import { useSaveStatus } from '@/lib/knowledgebase';
import { Building2, Package, Trophy, BookOpen, Loader2, Check } from 'lucide-react';

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

      <div className="space-y-8">
        {/* Company Overview */}
        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Company Overview</h2>
          </div>
          <p className="text-[13px] text-muted mb-4">High-level description of what Merchynt does.</p>
          <textarea
            value={productKnowledge.companyOverview}
            onChange={e => setProductKnowledge(prev => ({ ...prev, companyOverview: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
        </section>

        {/* Products */}
        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Products</h2>
          </div>
          <p className="text-[13px] text-muted mb-4">Product details Rosie references when drafting replies.</p>
          <div className="space-y-4">
            {productKnowledge.products.map((product, index) => (
              <div key={product.id} className="border border-border rounded-lg">
                <div className="px-4 py-3 border-b border-border bg-surface/50 rounded-t-lg">
                  <h3 className="text-[14px] font-semibold text-dark">{product.name}</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">Description</label>
                    <textarea value={product.description} onChange={e => { const u = [...productKnowledge.products]; u[index] = { ...u[index], description: e.target.value }; setProductKnowledge(prev => ({ ...prev, products: u })); }} rows={2} className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">Key Features</label>
                    <textarea value={product.keyFeatures} onChange={e => { const u = [...productKnowledge.products]; u[index] = { ...u[index], keyFeatures: e.target.value }; setProductKnowledge(prev => ({ ...prev, products: u })); }} rows={4} className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-muted block mb-1">Pricing</label>
                    <textarea value={product.pricing} onChange={e => { const u = [...productKnowledge.products]; u[index] = { ...u[index], pricing: e.target.value }; setProductKnowledge(prev => ({ ...prev, products: u })); }} rows={3} className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Competitor Context */}
        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Competitor Context</h2>
          </div>
          <p className="text-[13px] text-muted mb-4">How Merchynt compares to competitors.</p>
          <textarea value={productKnowledge.competitorContext} onChange={e => setProductKnowledge(prev => ({ ...prev, competitorContext: e.target.value }))} rows={6} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </section>

        {/* Key Stats */}
        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Key Stats and Proof Points</h2>
          </div>
          <p className="text-[13px] text-muted mb-4">Data points Rosie can reference in drafts.</p>
          <textarea value={productKnowledge.keyStats} onChange={e => setProductKnowledge(prev => ({ ...prev, keyStats: e.target.value }))} rows={6} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </section>

        <div className="flex justify-end">
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
