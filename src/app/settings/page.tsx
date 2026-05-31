'use client';

import { useState } from 'react';
import { mockSubreddits, mockKeywords, mockStyleGuides } from '@/lib/mock-data';
import { MonitoredSubreddit, MonitoredKeyword } from '@/lib/types';
import { Plus, X, Hash, Search, FileText } from 'lucide-react';

export default function SettingsPage() {
  const [subreddits, setSubreddits] = useState<MonitoredSubreddit[]>(mockSubreddits);
  const [keywords, setKeywords] = useState<MonitoredKeyword[]>(mockKeywords);
  const [newSubreddit, setNewSubreddit] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

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

  return (
    <div className="p-8 max-w-[900px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Settings</h1>
        <p className="text-[13px] text-muted mt-1">
          Configure what Rosie monitors and how drafts are generated.
        </p>
      </div>

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

          {/* Add new */}
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

          {/* List */}
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

          {/* Add new */}
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

          {/* Keyword tags */}
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

        {/* Style Guides */}
        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Style Guides</h2>
          </div>
          <p className="text-[13px] text-muted mb-5">
            These guides shape how Rosie drafts responses for each voice.
          </p>

          <div className="space-y-4">
            {mockStyleGuides.map(guide => (
              <div key={guide.id} className="border border-border rounded-lg">
                <div className="px-4 py-3 border-b border-border bg-surface/50 rounded-t-lg">
                  <h3 className="text-[14px] font-semibold text-dark">{guide.name}</h3>
                  <p className="text-[12px] text-muted">{guide.description}</p>
                </div>
                <textarea
                  defaultValue={guide.content}
                  rows={8}
                  className="w-full px-4 py-3 text-[13px] text-dark leading-relaxed bg-white rounded-b-lg resize-y focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <button className="px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
