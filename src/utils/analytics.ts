import { 
  AnalyticsEvent, 
  AnalyticsSession,
  AnalyticsFilters,
  AnalyticsMetrics,
  AnalyticsDashboard,
  GroupAnalytics,
  ContactAnalytics,
  AnalyticsClickTarget,
  getClickCategory,
  getClickTargetLabel,
  AnalyticsDateRange
} from '../types/analytics';
import { loadCustomGroups, getGroupByShareCode } from './custom-groups';
import { Contact } from '../types/contacts';
import { api } from '../lib/api';
import { analyticsBatcher } from './analytics-batcher';

// ============================================================================
// Event Tracking
// ============================================================================

/**
 * Generate or retrieve a persistent visitor ID for tracking unique people (90-day persistence)
 * Uses localStorage to persist across sessions and browser restarts
 */
export function getOrCreateVisitorId(userCode: string): string {
  const visitorKey = `clikVisitor_${userCode}`;
  const stored = localStorage.getItem(visitorKey);
  
  if (stored) {
    try {
      const visitor = JSON.parse(stored);
      const now = Date.now();
      const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
      
      // Check if visitor ID is still valid (within 90 days)
      if (now - visitor.createdAt < NINETY_DAYS) {
        // Update last seen timestamp
        visitor.lastSeen = now;
        localStorage.setItem(visitorKey, JSON.stringify(visitor));
        return visitor.visitorId;
      }
    } catch (e) {
      console.error('Error parsing visitor ID:', e);
    }
  }
  
  // Create new visitor ID
  const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const visitor = {
    visitorId,
    createdAt: Date.now(),
    lastSeen: Date.now()
  };
  localStorage.setItem(visitorKey, JSON.stringify(visitor));
  return visitorId;
}

/**
 * Generate a session ID for tracking unique visitors (30-minute session timeout)
 * Uses sessionStorage to track engagement sessions
 */
export function getOrCreateSessionId(userCode: string, shareCode: string): string {
  const sessionKey = `clikSession_${userCode}_${shareCode}`;
  const stored = sessionStorage.getItem(sessionKey);
  
  if (stored) {
    try {
      const session = JSON.parse(stored);
      const now = Date.now();
      const THIRTY_MINUTES = 30 * 60 * 1000;
      
      if (now - session.lastSeen < THIRTY_MINUTES) {
        session.lastSeen = now;
        sessionStorage.setItem(sessionKey, JSON.stringify(session));
        return session.sessionId;
      }
    } catch (e) {
      console.error('Error parsing session:', e);
    }
  }
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const session = {
    sessionId,
    lastSeen: Date.now()
  };
  sessionStorage.setItem(sessionKey, JSON.stringify(session));
  return sessionId;
}

/**
 * Track a page view event (initial session)
 */
export function trackView(
  userCode: string,
  shareCode: string,
  contactId?: string
): void {
  const visitorId = getOrCreateVisitorId(userCode);
  const sessionId = getOrCreateSessionId(userCode, shareCode);
  analyticsBatcher.trackSession(sessionId, userCode, shareCode, contactId, visitorId);
}

/**
 * Track a page view for a specific screen
 */
export function trackPageView(
  userCode: string,
  shareCode: string,
  page: 'page.home' | 'page.contact' | 'page.profile' | 'page.portfolio',
  contactId?: string
): void {
  const sessionId = getOrCreateSessionId(userCode, shareCode);
  const pageType = page.replace('page.', ''); // Remove 'page.' prefix
  analyticsBatcher.trackPageView(sessionId, userCode, shareCode, pageType, contactId);
}

/**
 * Track a click event
 */
export function trackClick(
  userCode: string,
  shareCode: string,
  target: AnalyticsClickTarget,
  contactId?: string
): void {
  const sessionId = getOrCreateSessionId(userCode, shareCode);
  analyticsBatcher.trackClick(sessionId, userCode, shareCode, target, contactId);
}

// ============================================================================
// Data Processing (Client Side)
// ============================================================================

function reconstructSessions(events: AnalyticsEvent[]): AnalyticsSession[] {
  const sessionsMap: Record<string, AnalyticsSession> = {};

  events.sort((a, b) => a.timestamp - b.timestamp).forEach(event => {
    if (!event.sessionId) return;

    if (!sessionsMap[event.sessionId]) {
      sessionsMap[event.sessionId] = {
        sessionId: event.sessionId,
        userCode: event.userCode,
        shareCode: event.shareCode,
        contactId: event.contactId,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        viewCount: 0,
        clickCount: 0
      };
    }

    const session = sessionsMap[event.sessionId];
    session.lastSeen = Math.max(session.lastSeen, event.timestamp);
    
    if (event.eventType === 'view') session.viewCount++;
    if (event.eventType === 'click') session.clickCount++;
  });

  return Object.values(sessionsMap);
}

// ============================================================================
// Filtering
// ============================================================================

function getDateRange(filters: AnalyticsFilters): AnalyticsDateRange {
  const now = Date.now();
  
  if (filters.period === 'custom' && filters.customRange) {
    return filters.customRange;
  }
  
  if (filters.period === 'all') {
    // Return a very old date (5 years ago) for "all time"
    return { startDate: now - (5 * 365 * 24 * 60 * 60 * 1000), endDate: now };
  }
  
  if (filters.period === '1h') {
    // 1 hour ago
    return { startDate: now - (60 * 60 * 1000), endDate: now };
  }
  
  if (filters.period === '1d') {
    // 1 day ago (24 hours)
    return { startDate: now - (24 * 60 * 60 * 1000), endDate: now };
  }
  
  let daysAgo: number;
  switch (filters.period) {
    case '7d': daysAgo = 7; break;
    case '30d': daysAgo = 30; break;
    case '90d': daysAgo = 90; break;
    default: daysAgo = 30;
  }
  
  const startDate = now - (daysAgo * 24 * 60 * 60 * 1000);
  return { startDate, endDate: now };
}

function filterEvents(events: AnalyticsEvent[], filters: AnalyticsFilters): AnalyticsEvent[] {
  const { startDate, endDate } = getDateRange(filters);
  
  return events.filter(event => {
    if (event.timestamp < startDate || event.timestamp > endDate) return false;
    if (filters.shareCode && event.shareCode !== filters.shareCode) return false;
    if (filters.contactId && event.contactId !== filters.contactId) return false;
    return true;
  });
}

function filterSessions(sessions: AnalyticsSession[], filters: AnalyticsFilters): AnalyticsSession[] {
  const { startDate, endDate } = getDateRange(filters);
  
  return sessions.filter(session => {
    if (session.firstSeen < startDate || session.firstSeen > endDate) return false;
    if (filters.shareCode && session.shareCode !== filters.shareCode) return false;
    if (filters.contactId && session.contactId !== filters.contactId) return false;
    return true;
  });
}

// ============================================================================
// Metrics Computation
// ============================================================================

function computeMetrics(events: AnalyticsEvent[], sessions: AnalyticsSession[]): AnalyticsMetrics {
  const views = events.filter(e => e.eventType === 'view');
  const clicks = events.filter(e => e.eventType === 'click');
  
  const clicksByCategory = {
    contact: 0,
    messaging: 0,
    social: 0,
    portfolio: 0,
    aiAgent: 0,
  };
  
  const clickCounts: Record<string, number> = {};
  
  clicks.forEach(click => {
    if (click.eventTarget) {
      const category = getClickCategory(click.eventTarget);
      if (category !== 'other') {
        clicksByCategory[category]++;
      }
      clickCounts[click.eventTarget] = (clickCounts[click.eventTarget] || 0) + 1;
    }
  });
  
  const sortedClicks = Object.entries(clickCounts).sort(([, a], [, b]) => b - a);
  
  const getTopItems = (cat: string) => sortedClicks
    .filter(([target]) => getClickCategory(target) === cat)
    .slice(0, 5)
    .map(([target, count]) => ({ target, count, label: getClickTargetLabel(target) }));

  const topContactMethods = getTopItems('contact');
  const topMessagingApps = getTopItems('messaging');
  const topSocialChannels = getTopItems('social');
  const topPortfolioItems = getTopItems('portfolio'); // Adjust label as needed
  
  const viewsByDate: Record<string, number> = {};
  const clicksByDate: Record<string, number> = {};
  
  views.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    viewsByDate[date] = (viewsByDate[date] || 0) + 1;
  });
  
  clicks.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    clicksByDate[date] = (clicksByDate[date] || 0) + 1;
  });
  
  return {
    totalViews: views.length,
    uniqueVisitors: sessions.length,
    totalClicks: clicks.length,
    clickThroughRate: views.length > 0 ? clicks.length / views.length : 0,
    contactClicks: clicksByCategory.contact,
    messagingClicks: clicksByCategory.messaging,
    socialClicks: clicksByCategory.social,
    portfolioClicks: clicksByCategory.portfolio,
    aiAgentClicks: clicksByCategory.aiAgent,
    topContactMethods,
    topMessagingApps,
    topSocialChannels,
    topPortfolioItems,
    viewsByDate,
    clicksByDate,
  };
}

// ============================================================================
// Dashboard Data
// ============================================================================

export async function getAnalyticsDashboard(
  userCode: string,
  filters: AnalyticsFilters,
  contacts: Contact[] = [],
  customGroups: any[] = [] // CustomGroup[] but avoid circular dep if possible, or just import it
): Promise<AnalyticsDashboard> {
  // TRY NEW REAL-TIME API FIRST, FALLBACK TO OLD SYSTEM
  try {
    // Calculate days for API call based on filter period
    let days = 90; // default
    if (filters.period === '1h') days = 1 / 24; // 1 hour
    else if (filters.period === '1d') days = 1;
    else if (filters.period === '7d') days = 7;
    else if (filters.period === '30d') days = 30;
    else if (filters.period === '90d') days = 90;
    else if (filters.period === 'all') days = 365 * 5; // 5 years
    else if (filters.period === 'custom' && filters.customRange) {
      // Calculate days from custom range
      const diffMs = filters.customRange.endDate - filters.customRange.startDate;
      days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    }
    
    // Find contact code from email if contact filter is applied
    let contactCode: string | undefined;
    if (filters.contactEmail) {
      const contact = contacts.find(c => c.email === filters.contactEmail);
      contactCode = contact?.contactCode;
      console.log('[Analytics] Contact filter - email:', filters.contactEmail, '→ contactCode:', contactCode);
    }
    
    const realtimeData = await api.analytics.getRealtime(userCode, { days, contactCode });
    
    // Transform real-time data to dashboard format
    return transformRealtimeDataToDashboard(realtimeData, filters, contacts, customGroups);
  } catch (error) {
    console.warn('[Analytics] Real-time API failed, falling back to old system:', error);
    
    // FALLBACK: Use old analytics_events table
    return getAnalyticsDashboardLegacy(userCode, filters, contacts, customGroups);
  }
}

/**
 * Transform real-time API data to dashboard format
 */
function transformRealtimeDataToDashboard(
  realtimeData: any,
  filters: AnalyticsFilters,
  contacts: Contact[],
  customGroups: any[]
): AnalyticsDashboard {
  const { user, groups, daily, clickTargets, pageStats, rawClicks, rawPageViews } = realtimeData;
  
  // Ensure all data structures exist with defaults
  const safeUser = user || { total_sessions: 0, total_page_views: 0, total_clicks: 0, unique_visitors: 0 };
  const safeGroups = groups || [];
  const safeDaily = daily || [];
  const safeClickTargets = clickTargets || [];
  const safePageStats = pageStats || [];
  const safeRawClicks = rawClicks || [];
  const safeRawPageViews = rawPageViews || [];

  // Get date range for filtering
  const dateRange = getDateRange(filters);
  const startDateISO = new Date(dateRange.startDate).toISOString().split('T')[0];
  const endDateISO = new Date(dateRange.endDate).toISOString().split('T')[0];

  // Get share code from groupId if specified
  let filterShareCode: string | undefined;
  if (filters.groupId) {
    const group = customGroups.find(g => g.id === filters.groupId);
    filterShareCode = group?.shareCode;
    console.log('[Analytics] Filtering by groupId:', filters.groupId, '→ shareCode:', filterShareCode);
  }

  // Filter daily stats by date range AND group
  const filteredDaily = safeDaily.filter((d: any) => {
    const dateMatch = d.date >= startDateISO && d.date <= endDateISO;
    const groupMatch = !filterShareCode || d.share_code === filterShareCode;
    return dateMatch && groupMatch;
  });

  // Filter pageStats and clickTargets by group if specified
  const filteredPageStats = filterShareCode 
    ? safePageStats.filter((p: any) => p.share_code === filterShareCode)
    : safePageStats;
  
  const filteredClickTargets = filterShareCode
    ? safeClickTargets.filter((ct: any) => ct.share_code === filterShareCode)
    : safeClickTargets;

  // When contact filter is applied, recalculate overall metrics from filtered data
  // because the views (v_realtime_daily_stats, etc.) don't filter by contact
  let totalPageViews: number;
  let totalClicks: number;
  let totalSessions: number;
  let uniquePeople: number;
  
  if (filters.contactEmail) {
    // Contact filter is active - calculate from filtered raw data
    console.log('[Analytics] Contact filter active - recalculating metrics from filtered data');
    
    // Calculate total page views from filtered pageStats
    totalPageViews = filteredPageStats.reduce((sum: number, p: any) => sum + (p.total_views || 0), 0);
    
    // Calculate total clicks from filtered clickTargets
    totalClicks = filteredClickTargets.reduce((sum: number, ct: any) => sum + (ct.total_clicks || 0), 0);
    
    // For contact filter, unique people = 1 if there's any actual activity (views or clicks)
    // Not just if there are entries in the arrays - must have actual data
    uniquePeople = (totalPageViews > 0 || totalClicks > 0) ? 1 : 0;
    
    // Sessions - count unique session_ids from raw data (already filtered by contact in API)
    const uniqueSessionIds = new Set<string>();
    safeRawPageViews.forEach((view: any) => {
      if (view.session_id) uniqueSessionIds.add(view.session_id);
    });
    safeRawClicks.forEach((click: any) => {
      if (click.session_id) uniqueSessionIds.add(click.session_id);
    });
    totalSessions = uniqueSessionIds.size;
    
    console.log('[Analytics] Contact filter metrics:', {
      totalPageViews,
      totalClicks,
      totalSessions,
      uniquePeople,
      uniqueSessionIds: Array.from(uniqueSessionIds)
    });
  } else {
    // No contact filter - use the aggregated views data
    totalPageViews = filteredDaily.reduce((sum: number, d: any) => sum + (d.total_page_views || 0), 0);
    totalSessions = filteredDaily.reduce((sum: number, d: any) => sum + (d.total_sessions || 0), 0);
    totalClicks = filteredDaily.reduce((sum: number, d: any) => sum + (d.total_clicks || 0), 0);
    
    // Calculate unique people (visitor_id) from groups data when filtering by group
    // When no group filter, use overall user.unique_visitors
    // When group filter is applied, calculate from the specific group's data
    if (filterShareCode) {
      // Find the specific group's unique visitor count
      const groupData = safeGroups.find((g: any) => g.share_code === filterShareCode);
      uniquePeople = groupData?.unique_visitors || 0;
      console.log('[Analytics] Unique people for group:', filterShareCode, '=', uniquePeople);
    } else {
      // Use overall count
      uniquePeople = safeUser.unique_visitors || 0;
    }
  }

  // Calculate home page views (entry point - counts every time DBC is opened)
  const homePageViews = filteredPageStats.find((p: any) => p.page_type === 'home')?.total_views || 0;

  // Debug: Log filtered pageStats to see all page_type values
  console.log('[Analytics Debug] Filtered pageStats breakdown:', filteredPageStats.map((p: any) => ({
    page_type: p.page_type,
    total_views: p.total_views,
    share_code: p.share_code
  })));
  
  // Calculate total views from filtered pageStats (should match totalPageViews)
  const pageStatsTotal = filteredPageStats.reduce((sum: number, p: any) => sum + (p.total_views || 0), 0);
  console.log('[Analytics Debug] View counts comparison:', {
    totalPageViews, // From daily stats
    pageStatsTotal, // From page stats
    difference: totalPageViews - pageStatsTotal,
    groupFilter: filterShareCode || 'all'
  });

  // Overall metrics
  const overallMetrics = {
    totalViews: totalPageViews,
    uniqueVisitors: totalSessions,  // Unique sessions (30-min)
    uniquePeople: uniquePeople,    // Unique people (90-day visitor_id) - filtered by group
    totalClicks: totalClicks,
    homePageViews, // Add home page views for reference
    avgClicksPerVisitor: totalSessions > 0 
      ? Math.round((totalClicks / totalSessions) * 10) / 10 
      : 0,
    contactClicks: 0, // TODO: Calculate from clickTargets
    messagingClicks: 0,
    socialClicks: 0,
    portfolioClicks: 0,
    aiAgentClicks: 0,
    topContactMethods: [],
    topMessagingApps: [],
    topSocialChannels: [],
    topPortfolioItems: [],
    viewsByDate: filteredDaily.map((d: any) => ({
      date: d.date,
      count: d.total_page_views
    })),
    clicksByDate: filteredDaily.map((d: any) => ({
      date: d.date,
      count: d.total_clicks
    })),
  };

  // Group breakdown
  const groupBreakdown = safeGroups.map((g: any) => {
    const group = customGroups.find(cg => cg.shareCode === g.share_code);
    return {
      shareCode: g.share_code,
      groupId: group?.id || g.share_code,
      groupLabel: group?.label || g.share_code,
      groupIcon: group?.icon || 'users',
      groupColor: group?.color || '#6366F1',
      metrics: {
        totalViews: g.total_page_views || 0,
        uniqueVisitors: g.total_sessions || 0,
        totalClicks: g.total_clicks || 0,
        avgClicksPerVisitor: g.total_sessions > 0
          ? Math.round((g.total_clicks / g.total_sessions) * 10) / 10
          : 0,
        contactClicks: 0,
        messagingClicks: 0,
        socialClicks: 0,
        portfolioClicks: 0,
        aiAgentClicks: 0,
        topContactMethods: [],
        topMessagingApps: [],
        topSocialChannels: [],
        topPortfolioItems: [],
        viewsByDate: [],
        clicksByDate: [],
      },
    };
  });

  // Contact breakdown - empty for now (old system)
  const contactBreakdown: ContactAnalytics[] = [];

  // Page breakdown - map clickTargets and pageStats to screens
  const pageTypes = ['home', 'contact', 'profile', 'portfolio'];
  const pageBreakdown = pageTypes.map(pageType => {
    // Get page views for this screen from FILTERED data
    const pageData = filteredPageStats.find((p: any) => p.page_type === pageType);
    const totalViews = pageData?.total_views || 0;

    // Map click_target to page type
    const getPageForTarget = (target: string): string => {
      if (!target) return 'home';
      
      // Contact screen - contact methods and messaging apps
      if (target.startsWith('contact.') || target.startsWith('socialMessaging.')) {
        return 'contact';
      }
      
      // Portfolio screen
      if (target.startsWith('portfolio.')) {
        return 'portfolio';
      }
      
      // Home screen - social channels and home navigation
      if (target.startsWith('socialChannels.') || target.startsWith('home.')) {
        return 'home';
      }
      
      // Default to home
      return 'home';
    };

    // Get clicks for elements on this page from FILTERED data
    const pageClicks = filteredClickTargets
      .filter((ct: any) => getPageForTarget(ct.click_target) === pageType)
      .map((ct: any) => ({
        label: getClickTargetLabel(ct.click_target),
        count: ct.total_clicks
      }))
      .sort((a: any, b: any) => b.count - a.count);

    return {
      screenId: pageType,
      metrics: {
        totalViews,
        uniqueVisitors: 0,
        uniquePeople: 0,
        totalClicks: pageClicks.reduce((sum: number, el: any) => sum + el.count, 0),
        homePageViews: 0,
        avgClicksPerVisitor: 0,
        contactClicks: 0,
        messagingClicks: 0,
        socialClicks: 0,
        portfolioClicks: 0,
        aiAgentClicks: 0,
        topContactMethods: [],
        topMessagingApps: [],
        topSocialChannels: [],
        topPortfolioItems: [],
        viewsByDate: [],
        clicksByDate: [],
      },
      topElements: pageClicks
    };
  });

  return {
    overallMetrics,
    groupBreakdown,
    contactBreakdown,
    dateRange,
    pageBreakdown,
  } as any;
}

/**
 * LEGACY: Old analytics system using analytics_events table
 */
async function getAnalyticsDashboardLegacy(
  userCode: string,
  filters: AnalyticsFilters,
  contacts: Contact[] = [],
  customGroups: any[] = []
): Promise<AnalyticsDashboard> {
  // 1. Fetch raw events from API
  const response = await api.analytics.get(userCode);
  const allEvents: AnalyticsEvent[] = response.events || [];
  
  // 2. Reconstruct sessions
  const allSessions = reconstructSessions(allEvents);
  
  // 3. Filter
  const filteredEvents = filterEvents(allEvents, filters);
  const filteredSessions = filterSessions(allSessions, filters);
  
  const overallMetrics = computeMetrics(filteredEvents, filteredSessions);
  
  // Breakdown by group
  // Use provided groups, fallback to loading from utility (which returns defaults)
  const groups = customGroups.length > 0 ? customGroups : loadCustomGroups();
  
  const groupBreakdown: GroupAnalytics[] = groups.map(group => {
    const groupEvents = filteredEvents.filter(e => e.shareCode === group.shareCode);
    const groupSessions = filteredSessions.filter(s => s.shareCode === group.shareCode);
    
    return {
      shareCode: group.shareCode,
      groupId: group.id,
      groupLabel: group.label,
      groupIcon: group.icon,
      groupColor: group.color,
      metrics: computeMetrics(groupEvents, groupSessions),
    };
  });
  
  const contactBreakdown: ContactAnalytics[] = contacts
    .map(contact => {
      const contactEvents = filteredEvents.filter(e => e.contactId === contact.id);
      const contactSessions = filteredSessions.filter(s => s.contactId === contact.id);
      
      if (contactEvents.length === 0) return null;
      
      const group = getGroupByShareCode(contact.group);
      
      return {
        contactId: contact.id,
        contactName: contact.name,
        contactAvatar: contact.avatar,
        shareCode: contact.group,
        groupLabel: group?.label || contact.group,
        metrics: computeMetrics(contactEvents, contactSessions),
      };
    })
    .filter((c): c is ContactAnalytics => c !== null);
  
  const dateRange = getDateRange(filters);
  
  return {
    userCode,
    filters,
    overallMetrics,
    groupBreakdown,
    contactBreakdown,
    dateRange: {
      start: dateRange.startDate,
      end: dateRange.endDate,
    },
  };
}