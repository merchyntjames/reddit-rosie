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

// Settings: Product Knowledge
export interface Product {
  id: string;
  name: string;
  description: string;
  keyFeatures: string;
  pricing: string;
}

export interface ProductKnowledge {
  companyOverview: string;
  products: Product[];
  competitorContext: string;
  keyStats: string;
}

// Settings: Brand Voice
export interface BrandVoice {
  brandName: string;
  voiceDescription: string;
  audienceDescription: string;
  redditGuidelines: string;
  topicsToAvoid: string;
  approvedTerminology: string;
  sampleResponses: string[];
}

// Settings: Creator Profiles
export interface CreatorProfile {
  id: string;
  name: string;
  redditUsername: string;
  role: string;
  voiceDescription: string;
  redditPersonaNotes: string;
  topicsOfExpertise: string;
}

// Settings: Monitoring Config
export type ScanFrequency = '15min' | '30min' | '1hour' | '2hours';

export interface MonitoringConfig {
  scanFrequency: ScanFrequency;
  relevanceThreshold: number;
}

// Settings: Reddit Accounts
export interface RedditAccount {
  id: string;
  username: string;
  label: string;
  type: 'brand' | 'personal';
  status: 'connected' | 'not_connected';
  permissions: {
    posting: boolean;
    analytics: boolean;
  };
}

// Settings: Integrations
export interface IntegrationStatus {
  redditApi: 'connected' | 'disconnected';
  claudeApi: 'connected' | 'disconnected';
  slackNotifications: boolean;
  emailNotifications: boolean;
}
