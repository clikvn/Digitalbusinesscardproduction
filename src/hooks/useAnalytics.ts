import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  trackView, 
  trackClick, 
  trackPageView,
  getAnalyticsDashboard,
} from '../utils/analytics';
import { 
  AnalyticsClickTarget, 
  AnalyticsFilters, 
  AnalyticsDashboard,
  AnalyticsPageView 
} from '../types/analytics';
import { Contact } from '../types/contacts';
import { CustomGroup } from '../utils/custom-groups';
import { supabase } from '../lib/supabase-client';

/**
 * Hook for tracking analytics events
 * If shareCode is not provided or empty, it will fetch the default group's share code
 */
export function useAnalyticsTracking(userCode: string, shareCode?: string, contactId?: string) {
  const [resolvedShareCode, setResolvedShareCode] = useState<string | null>(shareCode || null);

  // Resolve share code if not provided
  useEffect(() => {
    const resolveCode = async () => {
      // If we already have a valid share code, use it
      if (shareCode && shareCode.trim()) {
        setResolvedShareCode(shareCode);
        return;
      }

      // Otherwise, fetch the default group's share code
      if (userCode) {
        try {
          const { data, error } = await supabase
            .from('user_share_groups')
            .select('share_code')
            .eq('user_code', userCode)
            .eq('is_default', true)
            .maybeSingle();

          if (data?.share_code && !error) {
            setResolvedShareCode(data.share_code);
            console.log('[useAnalyticsTracking] Resolved default share code:', data.share_code);
          } else {
            console.error('[useAnalyticsTracking] No default group found for user:', userCode);
            setResolvedShareCode(null);
          }
        } catch (e) {
          console.error('[useAnalyticsTracking] Error resolving share code:', e);
          setResolvedShareCode(null);
        }
      }
    };

    resolveCode();
  }, [userCode, shareCode]);

  // Track page view on mount (initial visit only, not for each screen)
  useEffect(() => {
    if (userCode && resolvedShareCode) {
      trackView(userCode, resolvedShareCode, contactId);
    }
  }, [userCode, resolvedShareCode, contactId]);

  // Function to track clicks
  const trackClickEvent = useCallback((target: AnalyticsClickTarget) => {
    if (userCode && resolvedShareCode) {
      trackClick(userCode, resolvedShareCode, target, contactId);
    }
  }, [userCode, resolvedShareCode, contactId]);
  
  // Function to track page views for specific screens
  const trackPageViewEvent = useCallback((page: AnalyticsPageView) => {
    if (userCode && resolvedShareCode) {
      trackPageView(userCode, resolvedShareCode, page, contactId);
    }
  }, [userCode, resolvedShareCode, contactId]);

  return { trackClickEvent, trackPageViewEvent };
}

/**
 * Hook for retrieving analytics dashboard data
 */
export function useAnalyticsDashboard(
  userCode: string,
  filters: AnalyticsFilters,
  contacts: Contact[] = [],
  customGroups: CustomGroup[] = []
) {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    let isMounted = true;
    
    async function fetchDashboard() {
      if (!userCode) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const result = await getAnalyticsDashboard(userCode, filters, contacts, customGroups);
        if (isMounted) {
          setDashboard(result);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching analytics dashboard:', err);
          setError('Failed to load analytics data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [userCode, JSON.stringify(filters), contacts.length, customGroups.length]); // Deep compare filters if needed, or just rely on object ref

  const refresh = useCallback(() => {
    setIsLoading(true);
    getAnalyticsDashboard(userCode, filters, contacts, customGroups)
      .then(setDashboard)
      .catch(e => {
        console.error('Error refreshing:', e);
        setError('Failed to refresh');
      })
      .finally(() => setIsLoading(false));
  }, [userCode, filters, contacts, customGroups]);

  return { dashboard, isLoading, error, refresh };
}


/**
 * Hook for real-time analytics stats (useful for showing live updates)
 */
export function useAnalyticsStats(userCode: string) {
  // For now, this just uses the dashboard logic but lighter?
  // Or we can keep it simple.
  const { dashboard, refresh } = useAnalyticsDashboard(userCode, { period: 'all' }); // 'all' isn't a valid period type usually? check type.
  
  return { 
    totalEvents: dashboard?.overallMetrics.totalViews || 0, 
    totalSessions: dashboard?.overallMetrics.uniqueVisitors || 0, 
    refresh 
  };
}

/**
 * Hook to check if analytics tracking is enabled
 */
export function useAnalyticsEnabled() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const disabled = localStorage.getItem('analyticsDisabled') === 'true';
    setEnabled(!disabled);
  }, []);

  const toggle = useCallback((value: boolean) => {
    setEnabled(value);
    localStorage.setItem('analyticsDisabled', value ? 'false' : 'true');
  }, []);

  return { enabled, toggle };
}