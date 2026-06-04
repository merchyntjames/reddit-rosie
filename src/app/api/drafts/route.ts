import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDrafts } from '@/lib/drafts';
import {
  mockProductKnowledge,
  mockBrandVoice,
  mockCreatorProfiles,
} from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Opus + web search can take up to 60s

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// POST: Generate drafts for a conversation
export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 503 }
      );
    }

    const { conversationId } = await request.json() as { conversationId: string };
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get conversation from Supabase
    let postTitle = '';
    let postBody = '';
    let subreddit = '';
    let postAuthor = '';

    if (supabase) {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('title, selftext, subreddit, author_username, corporate_draft, personal_draft')
        .eq('id', conversationId)
        .single();

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // If drafts already exist, return them without regenerating
      if (conversation.corporate_draft && conversation.personal_draft) {
        return NextResponse.json({
          corporate: conversation.corporate_draft,
          personal: conversation.personal_draft,
          cached: true,
        });
      }

      postTitle = conversation.title;
      postBody = conversation.selftext || '';
      subreddit = conversation.subreddit;
      postAuthor = conversation.author_username;
    }

    // Read knowledgebase from Supabase (fall back to mock data)
    let product = mockProductKnowledge;
    let voice = mockBrandVoice;
    let creator = mockCreatorProfiles[0];

    if (supabase) {
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['product_knowledge', 'brand_voice', 'creator_profiles']);

      if (settings) {
        for (const row of settings) {
          if (row.key === 'product_knowledge' && row.value) product = row.value;
          if (row.key === 'brand_voice' && row.value) voice = row.value;
          if (row.key === 'creator_profiles' && row.value && Array.isArray(row.value) && row.value.length > 0) {
            creator = row.value[0];
          }
        }
      }
    }

    // Generate drafts
    const { corporate, personal } = await generateDrafts({
      postTitle,
      postBody,
      subreddit,
      postAuthor,
      companyOverview: product.companyOverview,
      products: product.products,
      competitorContext: product.competitorContext,
      keyStats: product.keyStats,
      brandVoice: voice.voiceDescription,
      redditGuidelines: voice.redditGuidelines,
      topicsToAvoid: voice.topicsToAvoid,
      approvedTerminology: voice.approvedTerminology,
      sampleResponses: voice.sampleResponses,
      creatorName: creator.name,
      creatorRole: creator.role,
      creatorVoice: creator.voiceDescription,
      creatorPersonaNotes: creator.redditPersonaNotes,
      creatorExpertise: creator.topicsOfExpertise,
    });

    // Save drafts to Supabase
    if (supabase) {
      await supabase
        .from('conversations')
        .update({
          corporate_draft: corporate,
          personal_draft: personal,
        })
        .eq('id', conversationId);

      // Log the drafting event
      await supabase.from('activity_log').insert({
        action: 'drafted',
        conversation_id: conversationId,
        subreddit,
        post_title: postTitle,
        details: 'AI drafts generated (corporate + personal)',
      });
    }

    return NextResponse.json({
      corporate,
      personal,
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
