'use client';

import { Sparkles, Wrench, Layout, Package, Clock, Search, FileText, Users, Plug, MessageSquare, BarChart3 } from 'lucide-react';

type ChangeType = 'feature' | 'improvement' | 'infrastructure' | 'planned';

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  type: ChangeType;
  title: string;
  description: string;
  details?: string[];
}

const changelog: ChangelogEntry[] = [
  {
    id: '12',
    version: '0.7',
    date: 'June 1, 2026',
    type: 'feature',
    title: 'Automated Reddit Monitoring via GitHub Actions',
    description: 'Reddit conversations now refresh automatically twice daily via GitHub Actions + Reddit RSS feeds. No personal computer needed, no API keys, no Xpoz dependency.',
    details: [
      'GitHub Action runs at 6am and 6pm ET daily, fetches RSS from 9 subreddits',
      'Searches 17 keyword queries across r/localseo, r/SEO, r/smallbusiness, r/marketing, r/digital_marketing, r/agency, r/Entrepreneur, r/webmarketing, r/bigseo',
      'Improved relevance scoring: brand mentions (50pts), competitor mentions (30pts), topic terms (5-15pts), question/help posts (+8pts), subreddit authority boost (+5-10pts), self-promo penalty (-15pts)',
      'Quality filter: only posts with relevance score >= 20 make the queue',
      'First run found 75 posts, 60 passed quality filter, top score 100',
      'Data saved as static JSON, auto-deployed by Vercel on git push',
      'Manual trigger available via GitHub Actions "Run workflow" button',
    ],
  },
  {
    id: '11',
    version: '0.6',
    date: 'May 31, 2026',
    type: 'feature',
    title: 'Live Reddit Data via Xpoz',
    description: 'Initial attempt at live Reddit data via Xpoz MCP. Replaced by GitHub Actions + RSS approach due to MCP incompatibility with Vercel serverless.',
    details: [
      'Xpoz MCP works in Claude Code but fails in Vercel serverless functions',
      'Pivoted to static JSON approach with RSS feeds as the data source',
      'Queue page fetches data on load with loading and error states',
      'Scan Now button triggers page refresh',
      'Live/Offline status indicator in Queue header',
      'Conversation statuses (dismiss, complete) persisted in localStorage',
      'Graceful fallback when API key is not configured',
      'Relevance scoring based on keyword matches and engagement metrics',
    ],
  },
  {
    id: '10',
    version: '0.5.2',
    date: 'May 31, 2026',
    type: 'feature',
    title: 'Reddit Accounts Management',
    description: 'New section in Account Settings for adding and managing Reddit account connections. Each account shows connection status and permission indicators for posting and analytics.',
    details: [
      'Add accounts with username, display name, and type (Brand or Personal)',
      'Connection status per account with Connect button for future OAuth',
      'Per-account permission indicators: Posting and Analytics',
      'Remove account functionality',
      'Empty state when no accounts are added',
    ],
  },
  {
    id: '9',
    version: '0.5.1',
    date: 'May 31, 2026',
    type: 'improvement',
    title: 'Rosie Logo, Nav Cleanup, and Project Docs',
    description: 'Added Rosie The Redditor mascot logo to sidebar header (hyperlinked to homepage). Removed Reddit Accounts from sidebar — managed in Account Settings only. Added development workflow rules to CLAUDE.md.',
    details: [
      'Rosie logo in sidebar header, clickable to return to Queue',
      'Integration Status shows real state (Not connected / Never)',
      'Reddit Accounts section removed from sidebar, consolidated in settings',
      'CLAUDE.md updated with changelog, roadmap, and integration status workflow rules',
    ],
  },
  {
    id: '8',
    version: '0.5',
    date: 'May 31, 2026',
    type: 'feature',
    title: 'Analytics Dashboard',
    description: 'Performance analytics page for tracking Reddit engagement. Karma stats, daily activity chart, Rosie impact metrics, subreddit engagement table, and post performance list.',
    details: [
      'Account overview: total karma with 7-day change, total score, replies, avg upvote ratio',
      'Daily karma earned bar chart (7-day view)',
      'Rosie impact panel comparing Rosie-drafted vs manual post performance',
      'Engagement by subreddit table with posts, score, comments, karma earned',
      'Recent activity feed filterable by posts, comments, or all',
      'Time range selector (7d / 30d / 90d) for future use',
    ],
  },
  {
    id: '7',
    version: '0.5',
    date: 'May 31, 2026',
    type: 'improvement',
    title: 'Sidebar Navigation Overhaul',
    description: 'Restructured sidebar with primary navigation (Queue, Analytics, Activity Log, Account Settings), Integration Status section, and connected Reddit accounts display.',
    details: [
      'Settings elevated to primary nav as "Account Settings"',
      'Integration Status section with Reddit API, Claude API, and last scan time',
      'Reddit Accounts subsection showing connected accounts with active/inactive status',
      'Three mock accounts: u/merchynt, u/jamessowers, u/justinsilverman',
    ],
  },
  {
    id: '6',
    version: '0.4',
    date: 'May 31, 2026',
    type: 'feature',
    title: 'Expanded Settings with 5-Tab Layout',
    description: 'Settings page rebuilt with organized tabs for monitoring, product knowledge, brand voice, creator profiles, and integrations.',
    details: [
      'Product Knowledge tab: document company overview, products (Paige, GBP Audit), competitors, and proof points',
      'Brand Voice tab: brand name, voice description, Reddit-specific guidelines, approved terminology, sample responses',
      'Creator Profiles tab: per-person cards with voice, persona notes, and topics of expertise',
      'Accounts & Integrations tab: API connection status, notification preferences, data management',
      'Monitoring tab: added scan frequency selector and relevance threshold slider',
    ],
  },
  {
    id: '5',
    version: '0.3',
    date: 'May 31, 2026',
    type: 'infrastructure',
    title: 'Vercel Deployment and Plugin Integration',
    description: 'Connected project to Vercel for auto-deploy on push. Installed the Vercel coding agent plugin for direct CLI management of deployments, env vars, and cron jobs.',
    details: [
      'Vercel project linked and deploying at reddit-rosie.vercel.app',
      'Vercel CLI authenticated for direct deployment management',
      'Auto-deploy on every push to main branch',
    ],
  },
  {
    id: '4',
    version: '0.2.1',
    date: 'May 31, 2026',
    type: 'improvement',
    title: 'Renamed to Reddit Rosie',
    description: 'Rebranded from "Reddit Reggie" to "Reddit Rosie" (Rosie The Redditor). Updated all code references, GitHub repo, package name, and local directory.',
  },
  {
    id: '3',
    version: '0.2',
    date: 'May 31, 2026',
    type: 'feature',
    title: 'Rosie The Redditor Mascot',
    description: 'Generated brand mascot using Nano Banana Pro (Google Gemini). Chibi-style character with reddish-orange hair, polka-dot bandana, Merchynt hoodie, and tablet with upvote arrow.',
    details: [
      'Multiple iterations across character pose, font rendering, and expression',
      'Final direction: determined confident smile, green eyes, self-contained bust cutoff',
      'Matched Pixel Pete visual language for brand consistency',
    ],
  },
  {
    id: '2',
    version: '0.1',
    date: 'May 31, 2026',
    type: 'feature',
    title: 'Initial UI Scaffold',
    description: 'Full UI built with mock data. Queue page, settings, activity log, and sidebar navigation modeled after Pixel Pete.',
    details: [
      'Queue page with stats bar, filter tabs, and expandable conversation cards',
      'Dual-voice draft panels (Corporate / Personal) with copy-to-clipboard',
      'Settings page for subreddits, keywords, and style guides',
      'Activity log with timestamped action history',
      'Sidebar with branding, nav, connection status, and user info',
      '7 realistic mock conversations across 6 subreddits',
      'Merchynt brand palette (navy, pink, clean whites) with Lucide icons',
    ],
  },
  {
    id: '1',
    version: '0.0',
    date: 'May 31, 2026',
    type: 'infrastructure',
    title: 'Project Created',
    description: 'Next.js 16 app scaffolded with TypeScript and Tailwind CSS. GitHub repo created at merchyntjames/reddit-rosie.',
  },
];

const planned: { title: string; description: string; icon: React.ElementType }[] = [
  {
    title: 'Claude Draft Generation',
    description: 'AI-powered draft responses using product knowledge, brand voice, and creator profiles as context. Human reviews and copy/pastes into Reddit.',
    icon: MessageSquare,
  },
  {
    title: 'Database and Auth',
    description: 'Supabase integration for persistent data storage. Vercel password protection or magic link auth.',
    icon: Plug,
  },
  {
    title: 'Performance Analytics',
    description: 'Track upvote scores, comment counts, karma changes, and engagement trends over time via periodic Data API polling.',
    icon: BarChart3,
  },
  {
    title: 'Slack Integration',
    description: 'Real-time Slack alerts for new conversations, daily digests, and performance milestones. Configurable channels and quiet hours.',
    icon: MessageSquare,
  },
];

function TypeBadge({ type }: { type: ChangeType }) {
  const styles = {
    feature: 'bg-blue/10 text-blue',
    improvement: 'bg-green/10 text-green',
    infrastructure: 'bg-navy/10 text-navy',
    planned: 'bg-orange/10 text-orange',
  };
  const labels = {
    feature: 'Feature',
    improvement: 'Improvement',
    infrastructure: 'Infrastructure',
    planned: 'Planned',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

function TypeIcon({ type }: { type: ChangeType }) {
  switch (type) {
    case 'feature':
      return (
        <div className="w-7 h-7 rounded-full bg-blue/10 flex items-center justify-center">
          <Sparkles size={14} className="text-blue" />
        </div>
      );
    case 'improvement':
      return (
        <div className="w-7 h-7 rounded-full bg-green/10 flex items-center justify-center">
          <Wrench size={14} className="text-green" />
        </div>
      );
    case 'infrastructure':
      return (
        <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center">
          <Package size={14} className="text-navy" />
        </div>
      );
    case 'planned':
      return (
        <div className="w-7 h-7 rounded-full bg-orange/10 flex items-center justify-center">
          <Clock size={14} className="text-orange" />
        </div>
      );
  }
}

export default function ChangelogPage() {
  return (
    <div className="p-8 max-w-[900px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Changelog</h1>
        <p className="text-[13px] text-muted mt-1">
          A record of every feature, improvement, and milestone in Reddit Rosie.
        </p>
      </div>

      {/* Roadmap */}
      <div id="roadmap" className="mb-8">
        <h2 className="text-[16px] font-semibold text-dark mb-4 flex items-center gap-2">
          <Layout size={18} className="text-navy" />
          Roadmap
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {planned.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-muted" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-dark">{item.title}</p>
                    <p className="text-[12px] text-muted mt-0.5 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Changelog Timeline */}
      <div>
        <h2 className="text-[16px] font-semibold text-dark mb-4 flex items-center gap-2">
          <Clock size={18} className="text-navy" />
          Release History
        </h2>
        <div className="bg-white rounded-xl border border-border">
          {changelog.map((entry, index) => (
            <div
              key={entry.id}
              className={`p-5 ${
                index !== changelog.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <TypeIcon type={entry.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-mono font-semibold text-navy">v{entry.version}</span>
                    <TypeBadge type={entry.type} />
                    <span className="text-[11px] text-muted ml-auto">{entry.date}</span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-dark">{entry.title}</h3>
                  <p className="text-[13px] text-muted mt-1 leading-relaxed">{entry.description}</p>
                  {entry.details && (
                    <ul className="mt-2 space-y-1">
                      {entry.details.map((detail, i) => (
                        <li key={i} className="text-[12px] text-muted leading-relaxed flex items-start gap-2">
                          <span className="text-border mt-1 shrink-0">--</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
