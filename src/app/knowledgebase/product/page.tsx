'use client';

import { useState, useEffect } from 'react';
import { mockProductKnowledge } from '@/lib/mock-data';
import { ProductKnowledge } from '@/lib/types';
import { useSaveStatus } from '@/lib/knowledgebase';
import { Building2, Package, Trophy, BookOpen, Loader2, Check, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

function CollapsibleCard({ icon: Icon, title, subtitle, children, defaultOpen = false, onDelete }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onDelete?: () => void;
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
        <div className="flex items-center gap-2">
          {onDelete && (
            <div
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-md text-muted hover:text-dark hover:bg-surface transition-colors cursor-pointer"
              title="Remove product"
            >
              <Trash2 size={14} />
            </div>
          )}
          <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-muted">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
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
  const [newProductName, setNewProductName] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.settings?.product_knowledge) setProductKnowledge(data.settings.product_knowledge);
    }).catch(() => {});
  }, []);

  const addProduct = () => {
    if (!newProductName.trim()) return;
    setProductKnowledge(prev => ({
      ...prev,
      products: [...prev.products, {
        id: String(Date.now()),
        name: newProductName,
        description: '',
        keyFeatures: '',
        pricing: '',
      }],
    }));
    setNewProductName('');
  };

  const removeProduct = (id: string) => {
    setProductKnowledge(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id),
    }));
  };

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

        <CollapsibleCard icon={Trophy} title="Competitor Context" subtitle="How Merchynt compares to competitors">
          <textarea value={productKnowledge.competitorContext} onChange={e => setProductKnowledge(prev => ({ ...prev, competitorContext: e.target.value }))} rows={6} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        <CollapsibleCard icon={BookOpen} title="Key Stats and Proof Points" subtitle="Data points Rosie can reference in drafts">
          <textarea value={productKnowledge.keyStats} onChange={e => setProductKnowledge(prev => ({ ...prev, keyStats: e.target.value }))} rows={6} className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
        </CollapsibleCard>

        {productKnowledge.products.map((product, index) => (
          <CollapsibleCard
            key={product.id}
            icon={Package}
            title={product.name || 'Untitled Product'}
            subtitle={product.description ? product.description.slice(0, 80) + '...' : 'No description yet'}
            onDelete={() => removeProduct(product.id)}
          >
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Product Name</label>
                <input value={product.name} onChange={e => { const u = [...productKnowledge.products]; u[index] = { ...u[index], name: e.target.value }; setProductKnowledge(prev => ({ ...prev, products: u })); }} className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-navy/20" />
              </div>
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

        {/* Add New Product */}
        <div className="bg-white rounded-xl border border-dashed border-border p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addProduct()}
              placeholder="New product name (e.g., Rosie The Redditor)"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
            <button
              onClick={addProduct}
              disabled={!newProductName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              <Plus size={14} />
              Add Product
            </button>
          </div>
          <p className="text-[11px] text-muted mt-2">New products are automatically included in Rosie's context for AI draft generation.</p>
        </div>

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
