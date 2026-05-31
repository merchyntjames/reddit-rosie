export type ConversationStatus = 'new' | 'in_progress' | 'completed' | 'dismissed';

export interface Conversation {
  id: string;
  subreddit: string;
  postTitle: string;
  postSnippet: string;
  postAuthor: string;
  postUrl: string;
  commentCount: number;
  upvotes: number;
  relevanceScore: number; // 0-100
  matchedKeywords: string[];
  discoveredAt: string; // ISO date
  status: ConversationStatus;
  corporateDraft: string;
  personalDraft: string;
}

export interface MonitoredSubreddit {
  name: string;
  enabled: boolean;
}

export interface MonitoredKeyword {
  term: string;
  enabled: boolean;
}

export interface StyleGuide {
  id: string;
  name: string;
  description: string;
  content: string;
}
