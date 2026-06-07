'use client';

import { Sparkles, Wrench, Package, Clock } from 'lucide-react';

type ChangeType = 'feature' | 'improvement' | 'infrastructure';

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
    id: '22',
    version: '1.5',
    date: 'June 6, 2026',
    type: 'improvement',
    title: 'Mobile Responsiveness',
    description: 'Full mobile and tablet support across the entire app. Sidebar collapses to a hamburger menu, layouts adapt to smaller screens.',
    details: [
      'Sidebar slides in as an overlay on mobile/tablet (< 1024px) with dark backdrop',
      'Mobile top bar with hamburger menu and Rosie logo',
      'Stats bar switches to 2-column grid on smaller screens',
      'Filter bar stacks tabs above action buttons on narrow viewports',
      'Conversation card meta row wraps gracefully on mobile',
      'Draft panel action buttons reflow below content on small screens',
      'Activity log timestamps placed below content for readability',
      'All pages use responsive padding (p-4 on mobile, p-8 on desktop)',
    ],
  },
  {
    id: '21',
    version: '1.4',
    date: 'June 6, 2026',
    type: 'improvement',
    title: 'Rosie Favicon',
    description: 'Added Rosie character favicon cropped from the mascot logo. Browser tabs now show Rosie instead of the default Next.js icon.',
    details: [
      'Favicon at 16, 32, 192, and 512px sizes',
      'Apple Touch Icon at 180px for iOS home screen',
      'Wired into Next.js metadata for automatic injection',
    ],
  },
  {
    id: '20',
    version: '1.3',
    date: 'June 4, 2026',
    type: 'feature',
    title: 'Settings + Knowledgebase Fully Functional',
    description: 'All settings pages now save to and load from Supabase. Changes made in the UI affect how the app behaves.',
    details: [
      'Knowledgebase (Product Knowledge, Brand Voice, Creator Profiles) saves to Supabase with Save/Saved status feedback',
      'Draft generation reads knowledgebase from Supabase — edit brand voice in UI, next draft reflects it',
      'Monitoring settings (subreddits, keywords) save to Supabase',
      'GitHub Action reads subreddits and keywords from Supabase — add a subreddit in UI, next scan includes it',
    ],
  },
  {
    id: '19',
    version: '1.2',
    date: 'June 4, 2026',
    type: 'feature',
    title: 'Major Navigation Restructure',
    description: 'Reorganized the app into Engagement Queue, Activity Log, Knowledgebase, and Account Settings. Deleted mock Analytics page.',
    details: [
      'Queue renamed to "Engagement Queue"',
      'New Knowledgebase page (Brain icon) — houses Product Knowledge, Brand Voice, Creator Profiles',
      'Account Settings trimmed to Monitoring, Quality Score, and Integrations',
      'Analytics page deleted (was all mock data)',
      'Claude API status wired up — real connectivity check on page load',
      'Integration Status reordered: Claude API, Last RSS Scan, RSS Scan Status',
      'Product Roadmap link added below Changelog (later removed)',
    ],
  },
  {
    id: '18',
    version: '1.1',
    date: 'June 4, 2026',
    type: 'feature',
    title: 'Claude AI Draft Generation with Web Search',
    description: 'Claude Opus 4.6 generates corporate and personal voice drafts, with built-in web search to research topics before writing.',
    details: [
      'Claude researches the topic via Brave Search (up to 3 searches per draft) before writing',
      'Two drafts per conversation: corporate voice (we/us/our) and personal voice (I/me/my)',
      'System prompts built from Product Knowledge, Brand Voice, Creator Profiles, competitor context',
      'Drafts cached in Supabase — generate once, see forever, no re-spending tokens',
      '"Generate AI Drafts" button with sparkle icon on each queue card',
      'Draft generation logged in Activity Log',
    ],
  },
  {
    id: '17',
    version: '1.0',
    date: 'June 4, 2026',
    type: 'infrastructure',
    title: 'Supabase Database Integration',
    description: 'Full migration from localStorage and static JSON to Supabase. All data is now persistent, cross-device, and real.',
    details: [
      'conversations table: every Reddit post with status tracking, scores, drafts',
      'settings table: quality threshold, subreddits, keywords, knowledgebase',
      'activity_log table: every action timestamped (discovered, dismissed, completed, drafted, cleared)',
      'scan_history table: each GitHub Actions run tracked with post counts',
      'GitHub Action writes to Supabase + JSON fallback',
      'Queue reads from Supabase, status changes persist to DB',
      'Activity Log shows real events from database',
      'Quality threshold slider saves to DB, GitHub Action reads it',
    ],
  },
  {
    id: '16',
    version: '0.9',
    date: 'June 3, 2026',
    type: 'improvement',
    title: 'Queue UX Improvements',
    description: 'Card improvements, quality score badge, and Clear Queue functionality.',
    details: [
      'Quality Score badge shows "X/100 Quality Score" with color coding (green 80+, blue 60-79, orange below 60)',
      'Info icon tooltip links to Quality Score settings tab',
      '"Clear queue" button dismisses all new/in_progress items, preserves completed',
      '"Posted 7d ago" timestamp format',
      'Upvote/comment counts hidden when zero (RSS limitation)',
      'Removed duplicate post body in expanded card view',
    ],
  },
  {
    id: '15',
    version: '0.8',
    date: 'June 3, 2026',
    type: 'feature',
    title: 'Quality Score Settings + Scoring Improvements',
    description: 'New Quality Score tab in settings showing how scores are calculated. Daily scans with tighter quality filter.',
    details: [
      'Quality Score settings tab: threshold slider, brand/competitor weights, topic terms, engagement signals',
      'Switched from t=week to t=day for fresh daily content',
      'Raised quality threshold from 30 to 50',
      'Expanded self-promo penalties ([FOR HIRE], "I built", hiring posts)',
      'Broad search across all of Reddit + narrow search in target subreddits',
      'Fixed scoring bug — Queue now uses pre-computed scores from fetch script',
    ],
  },
  {
    id: '14',
    version: '0.7.1',
    date: 'June 1, 2026',
    type: 'improvement',
    title: 'Sidebar Overhaul + Logo + Rosie Branding',
    description: 'Rosie The Redditor mascot logo in sidebar, integration status with real timestamps, Reddit accounts removed from sidebar.',
    details: [
      'Rosie logo hyperlinked to homepage',
      'Integration Status: real RSS scan timestamps in Eastern Time',
      'Reddit Accounts management moved to Account Settings page',
      'Slack integration section mocked up in settings',
    ],
  },
  {
    id: '12',
    version: '0.7',
    date: 'June 1, 2026',
    type: 'feature',
    title: 'Automated Reddit Monitoring via GitHub Actions',
    description: 'Reddit conversations refresh automatically twice daily via GitHub Actions + Reddit RSS feeds. No personal computer needed.',
    details: [
      'GitHub Action runs at 6am and 6pm ET daily',
      'Broad search (8 queries across all of Reddit) + narrow search (17 queries in 9 target subreddits)',
      'Relevance scoring: brand mentions (50pts), competitors (30pts), topics (5-15pts), question posts (+8pts)',
      'Quality filter: only posts scoring above threshold enter the queue',
    ],
  },
  {
    id: '8',
    version: '0.5',
    date: 'May 31, 2026',
    type: 'feature',
    title: 'Analytics Dashboard + Expanded Settings',
    description: 'Performance analytics page (later removed), 5-tab settings layout, and changelog with release history.',
    details: [
      'Settings: Monitoring, Product Knowledge, Brand Voice, Creator Profiles, Integrations',
      'Changelog page with release history timeline',
      'Analytics page with mock data (removed June 4)',
    ],
  },
  {
    id: '3',
    version: '0.2',
    date: 'May 31, 2026',
    type: 'feature',
    title: 'Rosie The Redditor Mascot',
    description: 'Generated brand mascot using Nano Banana Pro (Google Gemini). Chibi-style character with reddish-orange hair, polka-dot bandana, Merchynt hoodie, and tablet with upvote arrow.',
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
      'Sidebar with branding, nav, connection status, and user info',
      'Merchynt brand palette (navy, pink, clean whites) with Lucide icons',
    ],
  },
  {
    id: '1',
    version: '0.0',
    date: 'May 31, 2026',
    type: 'infrastructure',
    title: 'Project Created',
    description: 'Next.js 16 app scaffolded with TypeScript and Tailwind CSS. GitHub repo created at merchyntjames/reddit-rosie. Deployed to Vercel.',
  },
];

function TypeBadge({ type }: { type: ChangeType }) {
  const styles = {
    feature: 'bg-blue/10 text-blue',
    improvement: 'bg-green/10 text-green',
    infrastructure: 'bg-navy/10 text-navy',
  };
  const labels = {
    feature: 'Feature',
    improvement: 'Improvement',
    infrastructure: 'Infrastructure',
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
  }
}

export default function ChangelogPage() {
  return (
    <div className="p-4 sm:p-8 max-w-[900px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Changelog</h1>
        <p className="text-[13px] text-muted mt-1">
          A record of every feature, improvement, and milestone in Reddit Rosie.
        </p>
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
