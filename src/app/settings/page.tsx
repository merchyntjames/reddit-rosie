'use client';

import { useState } from 'react';
import {
  mockSubreddits,
  mockKeywords,
  mockProductKnowledge,
  mockBrandVoice,
  mockCreatorProfiles,
  mockMonitoringConfig,
  mockIntegrationStatus,
  mockRedditAccounts,
} from '@/lib/mock-data';
import {
  MonitoredSubreddit,
  MonitoredKeyword,
  Product,
  ProductKnowledge,
  BrandVoice,
  CreatorProfile,
  MonitoringConfig,
  IntegrationStatus,
  RedditAccount,
  ScanFrequency,
} from '@/lib/types';
import {
  Plus,
  X,
  Hash,
  Search,
  Radio,
  Package,
  Megaphone,
  Users,
  Plug,
  Building2,
  Trophy,
  BookOpen,
  MessageSquare,
  Shield,
  Bell,
  Database,
  CircleCheck,
  CircleX,
  Sliders,
  UserPlus,
  Trash2,
  Target,
} from 'lucide-react';

type SettingsTab = 'monitoring' | 'quality' | 'integrations';

const tabs: { key: SettingsTab; label: string; icon: typeof Radio }[] = [
  { key: 'monitoring', label: 'Monitoring', icon: Radio },
  { key: 'quality', label: 'Quality Score', icon: Target },
  { key: 'integrations', label: 'Accounts & Integrations', icon: Plug },
];

export default function SettingsPage() {
  // Read ?tab= query param to support deep linking (e.g., from Quality Score tooltip)
  const initialTab = (() => {
    if (typeof window === 'undefined') return 'monitoring';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['monitoring', 'quality', 'integrations'].includes(tab)) {
      return tab as SettingsTab;
    }
    return 'monitoring';
  })();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Load settings from Supabase on mount
  useState(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const s = data.settings;
        if (s?.monitored_subreddits && Array.isArray(s.monitored_subreddits)) {
          setSubreddits(s.monitored_subreddits.map((name: string) => ({ name: name.startsWith('r/') ? name : `r/${name}`, enabled: true })));
        }
        if (s?.monitored_keywords && Array.isArray(s.monitored_keywords)) {
          setKeywords(s.monitored_keywords.map((term: string) => ({ term, enabled: true })));
        }
      })
      .catch(() => {});
  });

  // Save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveMonitoringSettings = async () => {
    setSaveStatus('saving');
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitored_subreddits: subreddits.filter(s => s.enabled).map(s => s.name.replace('r/', '')),
          monitored_keywords: keywords.filter(k => k.enabled).map(k => k.term),
        }),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Monitoring state
  const [subreddits, setSubreddits] = useState<MonitoredSubreddit[]>(mockSubreddits);
  const [keywords, setKeywords] = useState<MonitoredKeyword[]>(mockKeywords);
  const [newSubreddit, setNewSubreddit] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [monitoringConfig, setMonitoringConfig] = useState<MonitoringConfig>(mockMonitoringConfig);

  // Product Knowledge state
  const [productKnowledge, setProductKnowledge] = useState<ProductKnowledge>(mockProductKnowledge);

  // Brand Voice state
  const [brandVoice, setBrandVoice] = useState<BrandVoice>(mockBrandVoice);
  const [newSampleResponse, setNewSampleResponse] = useState('');

  // Creator Profiles state
  const [creators, setCreators] = useState<CreatorProfile[]>(mockCreatorProfiles);

  // Integrations state
  const [integrations, setIntegrations] = useState<IntegrationStatus>(mockIntegrationStatus);

  // Reddit Accounts state
  const [redditAccounts, setRedditAccounts] = useState<RedditAccount[]>(mockRedditAccounts);
  const [newRedditUsername, setNewRedditUsername] = useState('');
  const [newRedditLabel, setNewRedditLabel] = useState('');
  const [newRedditType, setNewRedditType] = useState<'brand' | 'personal'>('personal');

  const addRedditAccount = () => {
    if (!newRedditUsername.trim() || !newRedditLabel.trim()) return;
    const username = newRedditUsername.startsWith('u/') ? newRedditUsername : `u/${newRedditUsername}`;
    if (redditAccounts.find(a => a.username === username)) return;
    setRedditAccounts(prev => [...prev, {
      id: String(Date.now()),
      username,
      label: newRedditLabel,
      type: newRedditType,
      status: 'not_connected',
      permissions: { posting: false, analytics: false },
    }]);
    setNewRedditUsername('');
    setNewRedditLabel('');
    setNewRedditType('personal');
  };

  const removeRedditAccount = (id: string) => {
    setRedditAccounts(prev => prev.filter(a => a.id !== id));
  };

  // --- Monitoring handlers ---
  const toggleSubreddit = (name: string) => {
    setSubreddits(prev =>
      prev.map(s => s.name === name ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const toggleKeyword = (term: string) => {
    setKeywords(prev =>
      prev.map(k => k.term === term ? { ...k, enabled: !k.enabled } : k)
    );
  };

  const addSubreddit = () => {
    if (!newSubreddit.trim()) return;
    const name = newSubreddit.startsWith('r/') ? newSubreddit : `r/${newSubreddit}`;
    if (subreddits.find(s => s.name === name)) return;
    setSubreddits(prev => [...prev, { name, enabled: true }]);
    setNewSubreddit('');
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    if (keywords.find(k => k.term === newKeyword)) return;
    setKeywords(prev => [...prev, { term: newKeyword, enabled: true }]);
    setNewKeyword('');
  };

  const removeSubreddit = (name: string) => {
    setSubreddits(prev => prev.filter(s => s.name !== name));
  };

  const removeKeyword = (term: string) => {
    setKeywords(prev => prev.filter(k => k.term !== term));
  };

  // --- Product Knowledge handlers ---
  const updateProduct = (id: string, field: keyof Product, value: string) => {
    setProductKnowledge(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, [field]: value } : p),
    }));
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: '',
      description: '',
      keyFeatures: '',
      pricing: '',
    };
    setProductKnowledge(prev => ({
      ...prev,
      products: [...prev.products, newProduct],
    }));
  };

  const removeProduct = (id: string) => {
    setProductKnowledge(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id),
    }));
  };

  // --- Brand Voice handlers ---
  const addSampleResponse = () => {
    if (!newSampleResponse.trim()) return;
    setBrandVoice(prev => ({
      ...prev,
      sampleResponses: [...prev.sampleResponses, newSampleResponse],
    }));
    setNewSampleResponse('');
  };

  const removeSampleResponse = (index: number) => {
    setBrandVoice(prev => ({
      ...prev,
      sampleResponses: prev.sampleResponses.filter((_, i) => i !== index),
    }));
  };

  const updateSampleResponse = (index: number, value: string) => {
    setBrandVoice(prev => ({
      ...prev,
      sampleResponses: prev.sampleResponses.map((r, i) => i === index ? value : r),
    }));
  };

  // --- Creator handlers ---
  const addCreator = () => {
    const newCreator: CreatorProfile = {
      id: Date.now().toString(),
      name: '',
      redditUsername: '',
      role: '',
      voiceDescription: '',
      redditPersonaNotes: '',
      topicsOfExpertise: '',
    };
    setCreators(prev => [...prev, newCreator]);
  };

  const removeCreator = (id: string) => {
    setCreators(prev => prev.filter(c => c.id !== id));
  };

  const updateCreator = (id: string, field: keyof CreatorProfile, value: string) => {
    setCreators(prev =>
      prev.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  };

  // --- Render Monitoring Tab ---
  const renderMonitoringTab = () => (
    <div className="space-y-8">
      {/* Subreddits */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Hash size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Monitored Subreddits</h2>
        </div>
        <p className="text-[13px] text-muted mb-5">
          Rosie scans these subreddits for new posts matching your keywords.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={newSubreddit}
            onChange={e => setNewSubreddit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSubreddit()}
            placeholder="e.g. LocalSEO or r/LocalSEO"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
          />
          <button
            onClick={addSubreddit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        <div className="space-y-1">
          {subreddits.map(sub => (
            <div
              key={sub.name}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface group"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSubreddit(sub.name)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    sub.enabled
                      ? 'bg-navy border-navy'
                      : 'border-border bg-white'
                  }`}
                >
                  {sub.enabled && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <span className={`text-[13px] font-medium ${sub.enabled ? 'text-dark' : 'text-muted'}`}>
                  {sub.name}
                </span>
              </div>
              <button
                onClick={() => removeSubreddit(sub.name)}
                className="text-muted hover:text-dark opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Keywords */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Search size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Monitored Keywords</h2>
        </div>
        <p className="text-[13px] text-muted mb-5">
          Posts and comments containing these keywords will appear in your queue.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKeyword()}
            placeholder="e.g. local SEO tool"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
          />
          <button
            onClick={addKeyword}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {keywords.map(kw => (
            <div
              key={kw.term}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer ${
                kw.enabled
                  ? 'bg-navy/5 border-navy/20 text-navy'
                  : 'bg-surface border-border text-muted'
              }`}
              onClick={() => toggleKeyword(kw.term)}
            >
              {kw.term}
              <button
                onClick={e => { e.stopPropagation(); removeKeyword(kw.term); }}
                className="hover:text-dark ml-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Scan & Relevance Settings */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sliders size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Scan Settings</h2>
        </div>
        <p className="text-[13px] text-muted mb-5">
          Control how often Rosie checks for new conversations and the minimum relevance score.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scan Frequency */}
          <div>
            <label className="block text-[13px] font-medium text-dark mb-2">Scan Frequency</label>
            <select
              value={monitoringConfig.scanFrequency}
              onChange={e => setMonitoringConfig(prev => ({ ...prev, scanFrequency: e.target.value as ScanFrequency }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
            >
              <option value="15min">Every 15 minutes</option>
              <option value="30min">Every 30 minutes</option>
              <option value="1hour">Every 1 hour</option>
              <option value="2hours">Every 2 hours</option>
            </select>
            <p className="text-[12px] text-muted mt-1.5">How often Rosie checks monitored subreddits for new posts.</p>
          </div>

          {/* Relevance Threshold */}
          <div>
            <label className="block text-[13px] font-medium text-dark mb-2">
              Relevance Threshold: <span className="text-navy font-semibold">{monitoringConfig.relevanceThreshold}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={monitoringConfig.relevanceThreshold}
              onChange={e => setMonitoringConfig(prev => ({ ...prev, relevanceThreshold: parseInt(e.target.value) }))}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-navy"
            />
            <div className="flex justify-between text-[11px] text-muted mt-1">
              <span>0 (show everything)</span>
              <span>100 (only exact matches)</span>
            </div>
            <p className="text-[12px] text-muted mt-1.5">Posts scoring below this threshold will not appear in your queue.</p>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={saveMonitoringSettings}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
        >
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  // --- Render Quality Score Tab ---
  const renderQualityTab = () => (
    <div className="space-y-8">
      {/* How It Works */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Target size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">How Quality Scores Work</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Every Reddit post Rosie finds is scored from 0-100 based on how relevant it is to Merchynt. Posts scoring below the minimum threshold are filtered out of your queue. Higher scores mean more engagement opportunities.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-orange/5 border border-orange/20 text-center">
            <p className="text-[20px] font-bold text-orange">0-59</p>
            <p className="text-[11px] text-muted mt-1">Low relevance</p>
          </div>
          <div className="p-3 rounded-lg bg-blue/5 border border-blue/20 text-center">
            <p className="text-[20px] font-bold text-blue">60-79</p>
            <p className="text-[11px] text-muted mt-1">Good fit</p>
          </div>
          <div className="p-3 rounded-lg bg-green/5 border border-green/20 text-center">
            <p className="text-[20px] font-bold text-green">80-100</p>
            <p className="text-[11px] text-muted mt-1">Excellent fit</p>
          </div>
        </div>
      </section>

      {/* Minimum Threshold */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sliders size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Minimum Quality Threshold</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Posts scoring below this threshold are automatically filtered out of your queue during each daily scan.
        </p>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border">
          <span className="text-[24px] font-bold text-navy">40</span>
          <span className="text-[13px] text-muted">/ 100 — posts scoring below 40 are excluded from the queue</span>
        </div>
        <p className="text-[11px] text-muted mt-2">
          To adjust this threshold, contact your Claude Code administrator.
        </p>
      </section>

      {/* Brand Mentions */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Brand and Competitor Mentions</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Posts mentioning these terms receive a significant score boost. Brand mentions are the highest signal — a post mentioning Merchynt is almost always worth engaging with.
        </p>
        <div className="space-y-2">
          {[
            { term: 'Merchynt', weight: 50, type: 'Brand' },
            { term: 'Paige (in SEO context)', weight: 40, type: 'Brand' },
            { term: 'BrightLocal', weight: 30, type: 'Competitor' },
            { term: 'Whitespark', weight: 30, type: 'Competitor' },
            { term: 'Moz Local', weight: 25, type: 'Competitor' },
            { term: 'Yext', weight: 20, type: 'Competitor' },
          ].map(item => (
            <div key={item.term} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-dark">{item.term}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  item.type === 'Brand' ? 'bg-navy/10 text-navy' : 'bg-pink/10 text-pink'
                }`}>{item.type}</span>
              </div>
              <span className="text-[13px] font-semibold text-navy">+{item.weight} pts</span>
            </div>
          ))}
        </div>
      </section>

      {/* Topic Relevance */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Search size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Topic Relevance</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Posts containing these keywords in their title or body receive points based on how closely the topic aligns with Merchynt's expertise.
        </p>
        <div className="space-y-2">
          {[
            { term: 'Google Business Profile', weight: 15 },
            { term: 'GBP', weight: 12 },
            { term: 'local SEO', weight: 12 },
            { term: 'Google Maps ranking', weight: 12 },
            { term: 'review management', weight: 10 },
            { term: 'Google reviews', weight: 10 },
            { term: 'AI search / AI visibility', weight: 10 },
            { term: 'local pack / map pack', weight: 8 },
            { term: 'citation', weight: 6 },
            { term: 'local marketing', weight: 6 },
            { term: 'Google Maps', weight: 6 },
            { term: 'local business', weight: 5 },
            { term: 'SEO tool', weight: 5 },
            { term: 'agency', weight: 3 },
          ].map(item => (
            <div key={item.term} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-surface">
              <span className="text-[13px] text-dark">{item.term}</span>
              <span className="text-[13px] font-medium text-muted">+{item.weight} pts</span>
            </div>
          ))}
        </div>
      </section>

      {/* Engagement Signals */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Engagement Signals</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Bonus points based on post characteristics that indicate good engagement opportunities.
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-[12px] font-semibold text-dark mb-2">Positive signals (boost score)</p>
            <div className="space-y-1.5">
              {[
                { signal: 'Question post (contains ?, how, what, best, recommend)', points: '+8' },
                { signal: 'Help/advice request (help, advice, tips, suggestions)', points: '+5' },
                { signal: 'Tool comparison (vs, compare, alternative, tool)', points: '+8' },
                { signal: 'Posted in r/localseo, r/SEO, or r/smallbusiness', points: '+10' },
                { signal: 'Posted in r/marketing, r/digital_marketing, or r/agency', points: '+5' },
              ].map(item => (
                <div key={item.signal} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-green/5">
                  <span className="text-[12px] text-dark">{item.signal}</span>
                  <span className="text-[12px] font-semibold text-green">{item.points}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-dark mb-2">Negative signals (reduce score)</p>
            <div className="space-y-1.5">
              {[
                { signal: 'Self-promotion (I built, I spent, we just launched, check out my)', points: '-20' },
                { signal: 'Hiring/job post ([HIRING], [FOR HIRE], looking for freelancer)', points: '-25' },
              ].map(item => (
                <div key={item.signal} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-pink/5">
                  <span className="text-[12px] text-dark">{item.signal}</span>
                  <span className="text-[12px] font-semibold text-pink">{item.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Note */}
      <div className="p-4 rounded-lg bg-surface border border-border">
        <p className="text-[12px] text-muted leading-relaxed">
          Quality scoring is calculated by the RSS Scanner during each GitHub Actions run. Changes to scoring weights require updating the fetch script (scripts/fetch-reddit.mjs). The settings above are displayed for transparency — editing them in the UI is coming in a future update.
        </p>
      </div>
    </div>
  );

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
          A brief description of Merchynt that Rosie uses for context when drafting responses.
        </p>
        <textarea
          value={productKnowledge.companyOverview}
          onChange={e => setProductKnowledge(prev => ({ ...prev, companyOverview: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
        />
      </section>

      {/* Products */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Products</h2>
          </div>
          <button
            onClick={addProduct}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-[12px] font-medium hover:bg-navy/90 transition-colors"
          >
            <Plus size={13} />
            Add Product
          </button>
        </div>
        <p className="text-[13px] text-muted mb-5">
          Products and services that Rosie can reference in draft responses.
        </p>

        <div className="space-y-5">
          {productKnowledge.products.map(product => (
            <div key={product.id} className="border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={product.name}
                  onChange={e => updateProduct(product.id, 'name', e.target.value)}
                  placeholder="Product name"
                  className="text-[15px] font-semibold text-dark bg-transparent border-none focus:outline-none placeholder:text-muted/60"
                />
                <button
                  onClick={() => removeProduct(product.id)}
                  className="text-muted hover:text-dark transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1.5">Description</label>
                  <textarea
                    value={product.description}
                    onChange={e => updateProduct(product.id, 'description', e.target.value)}
                    rows={2}
                    placeholder="What does this product do?"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1.5">Key Features</label>
                  <textarea
                    value={product.keyFeatures}
                    onChange={e => updateProduct(product.id, 'keyFeatures', e.target.value)}
                    rows={4}
                    placeholder="List key features (one per line with - prefix)"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1.5">Pricing</label>
                  <textarea
                    value={product.pricing}
                    onChange={e => updateProduct(product.id, 'pricing', e.target.value)}
                    rows={3}
                    placeholder="Pricing tiers and details"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60"
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
          Key competitors and differentiators that Rosie should understand.
        </p>
        <textarea
          value={productKnowledge.competitorContext}
          onChange={e => setProductKnowledge(prev => ({ ...prev, competitorContext: e.target.value }))}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
        />
      </section>

      {/* Key Stats */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Key Stats & Proof Points</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Case study results and data points that Rosie can reference in drafts.
        </p>
        <textarea
          value={productKnowledge.keyStats}
          onChange={e => setProductKnowledge(prev => ({ ...prev, keyStats: e.target.value }))}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
        />
      </section>

      {/* Save */}
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
      {/* Brand Name */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Brand Identity</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Core brand information that shapes all corporate-voice drafts.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1.5">Brand Name</label>
            <input
              type="text"
              value={brandVoice.brandName}
              onChange={e => setBrandVoice(prev => ({ ...prev, brandName: e.target.value }))}
              className="w-full max-w-[300px] px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1.5">Brand Voice Description</label>
            <textarea
              value={brandVoice.voiceDescription}
              onChange={e => setBrandVoice(prev => ({ ...prev, voiceDescription: e.target.value }))}
              rows={4}
              placeholder="Describe your brand's overall tone and personality..."
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60"
            />
          </div>
        </div>
      </section>

      {/* Reddit-Specific Guidelines */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Reddit-Specific Guidelines</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Rules specific to how the brand engages on Reddit.
        </p>
        <textarea
          value={brandVoice.redditGuidelines}
          onChange={e => setBrandVoice(prev => ({ ...prev, redditGuidelines: e.target.value }))}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
        />
      </section>

      {/* Topics to Avoid */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Topics to Avoid</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Sensitive topics or areas where Rosie should not draft responses.
        </p>
        <textarea
          value={brandVoice.topicsToAvoid}
          onChange={e => setBrandVoice(prev => ({ ...prev, topicsToAvoid: e.target.value }))}
          rows={5}
          className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
        />
      </section>

      {/* Approved Terminology */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Approved Terminology</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Preferred terms and phrases that Rosie should use (and common mistakes to avoid).
        </p>
        <textarea
          value={brandVoice.approvedTerminology}
          onChange={e => setBrandVoice(prev => ({ ...prev, approvedTerminology: e.target.value }))}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
        />
      </section>

      {/* Sample Responses */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Sample Responses</h2>
          </div>
        </div>
        <p className="text-[13px] text-muted mb-5">
          Example responses that demonstrate the ideal brand voice on Reddit.
        </p>

        <div className="space-y-4">
          {brandVoice.sampleResponses.map((response, index) => (
            <div key={index} className="relative border border-border rounded-lg">
              <textarea
                value={response}
                onChange={e => updateSampleResponse(index, e.target.value)}
                rows={5}
                className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-white rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 pr-10"
              />
              <button
                onClick={() => removeSampleResponse(index)}
                className="absolute top-3 right-3 text-muted hover:text-dark transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          {/* Add new sample response */}
          <div className="border border-dashed border-border rounded-lg p-4">
            <textarea
              value={newSampleResponse}
              onChange={e => setNewSampleResponse(e.target.value)}
              rows={4}
              placeholder="Paste or write an example response that demonstrates your brand voice..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60 mb-3"
            />
            <button
              onClick={addSampleResponse}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-[12px] font-medium hover:bg-navy/90 transition-colors"
            >
              <Plus size={13} />
              Add Sample
            </button>
          </div>
        </div>
      </section>

      {/* Save */}
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
      {/* Add Creator button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-dark">Creator Profiles</h2>
          <p className="text-[13px] text-muted mt-0.5">
            Individual style guides for personal Reddit accounts. Each creator gets their own voice settings.
          </p>
        </div>
        <button
          onClick={addCreator}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors"
        >
          <Plus size={14} />
          Add Creator
        </button>
      </div>

      {/* Creator Cards */}
      {creators.map(creator => (
        <section key={creator.id} className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-navy" />
              <h3 className="text-[15px] font-semibold text-dark">
                {creator.name || 'New Creator'}
              </h3>
              {creator.redditUsername && (
                <span className="text-[12px] text-muted font-medium">{creator.redditUsername}</span>
              )}
            </div>
            <button
              onClick={() => removeCreator(creator.id)}
              className="text-muted hover:text-dark transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Name</label>
              <input
                type="text"
                value={creator.name}
                onChange={e => updateCreator(creator.id, 'name', e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Reddit Username</label>
              <input
                type="text"
                value={creator.redditUsername}
                onChange={e => updateCreator(creator.id, 'redditUsername', e.target.value)}
                placeholder="u/username"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Role</label>
              <input
                type="text"
                value={creator.role}
                onChange={e => updateCreator(creator.id, 'role', e.target.value)}
                placeholder="e.g. VP Marketing"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Voice Description</label>
              <textarea
                value={creator.voiceDescription}
                onChange={e => updateCreator(creator.id, 'voiceDescription', e.target.value)}
                rows={3}
                placeholder="How does this person write? Their tone, personality, style..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Reddit Persona Notes</label>
              <textarea
                value={creator.redditPersonaNotes}
                onChange={e => updateCreator(creator.id, 'redditPersonaNotes', e.target.value)}
                rows={4}
                placeholder="Specific instructions for how this person posts on Reddit..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Topics of Expertise</label>
              <textarea
                value={creator.topicsOfExpertise}
                onChange={e => updateCreator(creator.id, 'topicsOfExpertise', e.target.value)}
                rows={3}
                placeholder="What subjects is this person credible on?"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-muted/60"
              />
            </div>
          </div>
        </section>
      ))}

      {creators.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Users size={32} className="text-muted mx-auto mb-3" />
          <p className="text-[14px] text-muted">No creator profiles yet. Add one to get started.</p>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button className="px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );

  // --- Render Integrations Tab ---
  // Spending data
  const [spending, setSpending] = useState<{
    last24h: { totalCost: number; apiCalls: number; inputTokens: number; outputTokens: number; webSearches: number };
    last7d: { totalCost: number; apiCalls: number; inputTokens: number; outputTokens: number; webSearches: number };
    last30d: { totalCost: number; apiCalls: number; inputTokens: number; outputTokens: number; webSearches: number };
    byCallType: Record<string, { calls: number; cost: number }>;
  } | null>(null);

  useState(() => {
    fetch('/api/spending')
      .then(res => res.json())
      .then(data => { if (!data.error) setSpending(data); })
      .catch(() => {});
  });

  const renderIntegrationsTab = () => (
    <div className="space-y-8">
      {/* API Connections */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Plug size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">API Connections</h2>
        </div>
        <p className="text-[13px] text-muted mb-5">
          Manage connections to external services that Rosie uses.
        </p>

        <div className="space-y-3">
          {/* Reddit API */}
          <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${integrations.redditApi === 'connected' ? 'bg-green' : 'bg-orange'}`} />
              <div>
                <p className="text-[13px] font-medium text-dark">Reddit API</p>
                <p className="text-[12px] text-muted">
                  {integrations.redditApi === 'connected' ? 'Connected and monitoring' : 'Not connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {integrations.redditApi === 'connected' ? (
                <CircleCheck size={16} className="text-green" />
              ) : (
                <CircleX size={16} className="text-orange" />
              )}
              <button className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium text-dark hover:bg-surface transition-colors">
                Configure
              </button>
            </div>
          </div>

          {/* Claude API */}
          <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${integrations.claudeApi === 'connected' ? 'bg-green' : 'bg-orange'}`} />
              <div>
                <p className="text-[13px] font-medium text-dark">Claude API</p>
                <p className="text-[12px] text-muted">
                  {integrations.claudeApi === 'connected' ? 'Connected — generates drafts' : 'Not connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {integrations.claudeApi === 'connected' ? (
                <CircleCheck size={16} className="text-green" />
              ) : (
                <CircleX size={16} className="text-orange" />
              )}
              <button className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium text-dark hover:bg-surface transition-colors">
                Configure
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Reddit Accounts */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Users size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Reddit Accounts</h2>
        </div>
        <p className="text-[13px] text-muted mb-5">
          Connect Reddit accounts for posting and analytics. Each account authenticates independently via OAuth.
        </p>

        {/* Add account form */}
        <div className="p-4 rounded-lg bg-surface border border-border mb-4">
          <p className="text-[12px] font-semibold text-dark mb-3">Add Reddit Account</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              value={newRedditUsername}
              onChange={e => setNewRedditUsername(e.target.value)}
              placeholder="e.g. merchynt"
              className="px-3 py-2 rounded-lg border border-border bg-white text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
            />
            <input
              type="text"
              value={newRedditLabel}
              onChange={e => setNewRedditLabel(e.target.value)}
              placeholder="Display name"
              className="px-3 py-2 rounded-lg border border-border bg-white text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
            />
            <div className="flex items-center gap-2">
              <select
                value={newRedditType}
                onChange={e => setNewRedditType(e.target.value as 'brand' | 'personal')}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-white text-[13px] text-dark focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
              >
                <option value="brand">Brand</option>
                <option value="personal">Personal</option>
              </select>
              <button
                onClick={addRedditAccount}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors shrink-0"
              >
                <UserPlus size={14} />
                Add
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted">
            Adding an account registers it in Rosie. You will need to authenticate via OAuth to enable posting and analytics.
          </p>
        </div>

        {/* Account list */}
        {redditAccounts.length === 0 ? (
          <div className="py-8 text-center rounded-lg border border-dashed border-border">
            <Users size={24} className="text-muted mx-auto mb-2" />
            <p className="text-[13px] text-muted">No Reddit accounts added yet.</p>
            <p className="text-[12px] text-muted mt-1">Add an account above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {redditAccounts.map(account => (
              <div key={account.id} className="flex items-center justify-between py-3 px-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${account.status === 'connected' ? 'bg-green' : 'bg-muted'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-dark">{account.username}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        account.type === 'brand' ? 'bg-navy/10 text-navy' : 'bg-blue/10 text-blue'
                      }`}>
                        {account.type === 'brand' ? 'Brand' : 'Personal'}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted">{account.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Permission indicators */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-muted uppercase tracking-wider">Posting</p>
                      {account.permissions.posting ? (
                        <CircleCheck size={14} className="text-green mx-auto mt-0.5" />
                      ) : (
                        <CircleX size={14} className="text-muted mx-auto mt-0.5" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted uppercase tracking-wider">Analytics</p>
                      {account.permissions.analytics ? (
                        <CircleCheck size={14} className="text-green mx-auto mt-0.5" />
                      ) : (
                        <CircleX size={14} className="text-muted mx-auto mt-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2">
                    {account.status === 'connected' ? (
                      <span className="text-[11px] font-medium text-green">Connected</span>
                    ) : (
                      <button className="px-3 py-1.5 rounded-lg bg-navy text-white text-[12px] font-medium hover:bg-navy/90 transition-colors">
                        Connect
                      </button>
                    )}
                    <button
                      onClick={() => removeRedditAccount(account.id)}
                      className="p-1.5 rounded-md text-muted hover:text-dark hover:bg-surface transition-colors"
                      title="Remove account"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Slack Integration */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Slack Integration</h2>
        </div>
        <p className="text-[13px] text-muted mb-5">
          Connect Slack to receive real-time alerts and post conversation summaries to your team channels.
        </p>

        {/* Connection status */}
        <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <div>
              <p className="text-[13px] font-medium text-dark">Slack Workspace</p>
              <p className="text-[12px] text-muted">Not connected</p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-navy text-white text-[12px] font-medium hover:bg-navy/90 transition-colors">
            Connect Slack
          </button>
        </div>

        {/* Channel configuration */}
        <div className="p-4 rounded-lg bg-surface border border-border mb-4">
          <p className="text-[12px] font-semibold text-dark mb-3">Notification Channels</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-dark">New conversations</p>
                <p className="text-[11px] text-muted">Alert when Rosie finds high-relevance conversations</p>
              </div>
              <input
                type="text"
                placeholder="#rosie-alerts"
                disabled
                className="w-[160px] px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] text-muted placeholder:text-muted/60 disabled:opacity-50"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-dark">Daily digest</p>
                <p className="text-[11px] text-muted">Summary of conversations found and actions taken</p>
              </div>
              <input
                type="text"
                placeholder="#rosie-digest"
                disabled
                className="w-[160px] px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] text-muted placeholder:text-muted/60 disabled:opacity-50"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-dark">Performance alerts</p>
                <p className="text-[11px] text-muted">Notify when a post crosses a score threshold</p>
              </div>
              <input
                type="text"
                placeholder="#rosie-wins"
                disabled
                className="w-[160px] px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] text-muted placeholder:text-muted/60 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Alert preferences */}
        <div className="p-4 rounded-lg bg-surface border border-border">
          <p className="text-[12px] font-semibold text-dark mb-3">Alert Preferences</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-dark">Minimum relevance score for alerts</span>
              <span className="text-[13px] font-medium text-navy">80+</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-dark">Include draft preview in alert</span>
              <button
                disabled
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-border opacity-50"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-dark">Quiet hours (no alerts)</span>
              <span className="text-[13px] text-muted">10pm - 7am</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted mt-3">
          Connect your Slack workspace to configure channels and alert preferences.
        </p>
      </section>

      {/* Email Notifications */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Email Notifications</h2>
        </div>
        <p className="text-[13px] text-muted mb-5">
          Receive email digests and alerts about Reddit activity.
        </p>

        <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border">
          <div>
            <p className="text-[13px] font-medium text-dark">Daily Digest</p>
            <p className="text-[12px] text-muted">Summary of new conversations, responses posted, and performance highlights.</p>
          </div>
          <button
            onClick={() => setIntegrations(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              integrations.emailNotifications ? 'bg-navy' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                integrations.emailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Claude API Spending */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Claude API Spending</h2>
        </div>
        <p className="text-[13px] text-muted mb-4">
          Token usage and costs for AI draft generation, humanization, and re-rolls.
        </p>

        {spending ? (
          <>
            {/* Period cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Last 24 Hours', data: spending.last24h },
                { label: 'Last 7 Days', data: spending.last7d },
                { label: 'Last 30 Days', data: spending.last30d },
              ].map(({ label, data }) => (
                <div key={label} className="p-4 rounded-lg border border-border">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">{label}</p>
                  <p className="text-[22px] font-bold text-dark">${data.totalCost.toFixed(2)}</p>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[11px] text-muted">{data.apiCalls} API calls</p>
                    <p className="text-[11px] text-muted">{(data.inputTokens + data.outputTokens).toLocaleString()} tokens</p>
                    {data.webSearches > 0 && (
                      <p className="text-[11px] text-muted">{data.webSearches} web searches</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Breakdown by type */}
            {Object.keys(spending.byCallType).length > 0 && (
              <div className="p-4 rounded-lg bg-surface border border-border">
                <p className="text-[12px] font-semibold text-dark mb-2">Cost Breakdown (30 days)</p>
                <div className="space-y-1.5">
                  {Object.entries(spending.byCallType)
                    .sort((a, b) => b[1].cost - a[1].cost)
                    .map(([type, data]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-[12px] text-dark">{type}</span>
                        <span className="text-[12px] text-muted">
                          {data.calls} calls -- ${data.cost.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-[13px] text-muted">No usage data available yet. Costs will appear after generating your first AI draft.</p>
        )}
      </section>

      {/* Data Management */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Database size={18} className="text-navy" />
          <h2 className="text-[16px] font-semibold text-dark">Data Management</h2>
        </div>
        <p className="text-[13px] text-muted mb-5">
          Export or clear your conversation history and settings.
        </p>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium text-dark hover:bg-surface transition-colors">
            Export Data
          </button>
          <button className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium text-dark hover:bg-surface transition-colors">
            Clear History
          </button>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button className="px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );

  // --- Main render ---
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'monitoring': return renderMonitoringTab();
      case 'quality': return renderQualityTab();
      case 'integrations': return renderIntegrationsTab();
    }
  };

  return (
    <div className="p-8 max-w-[900px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Settings</h1>
        <p className="text-[13px] text-muted mt-1">
          Configure what Rosie monitors, how drafts are generated, and manage integrations.
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-navy text-white'
                  : 'text-muted hover:text-dark hover:bg-surface'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {renderActiveTab()}
    </div>
  );
}
