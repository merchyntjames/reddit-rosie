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

export async function generateDrafts(ctx: DraftContext): Promise<{ corporate: string; personal: string }> {
  const userMessage = `## Reddit Post to Reply To

**Subreddit:** r/${ctx.subreddit}
**Title:** ${ctx.postTitle}
**Posted by:** ${ctx.postAuthor}

**Post Body:**
${ctx.postBody || '(no body text — title only)'}

Write your reply now. Just the reply text — no preamble, no "Here's my reply:", just the actual comment you'd post on Reddit.`;

  // Generate both drafts in parallel
  const [corporateResult, personalResult] = await Promise.all([
    anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildCorporateSystemPrompt(ctx),
      messages: [{ role: 'user', content: userMessage }],
    }),
    anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildPersonalSystemPrompt(ctx),
      messages: [{ role: 'user', content: userMessage }],
    }),
  ]);

  const corporate = corporateResult.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n');

  const personal = personalResult.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n');

  return { corporate, personal };
}
