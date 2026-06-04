import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DraftContext {
  // Post info
  postTitle: string;
  postBody: string;
  subreddit: string;
  postAuthor: string;

  // Brand context
  companyOverview: string;
  products: { name: string; description: string; keyFeatures: string }[];
  competitorContext: string;
  keyStats: string;

  // Voice context
  brandVoice: string;
  redditGuidelines: string;
  topicsToAvoid: string;
  approvedTerminology: string;
  sampleResponses: string[];

  // Creator context (for personal voice)
  creatorName: string;
  creatorRole: string;
  creatorVoice: string;
  creatorPersonaNotes: string;
  creatorExpertise: string;
}

function buildCorporateSystemPrompt(ctx: DraftContext): string {
  return `You are drafting a Reddit reply on behalf of the Merchynt brand account. Your goal is to add genuine value to the conversation while subtly raising awareness of Merchynt and its products when naturally relevant.

## Company Context
${ctx.companyOverview}

## Products
${ctx.products.map(p => `### ${p.name}\n${p.description}\n${p.keyFeatures}`).join('\n\n')}

## Competitor Landscape
${ctx.competitorContext}

## Key Stats & Proof Points
${ctx.keyStats}

## Brand Voice
${ctx.brandVoice}

## Reddit-Specific Guidelines
${ctx.redditGuidelines}

## Topics to Avoid
${ctx.topicsToAvoid}

## Approved Terminology
${ctx.approvedTerminology}

## Example Responses (for tone reference only — do not copy)
${ctx.sampleResponses.map((r, i) => `Example ${i + 1}:\n${r}`).join('\n\n')}

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
- Match the tone of r/${ctx.subreddit} (technical subreddits expect more depth, general ones expect simpler language)`;
}

function buildPersonalSystemPrompt(ctx: DraftContext): string {
  return `You are drafting a Reddit reply as ${ctx.creatorName} (${ctx.creatorRole} at Merchynt), posting from a personal account. Your goal is to be a helpful, knowledgeable community member who happens to work in local SEO.

## About You
Name: ${ctx.creatorName}
Role: ${ctx.creatorRole}
Voice: ${ctx.creatorVoice}

## Your Reddit Persona
${ctx.creatorPersonaNotes}

## Your Areas of Expertise
${ctx.creatorExpertise}

## Company Context (for accuracy — not for pitching)
${ctx.companyOverview}

## Products You Use Daily
${ctx.products.map(p => `- ${p.name}: ${p.description}`).join('\n')}

## Key Stats You Can Reference
${ctx.keyStats}

## Topics to Avoid
${ctx.topicsToAvoid}

## Approved Terminology
${ctx.approvedTerminology}

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
- Match the energy of r/${ctx.subreddit}`;
}

// --- Humanization Pass ---
// Runs AFTER the voice-specific draft is generated.
// Subordinate to brand voice and personal style guide at all times.

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
- Vary sentence length: mix short (≤8 words), medium, and occasional long (≥25 words)
- Avoid 3+ consecutive sentences of similar length
- Use fragments for emphasis where natural
- One-sentence paragraphs are fine
- Don't make every paragraph follow the same Claim → Explanation → Example → Conclusion pattern

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

## The test
Read it out loud. Does it sound like something a real person would say in a thoughtful Reddit conversation? If a sentence is too stiff to say aloud, rewrite it.

## Content classification
This is a Reddit comment — casual social content. Intensity level 2 (personal/informal). Contractions, fragments, asides, and natural rhythm are all appropriate. No injected spelling errors.

## Output
Return ONLY the improved draft. No preamble, no "Here's the humanized version:", no commentary. Just the final Reddit comment text.`;

async function humanize(draft: string): Promise<string> {
  const result = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: HUMANIZATION_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Here is a Reddit comment draft to humanize. Preserve the voice and meaning. Make it read like a real person wrote it.\n\n---\n\n${draft}`,
    }],
  });

  const humanized = result.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n');

  return humanized || draft; // Fall back to original if humanization fails
}

// --- Main Generation Flow ---

export async function generateDrafts(ctx: DraftContext): Promise<{ corporate: string; personal: string }> {
  const userMessage = `## Reddit Post to Reply To

**Subreddit:** r/${ctx.subreddit}
**Title:** ${ctx.postTitle}
**Posted by:** ${ctx.postAuthor}

**Post Body:**
${ctx.postBody || '(no body text — title only)'}

Before writing your reply, use web search to research the topic so your response is grounded in current, accurate information. Search for:
1. The specific topic being discussed (current best practices, recent changes, latest data)
2. Any tools, services, or techniques mentioned in the post (verify claims, check current status)

After researching, write your reply. Just the reply text — no preamble, no "Here's my reply:", no "Based on my research:", just the actual comment you'd post on Reddit. The reply should reflect current knowledge without explicitly saying "I searched for this."`;

  // Web search tool — Claude researches the topic before drafting
  const webSearchTool = {
    type: 'web_search_20250305' as const,
    name: 'web_search' as const,
    max_uses: 3,
  };

  // Step 1: Generate both voice-specific drafts in parallel (with web search)
  const [corporateResult, personalResult] = await Promise.all([
    anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: buildCorporateSystemPrompt(ctx),
      tools: [webSearchTool],
      messages: [{ role: 'user', content: userMessage }],
    }),
    anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: buildPersonalSystemPrompt(ctx),
      tools: [webSearchTool],
      messages: [{ role: 'user', content: userMessage }],
    }),
  ]);

  const corporateRaw = corporateResult.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n');

  const personalRaw = personalResult.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n');

  // Step 2: Run humanization pass on both drafts in parallel
  const [corporate, personal] = await Promise.all([
    humanize(corporateRaw),
    humanize(personalRaw),
  ]);

  return { corporate, personal };
}
