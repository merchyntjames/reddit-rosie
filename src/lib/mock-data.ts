import { MonitoredSubreddit, MonitoredKeyword, ProductKnowledge, BrandVoice, CreatorProfile } from './types';

// These are default values used as initial state before Supabase loads.
// They prevent empty fields from flashing — the real data replaces them
// within milliseconds of page load.

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

export const mockProductKnowledge: ProductKnowledge = {
  companyOverview: '',
  products: [],
  competitorContext: '',
  keyStats: '',
};

export const mockBrandVoice: BrandVoice = {
  brandName: 'Merchynt',
  voiceDescription: '',
  audienceDescription: '',
  redditGuidelines: '',
  topicsToAvoid: '',
  approvedTerminology: '',
  sampleResponses: [],
};

export const mockCreatorProfiles: CreatorProfile[] = [];
