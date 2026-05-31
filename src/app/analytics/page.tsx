'use client';

import { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  TrendingUp,
  Award,
  Clock,
  BarChart3,
  Hash,
  Eye,
} from 'lucide-react';

// --- Mock Data ---

interface AccountStats {
  username: string;
  displayName: string;
  totalKarma: number;
  postKarma: number;
  commentKarma: number;
  karmaChange7d: number;
  accountAge: string;
}

interface PostPerformance {
  id: string;
  subreddit: string;
  title: string;
  type: 'post' | 'comment';
  score: number;
  upvoteRatio: number;
  commentCount: number;
  postedAt: string;
  postedVia: 'rosie' | 'manual';
}

interface SubredditEngagement {
  subreddit: string;
  postsCount: number;
  totalScore: number;
  avgScore: number;
  totalComments: number;
  karmaEarned: number;
}

interface DailyActivity {
  date: string;
  posts: number;
  comments: number;
  karmaGained: number;
}

const mockAccount: AccountStats = {
  username: 'u/merchynt',
  displayName: 'Merchynt',
  totalKarma: 2847,
  postKarma: 1203,
  commentKarma: 1644,
  karmaChange7d: 186,
  accountAge: '2 years',
};

const mockPosts: PostPerformance[] = [
  {
    id: '1',
    subreddit: 'r/LocalSEO',
    title: 'We analyzed 10,000 Google Business Profiles. Here are the top ranking factors.',
    type: 'post',
    score: 234,
    upvoteRatio: 0.94,
    commentCount: 47,
    postedAt: '2 days ago',
    postedVia: 'manual',
  },
  {
    id: '2',
    subreddit: 'r/SEO',
    title: 'Re: Best tools for managing Google Business Profiles at scale?',
    type: 'comment',
    score: 89,
    upvoteRatio: 0.91,
    commentCount: 12,
    postedAt: '3 days ago',
    postedVia: 'rosie',
  },
  {
    id: '3',
    subreddit: 'r/smallbusiness',
    title: 'Re: How do I get more Google reviews without being annoying?',
    type: 'comment',
    score: 67,
    upvoteRatio: 0.88,
    commentCount: 8,
    postedAt: '4 days ago',
    postedVia: 'rosie',
  },
  {
    id: '4',
    subreddit: 'r/digital_marketing',
    title: 'Re: AI is changing local search - how are you adapting?',
    type: 'comment',
    score: 45,
    upvoteRatio: 0.85,
    commentCount: 6,
    postedAt: '5 days ago',
    postedVia: 'rosie',
  },
  {
    id: '5',
    subreddit: 'r/agency',
    title: 'Re: What services have the best margins for marketing agencies?',
    type: 'comment',
    score: 38,
    upvoteRatio: 0.82,
    commentCount: 4,
    postedAt: '6 days ago',
    postedVia: 'manual',
  },
  {
    id: '6',
    subreddit: 'r/LocalSEO',
    title: 'How AI search engines are pulling data from Google Business Profiles',
    type: 'post',
    score: 156,
    upvoteRatio: 0.92,
    commentCount: 31,
    postedAt: '1 week ago',
    postedVia: 'manual',
  },
  {
    id: '7',
    subreddit: 'r/marketing',
    title: 'Re: Has anyone tried using AI to respond to Google reviews?',
    type: 'comment',
    score: 52,
    upvoteRatio: 0.87,
    commentCount: 9,
    postedAt: '1 week ago',
    postedVia: 'rosie',
  },
  {
    id: '8',
    subreddit: 'r/Entrepreneur',
    title: 'Re: Local business owners - what marketing actually works?',
    type: 'comment',
    score: 29,
    upvoteRatio: 0.79,
    commentCount: 3,
    postedAt: '2 weeks ago',
    postedVia: 'manual',
  },
];

const mockSubredditEngagement: SubredditEngagement[] = [
  { subreddit: 'r/LocalSEO', postsCount: 14, totalScore: 892, avgScore: 64, totalComments: 156, karmaEarned: 743 },
  { subreddit: 'r/SEO', postsCount: 8, totalScore: 421, avgScore: 53, totalComments: 89, karmaEarned: 367 },
  { subreddit: 'r/smallbusiness', postsCount: 6, totalScore: 312, avgScore: 52, totalComments: 67, karmaEarned: 289 },
  { subreddit: 'r/marketing', postsCount: 5, totalScore: 198, avgScore: 40, totalComments: 43, karmaEarned: 176 },
  { subreddit: 'r/digital_marketing', postsCount: 4, totalScore: 167, avgScore: 42, totalComments: 38, karmaEarned: 149 },
  { subreddit: 'r/agency', postsCount: 3, totalScore: 124, avgScore: 41, totalComments: 28, karmaEarned: 112 },
  { subreddit: 'r/Entrepreneur', postsCount: 2, totalScore: 58, avgScore: 29, totalComments: 14, karmaEarned: 51 },
];

const mockDailyActivity: DailyActivity[] = [
  { date: 'May 25', posts: 1, comments: 3, karmaGained: 42 },
  { date: 'May 26', posts: 0, comments: 2, karmaGained: 18 },
  { date: 'May 27', posts: 1, comments: 4, karmaGained: 67 },
  { date: 'May 28', posts: 0, comments: 1, karmaGained: 12 },
  { date: 'May 29', posts: 0, comments: 3, karmaGained: 31 },
  { date: 'May 30', posts: 1, comments: 2, karmaGained: 54 },
  { date: 'May 31', posts: 0, comments: 2, karmaGained: 22 },
];

// --- Components ---

type TimeRange = '7d' | '30d' | '90d';

function StatCard({ label, value, change, sublabel, icon: Icon }: {
  label: string;
  value: string | number;
  change?: number;
  sublabel?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">{label}</p>
        <Icon size={16} className="text-muted" />
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-dark">{value}</p>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 text-[12px] font-semibold mb-1 ${change >= 0 ? 'text-green' : 'text-pink'}`}>
            {change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(change)}
          </span>
        )}
      </div>
      {sublabel && <p className="text-[12px] text-muted mt-1">{sublabel}</p>}
    </div>
  );
}

function ActivityBar({ data }: { data: DailyActivity }) {
  const maxKarma = 67; // max in dataset for scaling
  const barHeight = Math.max(8, (data.karmaGained / maxKarma) * 100);

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="w-full flex flex-col items-center justify-end h-[120px]">
        <div className="text-[10px] text-muted mb-1">+{data.karmaGained}</div>
        <div
          className="w-6 rounded-t-sm bg-navy/80 transition-all"
          style={{ height: `${barHeight}%` }}
        />
      </div>
      <span className="text-[10px] text-muted">{data.date.split(' ')[1]}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [postFilter, setPostFilter] = useState<'all' | 'posts' | 'comments'>('all');

  const totalScore7d = mockPosts.reduce((sum, p) => sum + p.score, 0);
  const totalComments7d = mockPosts.reduce((sum, p) => sum + p.commentCount, 0);
  const rosieAssistedCount = mockPosts.filter(p => p.postedVia === 'rosie').length;
  const avgUpvoteRatio = mockPosts.reduce((sum, p) => sum + p.upvoteRatio, 0) / mockPosts.length;

  const filteredPosts = postFilter === 'all'
    ? mockPosts
    : mockPosts.filter(p => p.type === (postFilter === 'posts' ? 'post' : 'comment'));

  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Analytics</h1>
          <p className="text-[13px] text-muted mt-1">
            Performance data for <span className="font-medium text-dark">{mockAccount.username}</span> ({mockAccount.displayName})
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-1">
          {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                timeRange === range
                  ? 'bg-navy text-white'
                  : 'text-muted hover:text-dark hover:bg-surface'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Karma"
          value={mockAccount.totalKarma.toLocaleString()}
          change={mockAccount.karmaChange7d}
          sublabel={`${mockAccount.postKarma.toLocaleString()} post / ${mockAccount.commentKarma.toLocaleString()} comment`}
          icon={Award}
        />
        <StatCard
          label="Total Score (7d)"
          value={totalScore7d}
          sublabel={`Across ${mockPosts.length} posts and comments`}
          icon={ArrowUp}
        />
        <StatCard
          label="Replies Generated"
          value={totalComments7d}
          sublabel={`From ${mockPosts.length} contributions`}
          icon={MessageSquare}
        />
        <StatCard
          label="Avg Upvote Ratio"
          value={`${Math.round(avgUpvoteRatio * 100)}%`}
          sublabel="Higher is better"
          icon={TrendingUp}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Daily Activity Chart */}
        <div className="col-span-2 bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-semibold text-dark">Daily Karma Earned</h2>
              <p className="text-[12px] text-muted mt-0.5">Karma gained per day from posts and comments</p>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-muted">
              <BarChart3 size={14} />
              Last 7 days
            </div>
          </div>
          <div className="flex items-end gap-2 px-2">
            {mockDailyActivity.map((day) => (
              <ActivityBar key={day.date} data={day} />
            ))}
          </div>
        </div>

        {/* Rosie Impact */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-[14px] font-semibold text-dark mb-1">Rosie Impact</h2>
          <p className="text-[12px] text-muted mb-4">How much was Rosie-assisted</p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-dark">Rosie-drafted</span>
                <span className="text-[12px] font-semibold text-navy">{rosieAssistedCount} of {mockPosts.length}</span>
              </div>
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy rounded-full transition-all"
                  style={{ width: `${(rosieAssistedCount / mockPosts.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted">Rosie avg score</span>
                <span className="text-[12px] font-semibold text-dark">
                  {Math.round(mockPosts.filter(p => p.postedVia === 'rosie').reduce((s, p) => s + p.score, 0) / rosieAssistedCount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted">Manual avg score</span>
                <span className="text-[12px] font-semibold text-dark">
                  {Math.round(mockPosts.filter(p => p.postedVia === 'manual').reduce((s, p) => s + p.score, 0) / (mockPosts.length - rosieAssistedCount))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted">Time saved (est.)</span>
                <span className="text-[12px] font-semibold text-dark">{rosieAssistedCount * 12} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subreddit Engagement Table */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash size={16} className="text-navy" />
          <h2 className="text-[14px] font-semibold text-dark">Engagement by Subreddit</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wider py-2 pr-4">Subreddit</th>
              <th className="text-right text-[11px] font-semibold text-muted uppercase tracking-wider py-2 px-4">Posts</th>
              <th className="text-right text-[11px] font-semibold text-muted uppercase tracking-wider py-2 px-4">Total Score</th>
              <th className="text-right text-[11px] font-semibold text-muted uppercase tracking-wider py-2 px-4">Avg Score</th>
              <th className="text-right text-[11px] font-semibold text-muted uppercase tracking-wider py-2 px-4">Comments</th>
              <th className="text-right text-[11px] font-semibold text-muted uppercase tracking-wider py-2 pl-4">Karma Earned</th>
            </tr>
          </thead>
          <tbody>
            {mockSubredditEngagement.map((sub, index) => (
              <tr key={sub.subreddit} className={index !== mockSubredditEngagement.length - 1 ? 'border-b border-border' : ''}>
                <td className="py-3 pr-4">
                  <span className="text-[13px] font-medium text-pink">{sub.subreddit}</span>
                </td>
                <td className="text-right text-[13px] text-dark py-3 px-4">{sub.postsCount}</td>
                <td className="text-right text-[13px] text-dark py-3 px-4">{sub.totalScore.toLocaleString()}</td>
                <td className="text-right text-[13px] text-dark py-3 px-4">{sub.avgScore}</td>
                <td className="text-right text-[13px] text-dark py-3 px-4">{sub.totalComments}</td>
                <td className="text-right text-[13px] font-semibold text-green py-3 pl-4">+{sub.karmaEarned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Posts/Comments Performance */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-navy" />
            <h2 className="text-[14px] font-semibold text-dark">Recent Activity Performance</h2>
          </div>
          <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
            {(['all', 'posts', 'comments'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPostFilter(filter)}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                  postFilter === filter
                    ? 'bg-white text-dark shadow-sm'
                    : 'text-muted hover:text-dark'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-0">
          {filteredPosts.map((post, index) => (
            <div
              key={post.id}
              className={`flex items-center gap-4 py-3.5 ${
                index !== filteredPosts.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              {/* Score */}
              <div className="w-14 text-center shrink-0">
                <p className="text-[16px] font-bold text-dark">{post.score}</p>
                <p className="text-[10px] text-muted">score</p>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-medium text-pink">{post.subreddit}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    post.type === 'post' ? 'bg-navy/10 text-navy' : 'bg-blue/10 text-blue'
                  }`}>
                    {post.type}
                  </span>
                  {post.postedVia === 'rosie' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green/10 text-green font-medium">
                      via Rosie
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-dark truncate">{post.title}</p>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <p className="text-[13px] font-medium text-dark">{Math.round(post.upvoteRatio * 100)}%</p>
                  <p className="text-[10px] text-muted">upvoted</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-medium text-dark">{post.commentCount}</p>
                  <p className="text-[10px] text-muted">replies</p>
                </div>
                <div className="text-right w-16">
                  <p className="text-[11px] text-muted flex items-center gap-1 justify-end">
                    <Clock size={10} />
                    {post.postedAt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
