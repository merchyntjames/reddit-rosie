import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// --- Pricing (USD per token) ---
const PRICING = {
  'claude-opus-4-6': { input: 5 / 1_000_000, output: 25 / 1_000_000 },
  'claude-sonnet-4-6': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
};
const WEB_SEARCH_COST = 10 / 1_000; // $10 per 1,000 searches

function getUsageSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function logUsage(
  callType: string,
  conversationId: string | null,
  model: string,
  result: Anthropic.Message,
) {
  const supabase = getUsageSupabase();
  if (!supabase) return;

  const inputTokens = result.usage?.input_tokens ?? 0;
  const outputTokens = result.usage?.output_tokens ?? 0;
  const usageAny = result.usage as unknown as Record<string, unknown>;
  const searchRequests = usageAny?.server_tool_use
    ? (usageAny.server_tool_use as Record<string, number>)?.web_search_requests ?? 0
    : 0;

  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-opus-4-6'];
  const inputCost = inputTokens * pricing.input;
  const outputCost = outputTokens * pricing.output;
  const searchCost = searchRequests * WEB_SEARCH_COST;

  await supabase.from('api_usage').insert({
    call_type: callType,
    conversation_id: conversationId,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    web_search_requests: searchRequests,
    input_cost: inputCost,
    output_cost: outputCost,
    search_cost: searchCost,
    total_cost: inputCost + outputCost + searchCost,
  }).then(({ error }) => { if (error) console.error('Usage log error:', error); });
}

// --- Types ---

interface BrandContext {
  companyOverview: string;
  products: { name: string; description: string; keyFeatures: string }[];
  competitorContext: string;
  keyStats: string;
  brandVoice: string;
  redditGuidelines: string;
  topicsToAvoid: string;
  approvedTerminology: string;
  sampleResponses: string[];
}

interface CreatorContext {
  id: string;
  name: string;
  role: string;
  voiceDescription: string;
  redditPersonaNotes: string;
  topicsOfExpertise: string;
}

interface PostContext {
  postTitle: string;
  postBody: string;
  subreddit: string;
  postAuthor: string;
}

export interface GeneratedDraft {
  draftType: 'corporate' | 'personal';
  creatorId: string | null;
  creatorName: string;
  content: string;
}

// --- System Prompts ---

function buildCorporateSystemPrompt(brand: BrandContext): string {
  return `You are drafting a Reddit reply on behalf of the Merchynt brand account. Your goal is to add genuine value to the conversation while subtly raising awareness of Merchynt and its products when naturally relevant.

## Company Context
${brand.companyOverview}

## Products
${brand.products.map(p => `### ${p.name}\n${p.description}\n${p.keyFeatures}`).join('\n\n')}

## Competitor Landscape
${brand.competitorContext}

## Key Stats & Proof Points
${brand.keyStats}

## Brand Voice
${brand.brandVoice}

## Reddit-Specific Guidelines
${brand.redditGuidelines}

## Topics to Avoid
${brand.topicsToAvoid}

## Approved Terminology
${brand.approvedTerminology}

## Example Responses (for tone reference only — do not copy)
${brand.sampleResponses.map((r, i) => `Example ${i + 1}:\n${r}`).join('\n\n')}

## Your Task
Write a reply to the Reddit post below. Use we/us/our pronouns (you are representing Merchynt as a company).

Rules:
- Lead with genuine value and insight FIRST, product mention SECOND (if at all)
- Only mention Merchynt/Paige if it's naturally relevant to the conversation
- If the post is asking a general question, answer it helpfully — do not force a product plug
- If a competitor is mentioned, acknowledge their strengths before differentiating
- Disclose affiliation if you mention Merchynt: "Full transparency — I'm from the Merchynt team"
- Keep it concise — aim for 100-200 words. Reddit rewards substance, not length
- No emojis. No marketing fluff. No "game-changer" or "revolutionary"
- Write in short paragraphs. Use line breaks between thoughts
- Match the tone of the subreddit (technical subreddits expect more depth, general ones expect simpler language)`;
}

function buildPersonalSystemPrompt(brand: BrandContext, creator: CreatorContext): string {
  return `You are drafting a Reddit reply as ${creator.name} (${creator.role} at Merchynt), posting from a personal account. Your goal is to be a helpful, knowledgeable community member who happens to work in local SEO.

## About You
Name: ${creator.name}
Role: ${creator.role}
Voice: ${creator.voiceDescription}

## Your Reddit Persona
${creator.redditPersonaNotes}

## Your Areas of Expertise
${creator.topicsOfExpertise}

## Company Context (for accuracy — not for pitching)
${brand.companyOverview}

## Products You Use Daily
${brand.products.map(p => `- ${p.name}: ${p.description}`).join('\n')}

## Key Stats You Can Reference
${brand.keyStats}

## Topics to Avoid
${brand.topicsToAvoid}

## Approved Terminology
${brand.approvedTerminology}

## Your Task
Write a reply to the Reddit post below. Use I/me/my pronouns (you are posting as an individual, not a brand).

Rules:
- Write like you're talking to a peer in the industry, not a prospect
- Share personal experience and opinions freely
- If mentioning Merchynt/Paige, frame as "a tool I use" or "what my team built" — never "our product"
- Ask follow-up questions to show genuine interest in the poster's situation
- Be opinionated — Reddit respects people who take a stance
- Acknowledge tradeoffs honestly. If a competitor is genuinely better for the use case, say so
- Keep it under 200 words. Short paragraphs. Conversational tone
- No emojis. Mild profanity okay (damn, hell) but never aggressive
- Match the energy of the subreddit`;
}

// --- Humanization Pass ---

const HUMANIZATION_SYSTEM_PROMPT = `You are an editorial pass. You receive a Reddit comment draft that has already been written in a specific brand or personal voice. Your job is to make it read like a thoughtful person with a real point of view wrote it — more specific, more grounded, less templated — without changing meaning, voice, or inventing anything.

## Authority Order (resolve every conflict by this)
1. Accuracy & truthfulness — never trade correctness for naturalness
2. The writer's voice and style — the draft already reflects their brand/personal voice. PRESERVE it. Do not flatten it into generic internet writing
3. This humanization pass — refine, don't override

## What to fix
- Scan for passages that are generic, overly smooth, or templated
- Replace broad claims that could appear in 1,000 similar comments with something specific
- Cut excessive transitions: "furthermore," "moreover," "additionally," "it is important to note," "overall," "in conclusion," "this underscores," "this highlights"
- Remove inflated vocabulary: "delve," "landscape," "robust," "seamless," "leverage," "elevate," "unlock," "navigate," "foster," "showcase," "comprehensive," "empower," "innovative," "revolutionize," "game-changing," "cutting-edge" — use simpler words unless the writer's style guide prefers the ornate term
- If a sentence could apply to any company in any industry, sharpen it with a specific opinion, constraint, tradeoff, or example from the context provided
- Replace abstraction with concrete meaning ("this drives efficiency" → say what specifically becomes faster/easier)

## Rhythm
- Vary sentence length: mix short (8 words or fewer), medium, and occasional long (25+ words)
- Avoid 3+ consecutive sentences of similar length
- Use fragments for emphasis where natural
- One-sentence paragraphs are fine
- Don't make every paragraph follow the same Claim then Explanation then Example then Conclusion pattern

## What NOT to do
- Do NOT change the writer's voice, pronouns, or perspective
- Do NOT add facts, examples, quotes, numbers, or stories that weren't in the original draft
- Do NOT add emojis
- Do NOT make the writing sloppy or force casualness
- Do NOT over-stuff with "honestly," "look," "here's the thing," "real talk," "not gonna lie"
- Do NOT change any names, products, URLs, statistics, or specific claims
- Do NOT expand the length — if anything, tighten it
- Do NOT add a generic summary conclusion. If the draft ends with one, replace it with a useful final thought, specific recommendation, or a question
- Do NOT optimize for AI detectors. The goal is genuinely better writing, not detection evasion

## Output
Return ONLY the improved draft. No preamble, no commentary. Just the final Reddit comment text.`;

async function humanize(draft: string, conversationId?: string): Promise<string> {
  const result = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: HUMANIZATION_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Here is a Reddit comment draft to humanize. Preserve the voice and meaning. Make it read like a real person wrote it.\n\n---\n\n${draft}`,
    }],
  });

  await logUsage('humanize', conversationId || null, 'claude-opus-4-6', result);

  const humanized = result.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n');

  return humanized || draft;
}

// --- Main Generation ---

function buildUserMessage(post: PostContext): string {
  return `## Reddit Post to Reply To

**Subreddit:** r/${post.subreddit}
**Title:** ${post.postTitle}
**Posted by:** ${post.postAuthor}

**Post Body:**
${post.postBody || '(no body text — title only)'}

Before writing your reply, use web search to research the topic so your response is grounded in current, accurate information. Search for:
1. The specific topic being discussed (current best practices, recent changes, latest data)
2. Any tools, services, or techniques mentioned in the post (verify claims, check current status)

After researching, write your reply. Just the reply text — no preamble, no "Here's my reply:", no "Based on my research:", just the actual comment you'd post on Reddit. The reply should reflect current knowledge without explicitly saying "I searched for this."`;
}

function extractText(result: Anthropic.Message): string {
  return result.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n');
}

export async function generateDrafts(
  post: PostContext,
  brand: BrandContext,
  creators: CreatorContext[],
): Promise<GeneratedDraft[]> {
  const userMessage = buildUserMessage(post);

  const webSearchTool = {
    type: 'web_search_20250305' as const,
    name: 'web_search' as const,
    max_uses: 3,
  };

  // Step 1: Generate all voice-specific drafts in parallel
  const draftPromises: Promise<{ draft: GeneratedDraft; raw: string }>[] = [];

  // We need the conversation ID for usage logging — passed via closure
  const convId = post.postTitle; // Will be replaced with real ID in the API route

  // Corporate draft
  draftPromises.push(
    anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: buildCorporateSystemPrompt(brand),
      tools: [webSearchTool],
      messages: [{ role: 'user', content: userMessage }],
    }).then(async result => {
      await logUsage('draft_corporate', null, 'claude-opus-4-6', result);
      return {
        draft: { draftType: 'corporate' as const, creatorId: null, creatorName: 'Merchynt Response', content: '' },
        raw: extractText(result),
      };
    })
  );

  // Personal drafts — one per creator
  for (const creator of creators) {
    draftPromises.push(
      anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        system: buildPersonalSystemPrompt(brand, creator),
        tools: [webSearchTool],
        messages: [{ role: 'user', content: userMessage }],
      }).then(async result => {
        await logUsage(`draft_personal_${creator.id}`, null, 'claude-opus-4-6', result);
        return {
          draft: { draftType: 'personal' as const, creatorId: creator.id, creatorName: creator.name, content: '' },
          raw: extractText(result),
        };
      })
    );
  }

  const rawResults = await Promise.all(draftPromises);

  // Step 2: Humanization pass on all drafts in parallel
  const humanized = await Promise.all(
    rawResults.map(async ({ draft, raw }) => ({
      ...draft,
      content: await humanize(raw, convId),
    }))
  );

  return humanized;
}

// --- Re-Roll ---

export async function rerollDraft(
  post: PostContext,
  brand: BrandContext,
  creator: CreatorContext | null,
  previousDraft: string,
  feedback: string,
): Promise<string> {
  const isPersonal = creator !== null;
  const systemPrompt = isPersonal
    ? buildPersonalSystemPrompt(brand, creator)
    : buildCorporateSystemPrompt(brand);

  const userMessage = `## Reddit Post to Reply To

**Subreddit:** r/${post.subreddit}
**Title:** ${post.postTitle}
**Posted by:** ${post.postAuthor}

**Post Body:**
${post.postBody || '(no body text — title only)'}

## Previous Draft
${previousDraft}

## Feedback for Revision
${feedback}

Rewrite the draft incorporating the feedback above. Use web search if you need to verify any facts or find updated information. Just output the revised reply text — no preamble, no commentary.`;

  const webSearchTool = {
    type: 'web_search_20250305' as const,
    name: 'web_search' as const,
    max_uses: 2,
  };

  const result = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    tools: [webSearchTool],
    messages: [{ role: 'user', content: userMessage }],
  });

  await logUsage('reroll', null, 'claude-opus-4-6', result);

  const raw = extractText(result);
  return humanize(raw);
}
