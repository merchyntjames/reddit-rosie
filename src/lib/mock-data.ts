import { Conversation, MonitoredSubreddit, MonitoredKeyword, StyleGuide } from './types';

export const mockConversations: Conversation[] = [
  {
    id: '1',
    subreddit: 'r/LocalSEO',
    postTitle: 'Best tools for managing Google Business Profiles at scale?',
    postSnippet: 'I manage about 30 client GBPs and it\'s becoming a nightmare. Spending hours every week just updating posts, responding to reviews, and making sure info is accurate. Anyone found a good tool that handles this without costing a fortune?',
    postAuthor: 'u/agency_mike_seo',
    postUrl: 'https://reddit.com/r/LocalSEO/comments/abc123',
    commentCount: 24,
    upvotes: 47,
    relevanceScore: 95,
    matchedKeywords: ['Google Business Profile', 'manage', 'tool'],
    discoveredAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 min ago
    status: 'new',
    corporateDraft: 'Great question -- managing multiple GBPs manually is one of the biggest time sinks in local SEO.\n\nWe built Paige specifically for this use case. She\'s an AI worker that handles GBP posting, review responses, Q&A, and profile optimization across all your client locations. Most agencies using Paige save 4-6 hours per client per month.\n\nHappy to share more details if you\'re interested, but the free trial lets you test it on a few profiles first.',
    personalDraft: 'I feel this pain. I was in the same boat managing client GBPs before I found a solution that actually worked.\n\nWhat specifically is eating the most time for you -- posts, reviews, or keeping info updated? That would change what I\'d recommend.\n\nFor what it\'s worth, I\'ve been using an AI tool called Paige that handles most of the repetitive GBP work automatically. Went from spending ~6 hours per client to maybe 30 minutes of oversight. Might be worth looking into.',
  },
  {
    id: '2',
    subreddit: 'r/digital_marketing',
    postTitle: 'AI is changing local search - how are you adapting?',
    postSnippet: 'With ChatGPT, Perplexity, and Gemini all starting to recommend local businesses, I\'m wondering if traditional SEO is going to be enough. Are any of you actively optimizing for AI search engines? What does that even look like?',
    postAuthor: 'u/marketingpro2026',
    postUrl: 'https://reddit.com/r/digital_marketing/comments/def456',
    commentCount: 38,
    upvotes: 112,
    relevanceScore: 88,
    matchedKeywords: ['AI', 'local search', 'ChatGPT', 'Perplexity', 'Gemini'],
    discoveredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    status: 'new',
    corporateDraft: 'This is one of the most important shifts happening in local marketing right now.\n\nWe\'ve been tracking AI search visibility across ChatGPT, Gemini, Perplexity, Claude, Siri, and Alexa. What we\'re finding is that your Google Business Profile data feeds directly into AI recommendations -- so businesses with complete, optimized GBPs are the ones getting recommended.\n\nThe challenge is that most businesses appear on zero out of six major AI platforms. We\'ve built tools to help track and improve AI search visibility alongside traditional GBP optimization.\n\nWould be happy to share some of what we\'re seeing in the data if that\'s helpful.',
    personalDraft: 'Been thinking about this a lot. From what I\'ve seen working in the space, AI search engines pull heavily from Google Business Profile data -- reviews, posts, Q&A, business descriptions.\n\nSo it\'s not really a separate optimization strategy. It\'s more like... if your GBP is already dialed in, you\'re probably showing up in AI results too. The businesses getting left out are the ones with bare-bones profiles.\n\nThe tricky part is tracking it. There\'s no Google Search Console equivalent for ChatGPT or Perplexity yet. Some tools are starting to monitor this but it\'s early days.',
  },
  {
    id: '3',
    subreddit: 'r/smallbusiness',
    postTitle: 'How do I get more Google reviews without being annoying?',
    postSnippet: 'I own a dental practice and we have like 12 reviews. Our competitor down the street has 200+. I know reviews matter but I don\'t want to be that business that hassles every patient. What\'s worked for you?',
    postAuthor: 'u/dr_smile_dental',
    postUrl: 'https://reddit.com/r/smallbusiness/comments/ghi789',
    commentCount: 56,
    upvotes: 89,
    relevanceScore: 72,
    matchedKeywords: ['Google reviews', 'business'],
    discoveredAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    status: 'new',
    corporateDraft: 'The gap between 12 and 200+ reviews is significant for rankings, but the good news is it\'s very fixable.\n\nA few things that work well for dental practices specifically:\n\n1. Send a review request via text/email within an hour of the appointment (timing matters more than anything)\n2. Make the link dead simple -- one tap to the review form, not your general Google listing\n3. Automate it so it happens without your front desk having to remember\n\nWe work with a lot of dental practices on this and the ones who automate review requests consistently get 15-30 new reviews per month without any manual effort. Happy to share more specifics if helpful.',
    personalDraft: 'Totally get the hesitation. Nobody wants to be pushy about it.\n\nHere\'s what I\'ve seen work really well for practices like yours:\n\n- Ask right after a positive interaction (not in the waiting room, not a week later)\n- Text beats email. Send a direct link to the Google review form -- not your Google listing, the actual review prompt\n- Most people are happy to leave a review. They just forget. A simple text reminder takes care of that\n\nThe competitor with 200+ reviews probably isn\'t hassling patients. They likely have an automated system that sends a text after every appointment. That\'s the real difference.',
  },
  {
    id: '4',
    subreddit: 'r/SEO',
    postTitle: 'Merchynt vs BrightLocal vs Whitespark for local SEO?',
    postSnippet: 'Looking to invest in a local SEO tool for my agency. We manage about 50 locations. I\'ve narrowed it down to these three but can\'t find great comparison info. Anyone used multiple and can share their experience?',
    postAuthor: 'u/seo_tools_review',
    postUrl: 'https://reddit.com/r/SEO/comments/jkl012',
    commentCount: 19,
    upvotes: 33,
    relevanceScore: 98,
    matchedKeywords: ['Merchynt', 'local SEO', 'agency'],
    discoveredAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    status: 'new',
    corporateDraft: 'Appreciate the mention! Full transparency -- I\'m from the Merchynt team, so I\'ll share what differentiates us and let others speak to BrightLocal and Whitespark.\n\nThe biggest difference is approach: BrightLocal and Whitespark are reporting/tracking tools (they show you what\'s happening). Paige (our AI worker) actually does the work -- posting, review responses, Q&A, profile optimization -- automatically.\n\nFor 50 locations, that distinction matters a lot. Tracking tools still leave you with hours of manual work. Paige handles the execution so your team can focus on strategy.\n\nHappy to answer any specific questions about capabilities or pricing.',
    personalDraft: 'I\'ve used all three at different points, so here\'s my honest take:\n\n- BrightLocal is solid for reporting and citation tracking. Great dashboards. But it\'s a monitoring tool, not a doing tool -- you still have to do all the actual GBP work yourself.\n- Whitespark is strong on citations and local rank tracking. Similar story though -- it tells you what to do, doesn\'t do it.\n- Merchynt\'s Paige is different because it\'s an AI that actually manages the profiles. Posts, reviews, Q&A, optimization. For 50 locations that\'s a massive time difference.\n\nDepends on what you need. If you want analytics and tracking, BrightLocal. If you want someone (something?) to actually do the work, Paige.',
  },
  {
    id: '5',
    subreddit: 'r/agency',
    postTitle: 'What services have the best margins for marketing agencies?',
    postSnippet: 'We\'re a 5-person agency doing mostly web design and paid ads. Margins are thin. Looking to add a service line that\'s more profitable. What\'s been your highest-margin offering?',
    postAuthor: 'u/smallagency_founder',
    postUrl: 'https://reddit.com/r/agency/comments/mno345',
    commentCount: 42,
    upvotes: 67,
    relevanceScore: 65,
    matchedKeywords: ['agency', 'margins'],
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    status: 'in_progress',
    corporateDraft: 'Local SEO is one of the highest-margin services an agency can offer, especially if you use automation to handle the fulfillment.\n\nThe math works out to something like $901 profit per client per month when you use AI tools for the actual GBP management work. Your team focuses on the strategy and client relationship while the tool handles posting, reviews, and optimization.\n\nWe see a lot of agencies add local SEO as a service line and immediately improve their overall margins because the delivery cost is so low relative to what you can charge.',
    personalDraft: 'Local SEO, hands down. Here\'s why:\n\n- Clients understand the value (they want to show up on Google Maps)\n- The work is largely automatable now with AI tools\n- You can charge $500-1000/mo per client and your actual delivery cost is a fraction of that\n- It\'s sticky -- clients don\'t churn because they see real results (calls, direction requests, reviews)\n\nThe key is not doing everything manually. If you\'re writing GBP posts and responding to reviews by hand for every client, the margins shrink fast. Automate the repetitive stuff and your team can manage way more accounts.',
  },
  {
    id: '6',
    subreddit: 'r/LocalSEO',
    postTitle: 'GBP suspended for no reason - anyone else dealing with this?',
    postSnippet: 'My client\'s GBP just got suspended out of nowhere. No spam, no violations that I can see. Google support is useless. Has anyone successfully gotten a profile reinstated recently? What worked?',
    postAuthor: 'u/frustrated_seo_guy',
    postUrl: 'https://reddit.com/r/LocalSEO/comments/pqr678',
    commentCount: 31,
    upvotes: 54,
    relevanceScore: 45,
    matchedKeywords: ['GBP'],
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    status: 'dismissed',
    corporateDraft: '',
    personalDraft: '',
  },
  {
    id: '7',
    subreddit: 'r/marketing',
    postTitle: 'Has anyone tried using AI to respond to Google reviews?',
    postSnippet: 'Getting 20+ reviews a week across our locations. Writing personalized responses to each one is killing us. Has anyone used AI tools for this? Do customers notice? Does Google care?',
    postAuthor: 'u/multi_location_owner',
    postUrl: 'https://reddit.com/r/marketing/comments/stu901',
    commentCount: 15,
    upvotes: 28,
    relevanceScore: 91,
    matchedKeywords: ['AI', 'Google reviews', 'respond'],
    discoveredAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 90 min ago
    status: 'completed',
    corporateDraft: 'We built this exact capability into Paige. She generates personalized review responses that reference specific details from each review -- not generic "Thanks for your feedback!" templates.\n\nTo answer your questions directly:\n- Customers generally can\'t tell, as long as the response references something specific they said\n- Google doesn\'t penalize AI-generated review responses. They care that you\'re responding, period\n- The key is customization. A good AI response mentions the reviewer\'s name, references their specific experience, and varies in tone\n\n20+ reviews per week across locations is exactly the volume where automation makes sense. Manual responses at that scale aren\'t sustainable.',
    personalDraft: 'Yes, and it works surprisingly well if you set it up right.\n\nThe trick is making sure the AI references specific details from each review. "Thanks for the kind words, Sarah! Glad the team took good care of your AC repair" hits completely differently than "Thank you for your review!"\n\nI\'ve been using a tool that handles this automatically and honestly, the quality is better than what most businesses write manually. It\'s consistent, timely (responds within hours, not days), and always professional.\n\nGoogle doesn\'t care how you write the response. They care that you respond. Response rate and speed both factor into rankings.',
  },
];

export const mockSubreddits: MonitoredSubreddit[] = [
  { name: 'r/LocalSEO', enabled: true },
  { name: 'r/SEO', enabled: true },
  { name: 'r/smallbusiness', enabled: true },
  { name: 'r/digital_marketing', enabled: true },
  { name: 'r/marketing', enabled: true },
  { name: 'r/agency', enabled: true },
  { name: 'r/Entrepreneur', enabled: true },
  { name: 'r/webmarketing', enabled: false },
  { name: 'r/PPC', enabled: false },
];

export const mockKeywords: MonitoredKeyword[] = [
  { term: 'Merchynt', enabled: true },
  { term: 'Paige', enabled: true },
  { term: 'Google Business Profile', enabled: true },
  { term: 'GBP optimization', enabled: true },
  { term: 'local SEO tool', enabled: true },
  { term: 'AI local SEO', enabled: true },
  { term: 'Google Maps ranking', enabled: true },
  { term: 'review management', enabled: true },
  { term: 'BrightLocal', enabled: true },
  { term: 'Whitespark', enabled: true },
];

export const mockStyleGuides: StyleGuide[] = [
  {
    id: 'corporate',
    name: 'Corporate Voice',
    description: 'Merchynt brand account (we/us/our)',
    content: `Tone: Confident, helpful, knowledgeable. Never salesy or pushy.
Pronouns: We/us/our (representing Merchynt as a company).
Key rules:
- Lead with value, not product pitch
- Always disclose affiliation when mentioning Merchynt/Paige
- Reference specific data points and results when possible
- Be genuinely helpful even if it doesn't lead to a sale
- Never bash competitors -- acknowledge their strengths, differentiate on approach
- Avoid marketing buzzwords and hype language
- No emojis
- Keep responses concise -- Reddit rewards substance, not length`,
  },
  {
    id: 'personal',
    name: 'Personal Voice',
    description: 'Individual account (I/me/my)',
    content: `Tone: Casual, conversational, experienced practitioner sharing what works.
Pronouns: I/me/my (speaking as an individual, not a brand).
Key rules:
- Write like you're talking to a peer, not a prospect
- Share personal experience and opinions
- It's okay to mention Paige/Merchynt but frame it as "a tool I use" not "our product"
- Ask follow-up questions to show genuine interest
- Be opinionated -- Reddit respects people who take a stance
- Acknowledge tradeoffs and limitations honestly
- No emojis
- Match the energy of the subreddit (r/SEO is more technical, r/smallbusiness is more conversational)`,
  },
];
