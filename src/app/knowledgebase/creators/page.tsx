'use client';

import { useState, useEffect } from 'react';
import { mockCreatorProfiles } from '@/lib/mock-data';
import { CreatorProfile } from '@/lib/types';
import { useSaveStatus } from '@/lib/knowledgebase';
import { Users, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';

export default function CreatorProfilesPage() {
  const [creators, setCreators] = useState<CreatorProfile[]>(mockCreatorProfiles);
  const [expandedCreators, setExpandedCreators] = useState<Set<string>>(new Set());
  const { saveStatus, save } = useSaveStatus();

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.settings?.creator_profiles) setCreators(data.settings.creator_profiles);
    }).catch(() => {});
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedCreators(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-8 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Creator Profiles</h1>
        <p className="text-[13px] text-muted mt-1">
          Individual voice profiles for personal Reddit accounts. To add or remove creators, go to{' '}
          <a href="/settings" className="text-blue hover:text-navy underline">Account Settings</a>.
        </p>
      </div>

      {creators.length === 0 ? (
        <div className="py-8 text-center rounded-lg border border-dashed border-border">
          <Users size={24} className="text-muted mx-auto mb-2" />
          <p className="text-[13px] text-muted">No creator profiles yet.</p>
          <p className="text-[12px] text-muted mt-1">
            Add creators in <a href="/settings" className="text-blue hover:text-navy underline">Account Settings</a>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {creators.map((creator, index) => {
            const isExpanded = expandedCreators.has(creator.id);
            const hasVoice = !!creator.voiceDescription;

            return (
              <div key={creator.id} className="bg-white border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleExpanded(creator.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center">
                      <span className="text-white text-[11px] font-semibold">
                        {creator.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-dark">{creator.name}</h3>
                      <p className="text-[12px] text-muted">{creator.redditUsername} -- {creator.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${hasVoice ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                      {hasVoice ? 'Voice configured' : 'Needs voice setup'}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-muted">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                    <div>
                      <label className="text-[12px] font-medium text-dark block mb-1">Voice Description</label>
                      <p className="text-[11px] text-muted mb-2">How does this person write? What makes their voice distinctive?</p>
                      <textarea value={creator.voiceDescription} onChange={e => { const u = [...creators]; u[index] = { ...u[index], voiceDescription: e.target.value }; setCreators(u); }} placeholder="e.g., Casual and direct. Writes in short paragraphs. Uses dashes for emphasis." rows={3} className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-dark block mb-1">Reddit Persona Notes</label>
                      <p className="text-[11px] text-muted mb-2">How should this person come across specifically on Reddit?</p>
                      <textarea value={creator.redditPersonaNotes} onChange={e => { const u = [...creators]; u[index] = { ...u[index], redditPersonaNotes: e.target.value }; setCreators(u); }} placeholder="e.g., Frame product references as 'a tool I use'. Be opinionated." rows={4} className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-dark block mb-1">Topics of Expertise</label>
                      <p className="text-[11px] text-muted mb-2">What subjects is this person credible speaking about?</p>
                      <textarea value={creator.topicsOfExpertise} onChange={e => { const u = [...creators]; u[index] = { ...u[index], topicsOfExpertise: e.target.value }; setCreators(u); }} placeholder="e.g., Local SEO strategy, agency operations, AI search visibility" rows={4} className="w-full px-3 py-2 text-[13px] text-dark bg-surface rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-navy/20" />
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => save({ creator_profiles: creators })} disabled={saveStatus === 'saving'} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
                        {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
                        {saveStatus === 'saved' && <Check size={14} />}
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error — try again' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
