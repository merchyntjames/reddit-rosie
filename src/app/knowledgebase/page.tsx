'use client';

import { useState } from 'react';
import {
  mockProductKnowledge,
  mockBrandVoice,
  mockCreatorProfiles,
} from '@/lib/mock-data';
import {
  ProductKnowledge,
  BrandVoice,
  CreatorProfile,
} from '@/lib/types';
import {
  Package,
  Megaphone,
  Users,
  Building2,
  Trophy,
  BookOpen,
  MessageSquare,
  Shield,
  Plus,
  X,
} from 'lucide-react';

type KnowledgeTab = 'product' | 'brand' | 'creators';

const tabs: { key: KnowledgeTab; label: string; icon: typeof Package }[] = [
  { key: 'product', label: 'Product Knowledge', icon: Package },
  { key: 'brand', label: 'Brand Voice', icon: Megaphone },
  { key: 'creators', label: 'Creator Profiles', icon: Users },
];

export default function KnowledgebasePage() {
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('product');

  // Product Knowledge state
  const [productKnowledge, setProductKnowledge] = useState<ProductKnowledge>(mockProductKnowledge);

  // Brand Voice state
  const [brandVoice, setBrandVoice] = useState<BrandVoice>(mockBrandVoice);
  const [newSampleResponse, setNewSampleResponse] = useState('');

  // Creator Profiles state
  const [creators, setCreators] = useState<CreatorProfile[]>(mockCreatorProfiles);

  // --- Render Product Knowledge Tab ---
  const renderProductTab = () => (
    <div className="space-y-8">
      {/* Company Overview */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Company Overview</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          High-level description of what Merchynt does. Used as context for every draft.
        </p>
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
        <p className="text-[13px] text-muted mb-4">
          Product details that Rosie references when drafting replies. The more specific, the better the drafts.
        </p>
        <div className="space-y-4">
          {productKnowledge.products.map((product, index) => (
            <div key={product.id} className="border border-border rounded-lg">
              <div className="px-4 py-3 border-b border-border bg-surface/50 rounded-t-lg">
                <h3 className="text-[14px] font-semibold text-dark">{product.name}</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">Description</label>
                  <textarea
                    value={product.description}
                    onChange={e => {
                      const updated = [...productKnowledge.products];
                      updated[index] = { ...updated[index], description: e.target.value };
                      setProductKnowledge(prev => ({ ...prev, products: updated }));
                    }}
                    rows={2}
                    className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">Key Features</label>
                  <textarea
                    value={product.keyFeatures}
                    onChange={e => {
                      const updated = [...productKnowledge.products];
                      updated[index] = { ...updated[index], keyFeatures: e.target.value };
                      setProductKnowledge(prev => ({ ...prev, products: updated }));
                    }}
                    rows={4}
                    className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">Pricing</label>
                  <textarea
                    value={product.pricing}
                    onChange={e => {
                      const updated = [...productKnowledge.products];
                      updated[index] = { ...updated[index], pricing: e.target.value };
                      setProductKnowledge(prev => ({ ...prev, products: updated }));
                    }}
                    rows={3}
                    className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
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
        <p className="text-[13px] text-muted mb-4">
          How Merchynt compares to competitors. Rosie uses this to differentiate without bashing.
        </p>
        <textarea
          value={productKnowledge.competitorContext}
          onChange={e => setProductKnowledge(prev => ({ ...prev, competitorContext: e.target.value }))}
          rows={6}
          className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </section>

      {/* Key Stats */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Key Stats and Proof Points</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Data points Rosie can reference in drafts to build credibility.
        </p>
        <textarea
          value={productKnowledge.keyStats}
          onChange={e => setProductKnowledge(prev => ({ ...prev, keyStats: e.target.value }))}
          rows={6}
          className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </section>

      <div className="flex justify-end">
        <button className="px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );

  // --- Render Brand Voice Tab ---
  const renderBrandTab = () => (
    <div className="space-y-8">
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Brand Voice</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          How Merchynt sounds when speaking as a company. This shapes the corporate voice drafts.
        </p>
        <textarea
          value={brandVoice.voiceDescription}
          onChange={e => setBrandVoice(prev => ({ ...prev, voiceDescription: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </section>

      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Reddit-Specific Guidelines</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Rules for how Rosie behaves on Reddit specifically. These are non-negotiable guardrails.
        </p>
        <textarea
          value={brandVoice.redditGuidelines}
          onChange={e => setBrandVoice(prev => ({ ...prev, redditGuidelines: e.target.value }))}
          rows={6}
          className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </section>

      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Topics to Avoid</h2>
        </div>
        <textarea
          value={brandVoice.topicsToAvoid}
          onChange={e => setBrandVoice(prev => ({ ...prev, topicsToAvoid: e.target.value }))}
          rows={5}
          className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </section>

      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Approved Terminology</h2>
        </div>
        <textarea
          value={brandVoice.approvedTerminology}
          onChange={e => setBrandVoice(prev => ({ ...prev, approvedTerminology: e.target.value }))}
          rows={5}
          className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </section>

      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Sample Responses</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Example replies that show Rosie the tone and format you want. These are reference only — Rosie will not copy them.
        </p>
        <div className="space-y-3 mb-4">
          {brandVoice.sampleResponses.map((sample, index) => (
            <div key={index} className="relative">
              <textarea
                value={sample}
                onChange={e => {
                  const updated = [...brandVoice.sampleResponses];
                  updated[index] = e.target.value;
                  setBrandVoice(prev => ({ ...prev, sampleResponses: updated }));
                }}
                rows={4}
                className="w-full px-4 py-3 pr-10 text-[13px] text-dark leading-relaxed bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
              <button
                onClick={() => setBrandVoice(prev => ({
                  ...prev,
                  sampleResponses: prev.sampleResponses.filter((_, i) => i !== index),
                }))}
                className="absolute top-2 right-2 p-1 text-muted hover:text-dark"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSampleResponse}
            onChange={e => setNewSampleResponse(e.target.value)}
            placeholder="Paste a sample response..."
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          <button
            onClick={() => {
              if (newSampleResponse.trim()) {
                setBrandVoice(prev => ({ ...prev, sampleResponses: [...prev.sampleResponses, newSampleResponse] }));
                setNewSampleResponse('');
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button className="px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );

  // --- Render Creator Profiles Tab ---
  const renderCreatorsTab = () => (
    <div className="space-y-8">
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Users size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Creator Profiles</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Individual voice profiles for personal Reddit accounts. Each creator gets unique drafts tailored to their voice and expertise.
        </p>

        <div className="space-y-4">
          {creators.map((creator, index) => (
            <div key={creator.id} className="border border-border rounded-lg">
              <div className="px-4 py-3 border-b border-border bg-surface/50 rounded-t-lg flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-semibold text-dark">{creator.name}</h3>
                  <p className="text-[12px] text-muted">{creator.redditUsername} -- {creator.role}</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">Voice Description</label>
                  <textarea
                    value={creator.voiceDescription}
                    onChange={e => {
                      const updated = [...creators];
                      updated[index] = { ...updated[index], voiceDescription: e.target.value };
                      setCreators(updated);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">Reddit Persona Notes</label>
                  <textarea
                    value={creator.redditPersonaNotes}
                    onChange={e => {
                      const updated = [...creators];
                      updated[index] = { ...updated[index], redditPersonaNotes: e.target.value };
                      setCreators(updated);
                    }}
                    rows={4}
                    className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">Topics of Expertise</label>
                  <textarea
                    value={creator.topicsOfExpertise}
                    onChange={e => {
                      const updated = [...creators];
                      updated[index] = { ...updated[index], topicsOfExpertise: e.target.value };
                      setCreators(updated);
                    }}
                    rows={4}
                    className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button className="px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'product': return renderProductTab();
      case 'brand': return renderBrandTab();
      case 'creators': return renderCreatorsTab();
    }
  };

  return (
    <div className="p-8 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Knowledgebase</h1>
        <p className="text-[13px] text-muted mt-1">
          Product knowledge, brand voice, and creator profiles that Rosie uses to generate drafts.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-1 mb-8 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-navy text-white'
                  : 'text-muted hover:text-dark hover:bg-surface'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {renderActiveTab()}
    </div>
  );
}
