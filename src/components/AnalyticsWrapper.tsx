import React from 'react';
import { useAnalyticsTracking } from '../hooks/useAnalytics';
import { AnalyticsClickTarget } from '../types/analytics';
import { parseProfileUrl } from '../utils/user-code';

/**
 * Provider component that initializes analytics tracking for a Clik Card view
 * Place this at the root of your business card view
 */
export function AnalyticsProvider({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  // Get route info from URL
  const routeInfo = parseProfileUrl();
  
  // Track page view
  useAnalyticsTracking(
    routeInfo.userCode || '',
    routeInfo.group || '',
    undefined
  );
  
  return <>{children}</>;
}

/**
 * HOC to wrap any clickable element with analytics tracking
 */
export function withAnalyticsClick<P extends { onClick?: () => void }>(
  Component: React.ComponentType<P>,
  target: AnalyticsClickTarget
) {
  return function AnalyticsTrackedComponent(props: P) {
    const routeInfo = parseProfileUrl();
    const { trackClickEvent } = useAnalyticsTracking(
      routeInfo.userCode || '',
      routeInfo.group || '',
      undefined
    );
    
    const handleClick = () => {
      // Track the click
      trackClickEvent(target);
      
      // Call original onClick if it exists
      if (props.onClick) {
        props.onClick();
      }
    };
    
    return <Component {...props} onClick={handleClick} />;
  };
}

/**
 * Hook to get a tracked click handler
 * Use this for inline tracking without HOC
 */
export function useTrackedClick(target: AnalyticsClickTarget) {
  const routeInfo = parseProfileUrl();
  const { trackClickEvent } = useAnalyticsTracking(
    routeInfo.userCode || '',
    routeInfo.group || '',
    undefined
  );
  
  return (originalHandler?: () => void) => {
    return () => {
      // Track the click
      trackClickEvent(target);
      
      // Call original handler if provided
      if (originalHandler) {
        originalHandler();
      }
    };
  };
}
