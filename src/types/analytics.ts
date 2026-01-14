// Analytics types for Clik Card engagement tracking

export type AnalyticsEventType = 'view' | 'click';

// Page views for main screens
export type AnalyticsPageView = 
  | 'page.home'
  | 'page.contact'
  | 'page.profile'
  | 'page.portfolio';

export type AnalyticsClickTarget = 
  // Contact clicks
  | 'contact.phone'
  | 'contact.email'
  | 'contact.address'
  // Messaging app clicks
  | 'socialMessaging.zalo'
  | 'socialMessaging.messenger'
  | 'socialMessaging.telegram'
  | 'socialMessaging.whatsapp'
  | 'socialMessaging.kakao'
  | 'socialMessaging.discord'
  | 'socialMessaging.wechat'
  // Social channel clicks
  | 'socialChannels.facebook'
  | 'socialChannels.linkedin'
  | 'socialChannels.twitter'
  | 'socialChannels.youtube'
  | 'socialChannels.tiktok'
  // Home navigation actions
  | 'home.saveContact'
  | 'home.shareProfile'
  | 'home.navigateToProfile'
  | 'home.navigateToPortfolio'
  | 'home.navigateToContact'
  // AI Agent
  | 'aiAgent'
  // Portfolio interactions (total, not per-item)
  | 'portfolio.imageOpen'
  | 'portfolio.videoPlay'
  | 'portfolio.virtualTourOpen';

export interface AnalyticsEvent {
  id: string;
  userCode: string;         // Whose Clik Card
  shareCode: string;        // Which group/share link was used
  contactId?: string;       // If shared with specific contact (optional)
  eventType: AnalyticsEventType;
  eventTarget?: AnalyticsClickTarget | AnalyticsPageView;  // For clicks or page views
  timestamp: number;
  sessionId: string;        // To identify unique visitors
}

export interface AnalyticsSession {
  sessionId: string;
  userCode: string;
  shareCode: string;
  contactId?: string;
  firstSeen: number;
  lastSeen: number;
  viewCount: number;
  clickCount: number;
}

// Time period options for filtering
export type AnalyticsPeriod = '1h' | '1d' | '7d' | '30d' | '90d' | 'all' | 'custom';

export interface AnalyticsDateRange {
  startDate: number;  // timestamp
  endDate: number;    // timestamp
}

// Filter options
export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  customRange?: AnalyticsDateRange;
  shareCode?: string;     // Filter by specific share code (DEPRECATED: use groupId)
  groupId?: string;       // Filter by specific group ID
  contactId?: string;     // Filter by specific contact
  contactEmail?: string;  // Filter by specific contact email
}

// Aggregated metrics
export interface AnalyticsMetrics {
  totalViews: number;
  uniqueVisitors: number;  // Unique sessions (30-min timeout)
  uniquePeople?: number;   // Unique people (90-day visitor_id tracking)
  totalClicks: number;
  homePageViews?: number;  // Home page views (entry point - counts every DBC open)
  clickThroughRate?: number;  // clicks / views
  avgClicksPerVisitor?: number; // clicks / visitors
  
  // Breakdown by category
  contactClicks: number;
  messagingClicks: number;
  socialClicks: number;
  portfolioClicks: number;
  aiAgentClicks: number;
  
  // Top clicked items
  topContactMethods: Array<{ target: string; count: number; label: string }>;
  topMessagingApps: Array<{ target: string; count: number; label: string }>;
  topSocialChannels: Array<{ target: string; count: number; label: string }>;
  topPortfolioItems: Array<{ target: string; count: number; label: string }>;
  
  // Time series data (views and clicks by date)
  viewsByDate: Record<string, number>;  // { '2024-01-15': 42, ... }
  clicksByDate: Record<string, number>;
}

// Per-group summary
export interface GroupAnalytics {
  shareCode: string;
  groupId: string;
  groupLabel: string;
  groupIcon: string;
  groupColor: string;
  metrics: AnalyticsMetrics;
}

// Per-contact summary
export interface ContactAnalytics {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  shareCode: string;
  groupLabel: string;
  metrics: AnalyticsMetrics;
}

// Overall summary for dashboard
export interface AnalyticsDashboard {
  userCode: string;
  filters: AnalyticsFilters;
  overallMetrics: AnalyticsMetrics;
  groupBreakdown: GroupAnalytics[];
  contactBreakdown: ContactAnalytics[];
  dateRange: {
    start: number;
    end: number;
  };
}

import i18n from '../lib/i18n';

// Helper to get human-readable labels for click targets (fallback - English only)
export const CLICK_TARGET_LABELS: Record<string, string> = {
  // Contact
  'contact.phone': 'Phone',
  'contact.email': 'Email',
  'contact.address': 'Address',
  // Messaging
  'socialMessaging.zalo': 'Zalo',
  'socialMessaging.messenger': 'Messenger',
  'socialMessaging.telegram': 'Telegram',
  'socialMessaging.whatsapp': 'WhatsApp',
  'socialMessaging.kakao': 'KakaoTalk',
  'socialMessaging.discord': 'Discord',
  'socialMessaging.wechat': 'WeChat',
  // Social
  'socialChannels.facebook': 'Facebook',
  'socialChannels.linkedin': 'LinkedIn',
  'socialChannels.twitter': 'Twitter / X',
  'socialChannels.youtube': 'YouTube',
  'socialChannels.tiktok': 'TikTok',
  // Home navigation actions
  'home.saveContact': 'Save Contact',
  'home.shareProfile': 'Share Profile',
  'home.navigateToProfile': 'View Profile',
  'home.navigateToPortfolio': 'View Portfolio',
  'home.navigateToContact': 'View Contact',
  // AI
  'aiAgent': 'AI Agent',
  // Portfolio
  'portfolio.imageOpen': 'Open Image',
  'portfolio.videoPlay': 'Play Video',
  'portfolio.virtualTourOpen': 'Open Virtual Tour',
  // Page views
  'page.home': 'Home',
  'page.contact': 'Contact',
  'page.profile': 'Profile',
  'page.portfolio': 'Portfolio',
};

export function getClickTargetLabel(target: string): string {
  // Handle portfolio item format: portfolio.item.{title}
  if (target.startsWith('portfolio.item.')) {
    return target.substring('portfolio.item.'.length);
  }
  
  // Try to use translation with fallback to English label
  const translationKey = `analytics.clickTarget.${target}`;
  const fallbackLabel = CLICK_TARGET_LABELS[target] || target;
  
  // Check if i18n is initialized
  if (!i18n.isInitialized) {
    return fallbackLabel;
  }
  
  // Check if translation exists using i18n.exists() if available, otherwise try to get it
  try {
    // Try to get translation - i18n.t() will return the key if translation doesn't exist
    // So we check if the result is different from the key
    const translated = i18n.t(translationKey);
    
    // If translation exists (result is different from key), use it
    if (translated && translated !== translationKey && translated.trim() !== '') {
      return translated;
    }
    
    // Translation doesn't exist, use fallback
    return fallbackLabel;
  } catch (error) {
    // If i18n fails, use fallback
    return fallbackLabel;
  }
}

// Helper to categorize click targets
export type ClickCategory = 'contact' | 'messaging' | 'social' | 'portfolio' | 'aiAgent' | 'other';

export function getClickCategory(target: string): ClickCategory {
  if (target.startsWith('contact.')) return 'contact';
  if (target.startsWith('socialMessaging.')) return 'messaging';
  if (target.startsWith('socialChannels.')) return 'social';
  if (target.startsWith('portfolio.')) return 'portfolio';
  if (target === 'aiAgent') return 'aiAgent';
  return 'other';
}