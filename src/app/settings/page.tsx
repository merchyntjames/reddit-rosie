'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Hash, Search, Loader2, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const [subreddits, setSubreddits] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newSubreddit, setNewSubreddit] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load from Supabase on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const s = data.settings;
        if (s?.monitored_subreddits && Array.isArray(s.monitored_subreddits)) {
          setSubreddits(s.monitored_subreddits);
        }
        if (s?.monitored_keywords && Array.isArray(s.monitored_keywords)) {
          setKeywords(s.monitored_keywords);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Save to Supabase
  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitored_subreddits: subreddits,
          monitored_keywords: keywords,
        }),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Subreddit helpers
  const addSubreddit = () => {
    if (!newSubreddit.trim()) return;
    // Normalize: strip r/, /, spaces, and lowercase
    const cleaned = newSubreddit.trim().replace(/^r\//, '').replace(/^\//, '').replace(/\s+/g, '');
    if (!cleaned || subreddits.includes(cleaned)) return;
    setSubreddits(prev => [...prev, cleaned]);
    setNewSubreddit('');
  };
  const removeSubreddit = (name: string) => setSubreddits(prev => prev.filter(s => s !== name));

  // Keyword helpers
  const addKeyword = () => {
    if (!newKeyword.trim() || keywords.includes(newKeyword.trim())) return;
    setKeywords(prev => [...prev, newKeyword.trim()]);
    setNewKeyword('');
  };
  const removeKeyword = (term: string) => setKeywords(prev => prev.filter(k => k !== term));

  return (
    <div className="p-4 sm:p-8 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Account Settings</h1>
        <p className="text-[13px] text-muted mt-1">
          Configure what Rosie monitors and where she looks for conversations. Changes take effect on the next daily scan (7 AM ET).
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-navy" />
        </div>
      ) : (
      <div className="space-y-8">
        {/* Subreddits */}
        <section className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <Hash size={18} className="text-navy" />
            <h2 className="text-[16px] font-semibold text-dark">Monitored Subreddits</h2>
            <span className="text-[12px] text-muted ml-auto">{subreddits.length} active</span>
          </div>
          <p className="text-[13px] text-muted mb-5">
            Rosie scans these subreddits daily for posts matching your keywords. Enter the subreddit name only (no r/ prefix needed).
          </p>

          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">r/</span>
              <input
                type="text"
                value={newSubreddit}
                onChange={e => setNewSubreddit(e.target.value.replace(/^r\//, ''))}
                onKeyDown={e => e.key === 'Enter' && addSubreddit()}
                placeholder="subreddit name (e.g., localseo)"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
              />
            </div>
            <button
              onClick={addSubreddit}
              disabled={!newSubreddit.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {subreddits.map(sub => (
              <div
                key={sub}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border bg-navy/5 border-navy/20 text-navy"
              >
                r/{sub}
                <button
                  onClick={() => removeSubreddit(sub)}
                  className="hover:text-dark ml-0.5"
                >
                  <X size={12} />
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
            <span className="text-[12px] text-muted ml-auto">{keywords.length} active</span>
          </div>
          <p className="text-[13px] text-muted mb-5">
            Posts containing these keywords are scored and surfaced in your queue. Used in both broad (all of Reddit) and narrow (specific subreddit) searches.
          </p>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
              placeholder="e.g., Google Business Profile"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
            />
            <button
              onClick={addKeyword}
              disabled={!newKeyword.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {keywords.map(kw => (
              <div
                key={kw}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border bg-navy/5 border-navy/20 text-navy"
              >
                {kw}
                <button
                  onClick={() => removeKeyword(kw)}
                  className="hover:text-dark ml-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
          >
            {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={14} /> : <Save size={14} />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error — try again' : 'Save Changes'}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
