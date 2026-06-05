'use client';

import { useState, useEffect } from 'react';
import { mockCreatorProfiles } from '@/lib/mock-data';
import { CreatorProfile } from '@/lib/types';
import { useSaveStatus } from '@/lib/knowledgebase';
import { Users, ChevronDown, ChevronUp, Loader2, Check, Plus, Trash2 } from 'lucide-react';

export default function CreatorProfilesPage() {
  const [creators, setCreators] = useState<CreatorProfile[]>(mockCreatorProfiles);
  const [expandedCreators, setExpandedCreators] = useState<Set<string>>(new Set());
  const { saveStatus, save } = useSaveStatus();
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('');

  const addCreator = async () => {
    if (!newName.trim() || !newRole.trim()) return;
    const newCreator: CreatorProfile = {
      id: String(Date.now()),
      name: newName,
      redditUsername: newUsername.startsWith('u/') ? newUsername : `u/${newUsername}`,
      role: newRole,
      voiceDescription: '',
      redditPersonaNotes: '',
      topicsOfExpertise: '',
    };
    const updated = [...creators, newCreator];
    setCreators(updated);
    setNewName('');
    setNewUsername('');
    setNewRole('');
    setExpandedCreators(prev => new Set(prev).add(newCreator.id));
    await save({ creator_profiles: updated });
  };

  const removeCreator = async (id: string) => {
    const updated = creators.filter(c => c.id !== id);
    setCreators(updated);
    await save({ creator_profiles: updated });
  };

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
          Individual voice profiles for personal Reddit accounts. Each creator gets unique drafts tailored to their voice and expertise.
        </p>
      </div>

      {/* Add Creator */}
      <div className="p-4 rounded-xl bg-white border border-border mb-6">
        <p className="text-[12px] font-semibold text-dark mb-3">Add Creator</p>
        <div className="grid grid-cols-3 gap-3 mb-2">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20" />
          <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Reddit username" className="px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20" />
          <div className="flex items-center gap-2">
            <input type="text" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Role (e.g., CEO)" className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-navy/20" />
            <button onClick={addCreator} disabled={!newName.trim() || !newRole.trim()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy text-white text-[13px] font-medium hover:bg-navy/90 transition-colors shrink-0 disabled:opacity-50">
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
        <p className="text-[11px] text-muted">New creators are automatically expanded so you can configure their voice right away.</p>
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

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => removeCreator(creator.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-pink text-white text-[13px] font-medium hover:bg-pink/90 transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete Creator
                      </button>
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
