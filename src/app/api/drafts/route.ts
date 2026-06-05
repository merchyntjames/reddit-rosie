import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDrafts, rerollDraft } from '@/lib/drafts';
import {
  mockProductKnowledge,
  mockBrandVoice,
  mockCreatorProfiles,
} from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Multi-creator + web search + humanization can take time

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Load knowledgebase from Supabase (fall back to mock data)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadKnowledgebase(supabase: any) {
  let product = mockProductKnowledge;
  let voice = mockBrandVoice;
  let creators = mockCreatorProfiles;

  if (supabase) {
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['product_knowledge', 'brand_voice', 'creator_profiles']);

    if (settings) {
      for (const row of settings as { key: string; value: unknown }[]) {
        if (row.key === 'product_knowledge' && row.value) product = row.value as typeof product;
        if (row.key === 'brand_voice' && row.value) voice = row.value as typeof voice;
        if (row.key === 'creator_profiles' && row.value && Array.isArray(row.value) && row.value.length > 0) {
          creators = row.value;
        }
      }
    }
  }

  return {
    brand: {
      companyOverview: product.companyOverview,
      products: product.products,
      competitorContext: product.competitorContext,
      keyStats: product.keyStats,
      brandVoice: voice.voiceDescription,
      audienceDescription: voice.audienceDescription || '',
      redditGuidelines: voice.redditGuidelines,
      topicsToAvoid: voice.topicsToAvoid,
      approvedTerminology: voice.approvedTerminology,
      sampleResponses: voice.sampleResponses,
    },
    creators: creators.map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      voiceDescription: c.voiceDescription,
      redditPersonaNotes: c.redditPersonaNotes,
      topicsOfExpertise: c.topicsOfExpertise,
    })),
  };
}

// POST: Generate drafts, re-roll, or submit training
export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Claude API key not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { action } = body as { action?: string };

    const supabase = getSupabase();

    // --- RE-ROLL ---
    if (action === 'reroll') {
      const { conversationId, draftType, creatorId, previousDraft, feedback } = body;

      let postTitle = '', postBody = '', subreddit = '', postAuthor = '';
      if (supabase) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('title, selftext, subreddit, author_username')
          .eq('id', conversationId)
          .single();
        if (conv) {
          postTitle = conv.title;
          postBody = conv.selftext || '';
          subreddit = conv.subreddit;
          postAuthor = conv.author_username;
        }
      }

      const kb = await loadKnowledgebase(supabase);
      const creator = draftType === 'personal' && creatorId
        ? kb.creators.find(c => c.id === creatorId) || null
        : null;

      const newDraft = await rerollDraft(
        { postTitle, postBody, subreddit, postAuthor },
        kb.brand,
        creator,
        previousDraft,
        feedback,
      );

      // Save new version to database
      if (supabase) {
        // Get current max version
        const { data: existing } = await supabase
          .from('conversation_drafts')
          .select('version')
          .eq('conversation_id', conversationId)
          .eq('draft_type', draftType)
          .eq('creator_id', creatorId || '')
          .order('version', { ascending: false })
          .limit(1);

        const nextVersion = (existing?.[0]?.version ?? 0) + 1;

        await supabase.from('conversation_drafts').insert({
          conversation_id: conversationId,
          draft_type: draftType,
          creator_id: creatorId || null,
          creator_name: creator?.name || 'Merchynt Response',
          content: newDraft,
          version: nextVersion,
          reroll_feedback: feedback,
        });
      }

      return NextResponse.json({ content: newDraft });
    }

    // --- TRAIN ---
    if (action === 'train') {
      const { conversationId, draftType, creatorId, originalDraft, rewrittenDraft } = body;

      if (supabase) {
        await supabase.from('training_submissions').insert({
          conversation_id: conversationId,
          draft_type: draftType,
          creator_id: creatorId || null,
          original_draft: originalDraft,
          rewritten_draft: rewrittenDraft,
        });

        await supabase.from('activity_log').insert({
          action: 'trained',
          conversation_id: conversationId,
          details: `Training submission for ${draftType === 'corporate' ? 'Merchynt Response' : `creator ${creatorId}`}`,
        });
      }

      return NextResponse.json({ success: true });
    }

    // --- GENERATE ---
    const { conversationId } = body;
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    // Check for existing drafts
    if (supabase) {
      const { data: existingDrafts } = await supabase
        .from('conversation_drafts')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('version', { ascending: false });

      if (existingDrafts && existingDrafts.length > 0) {
        // Return latest version of each draft
        const latest = new Map<string, typeof existingDrafts[0]>();
        for (const d of existingDrafts) {
          const key = `${d.draft_type}-${d.creator_id || 'corporate'}`;
          if (!latest.has(key)) latest.set(key, d);
        }
        return NextResponse.json({
          drafts: [...latest.values()].map(d => ({
            draftType: d.draft_type,
            creatorId: d.creator_id,
            creatorName: d.creator_name,
            content: d.content,
            version: d.version,
          })),
          cached: true,
        });
      }
    }

    // Get conversation details
    let postTitle = '', postBody = '', subreddit = '', postAuthor = '';
    if (supabase) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('title, selftext, subreddit, author_username')
        .eq('id', conversationId)
        .single();
      if (!conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      postTitle = conv.title;
      postBody = conv.selftext || '';
      subreddit = conv.subreddit;
      postAuthor = conv.author_username;
    }

    const kb = await loadKnowledgebase(supabase);

    // Generate all drafts
    const drafts = await generateDrafts(
      { postTitle, postBody, subreddit, postAuthor },
      kb.brand,
      kb.creators,
    );

    // Save to database
    if (supabase) {
      await supabase.from('conversation_drafts').insert(
        drafts.map(d => ({
          conversation_id: conversationId,
          draft_type: d.draftType,
          creator_id: d.creatorId,
          creator_name: d.creatorName,
          content: d.content,
          version: 1,
        }))
      );

      await supabase.from('activity_log').insert({
        action: 'drafted',
        conversation_id: conversationId,
        subreddit,
        post_title: postTitle,
        details: `Generated ${drafts.length} drafts (1 corporate + ${drafts.length - 1} personal)`,
      });
    }

    return NextResponse.json({
      drafts: drafts.map(d => ({
        draftType: d.draftType,
        creatorId: d.creatorId,
        creatorName: d.creatorName,
        content: d.content,
        version: 1,
      })),
      cached: false,
    });
  } catch (error) {
    console.error('Draft generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate drafts', details: String(error) },
      { status: 500 }
    );
  }
}
